import { Module } from '@nestjs/common';
import { BrandingController } from './branding.controller.js';

/** The branding surface (public read + guarded write). Uses the global CoreModule. */
@Module({
  controllers: [BrandingController],
})
export class BrandingModule {}
