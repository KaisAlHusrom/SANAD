import { Controller, UnauthorizedException } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { identityFromHeaders, type IdentityContext } from '@sanad/auth';
import {
  notificationListQuerySchema,
  notificationMarkReadSchema,
  NOTIFICATION_LIST,
  NOTIFICATION_MARK_READ,
  type Notification,
  type NotificationListQuery,
  type NotificationMarkRead,
  type Paginated,
} from '@sanad/contracts';
import { readMessageHeaders } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { NotificationQueryService } from '../application/services/index.js';

/**
 * RMQ entrypoints for the in-app notifications surface (MS2). Thin — validate, read the
 * gateway-forwarded identity (MS4), delegate (U5). The gateway guards both routes with
 * `notification.read`; the service additionally scopes every read to the caller.
 */
@Controller()
export class NotificationMessageController {
  constructor(private readonly query: NotificationQueryService) {}

  @MessagePattern(NOTIFICATION_LIST)
  list(
    @Payload(new ZodValidationPipe(notificationListQuerySchema))
    query: NotificationListQuery,
    @Ctx() context: RmqContext,
  ): Promise<Paginated<Notification>> {
    return this.query.list(this.identity(context), query);
  }

  @MessagePattern(NOTIFICATION_MARK_READ)
  markRead(
    @Payload(new ZodValidationPipe(notificationMarkReadSchema))
    body: NotificationMarkRead,
    @Ctx() context: RmqContext,
  ): Promise<Notification> {
    return this.query.markRead(this.identity(context), body.id);
  }

  /** The gateway-validated identity, forwarded in RMQ headers (MS4). */
  private identity(context: RmqContext): IdentityContext {
    const identity = identityFromHeaders(readMessageHeaders(context));
    if (!identity) {
      throw new UnauthorizedException('Missing forwarded identity');
    }
    return identity;
  }
}
