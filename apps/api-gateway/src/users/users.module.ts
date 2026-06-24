import { Module } from '@nestjs/common';
import { IdentityUsersController } from './identity-users.controller.js';

/** The RBAC-guarded users surface. Uses the global CoreModule. */
@Module({
  controllers: [IdentityUsersController],
})
export class UsersModule {}
