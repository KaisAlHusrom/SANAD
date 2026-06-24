import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
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
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { AuthService } from '../application/auth.service.js';

/** RMQ entrypoints for auth (MS2). Thin — validates the payload and delegates (U5/N7). */
@Controller()
export class AuthMessageController {
  constructor(private readonly auth: AuthService) {}

  @MessagePattern(IDENTITY_AUTH_LOGIN)
  login(
    @Payload(new ZodValidationPipe(loginRequestSchema)) input: LoginRequest,
  ): Promise<AuthResult> {
    return this.auth.login(input);
  }

  @MessagePattern(IDENTITY_AUTH_REFRESH)
  refresh(
    @Payload(new ZodValidationPipe(refreshRequestSchema)) input: RefreshRequest,
  ): Promise<TokenPair> {
    return this.auth.refresh(input);
  }

  @MessagePattern(IDENTITY_AUTH_LOGOUT)
  logout(
    @Payload(new ZodValidationPipe(refreshRequestSchema)) input: RefreshRequest,
  ): Promise<LogoutResult> {
    return this.auth.logout(input);
  }
}
