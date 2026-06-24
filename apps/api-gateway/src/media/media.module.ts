import { Module } from '@nestjs/common';
import { MediaController } from './media.controller.js';

/** The media surface (signed upload + library + folders). Uses the global CoreModule. */
@Module({
  controllers: [MediaController],
})
export class MediaModule {}
