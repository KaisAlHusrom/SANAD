import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';

/** The admin dashboard aggregation surface. Uses the global CoreModule RMQ clients. */
@Module({
  controllers: [DashboardController],
})
export class DashboardModule {}
