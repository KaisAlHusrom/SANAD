import type { ModelConfig } from '@sanad/database';
import {
  testimonialTable,
  testimonialTranslationTable,
} from '../../../../db/schema/index.js';

/** Testimonial model config (N1). quote/authorRole/companyDescriptor are translatable (N5). */
export const testimonialModelConfig: ModelConfig<typeof testimonialTable> = {
  table: testimonialTable,
  fillable: [
    'authorName',
    'companyName',
    'avatarMediaId',
    'rating',
    'featured',
    'sortOrder',
  ],
  softDeletes: true,
  translatable: {
    table: testimonialTranslationTable,
    foreignKey: 'testimonialId',
    fields: ['quote', 'authorRole', 'companyDescriptor'],
  },
};
