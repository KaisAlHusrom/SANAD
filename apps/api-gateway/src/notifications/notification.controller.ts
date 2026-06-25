import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CurrentUser,
  identityToHeaders,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type IdentityContext,
} from '@sanad/auth';
import {
  notificationListQuerySchema,
  NOTIFICATION_LIST,
  NOTIFICATION_MARK_READ,
  NOTIFICATION_PERMISSIONS,
  type Notification,
  type NotificationListQuery,
  type Paginated,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { NOTIFICATIONS_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The in-app notifications surface (MS4). Both routes are guarded by `notification.read`
 * and forward the validated identity in RMQ headers; the service scopes every read to the
 * caller (their roles ∪ id) — no client can see another audience's notices. Thin (U5).
 */
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject(NOTIFICATIONS_CLIENT) private readonly client: ClientProxy,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(NOTIFICATION_PERMISSIONS.read)
  async list(
    @CurrentUser() identity: IdentityContext,
    @Query(new ZodValidationPipe(notificationListQuerySchema))
    query: NotificationListQuery,
  ): Promise<Paginated<Notification>> {
    return this.forward(NOTIFICATION_LIST, query, identity);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(NOTIFICATION_PERMISSIONS.read)
  async markRead(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.forward(NOTIFICATION_MARK_READ, { id }, identity);
  }

  private async forward<TResult>(
    pattern: string,
    payload: object,
    identity: IdentityContext,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload, {
        headers: identityToHeaders(identity),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
