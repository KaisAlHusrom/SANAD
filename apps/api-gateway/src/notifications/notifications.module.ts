import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller.js';

/** The in-app notifications surface (guarded read + mark-read). Uses the global CoreModule. */
@Module({
  controllers: [NotificationController],
})
export class NotificationsModule {}
