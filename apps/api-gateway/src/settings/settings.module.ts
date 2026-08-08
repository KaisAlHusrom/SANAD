import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller.js';

/** The descriptor-driven settings surface (guarded catalog read + batch write). */
@Module({
  controllers: [SettingsController],
})
export class SettingsModule {}
