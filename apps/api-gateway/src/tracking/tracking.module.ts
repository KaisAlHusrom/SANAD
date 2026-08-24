import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller.js';

/** The public tracking-config surface. Uses the global CoreModule. */
@Module({
  controllers: [TrackingController],
})
export class TrackingModule {}
