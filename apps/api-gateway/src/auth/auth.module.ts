import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';

/** Public auth routes (login/refresh/logout/me). Uses the global CoreModule. */
@Module({
  controllers: [AuthController],
})
export class AuthModule {}
