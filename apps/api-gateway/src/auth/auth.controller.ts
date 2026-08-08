import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CurrentUser, JwtAuthGuard, type IdentityContext } from '@sanad/auth';
import {
  IDENTITY_AUTH_LOGIN,
  IDENTITY_AUTH_LOGOUT,
  IDENTITY_AUTH_REFRESH,
  loginRequestSchema,
  refreshRequestSchema,
  type AuthResult,
  type LoginRequest,
  type LogoutResult,
  type RefreshRequest,
  type TokenPair,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { IDENTITY_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * Public auth surface (MS4). Thin: validates input, forwards to the identity service
 * over RMQ request/reply (MS2), and maps RMQ errors to HTTP. `/me` is the sample
 * authenticated route returning the token's identity.
 */
@Controller('auth')
export class AuthController {
  constructor(@Inject(IDENTITY_CLIENT) private readonly client: ClientProxy) {}

  @Post('login')
  login(
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
  ): Promise<AuthResult> {
    return this.call(IDENTITY_AUTH_LOGIN, body, locale);
  }

  @Post('refresh')
  refresh(
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(refreshRequestSchema)) body: RefreshRequest,
  ): Promise<TokenPair> {
    return this.call(IDENTITY_AUTH_REFRESH, body, locale);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(refreshRequestSchema)) body: RefreshRequest,
  ): Promise<LogoutResult> {
    return this.call(IDENTITY_AUTH_LOGOUT, body, locale);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() identity: IdentityContext): IdentityContext {
    return identity;
  }

  private async call<TResult>(
    pattern: string,
    payload: unknown,
    locale: Locale,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload, {
        headers: forwardHeaders(null, locale),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
