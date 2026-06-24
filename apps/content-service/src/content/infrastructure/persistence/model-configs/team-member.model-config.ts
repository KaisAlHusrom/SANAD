import type { ModelConfig } from '@sanad/database';
import {
  teamMemberTable,
  teamMemberTranslationTable,
} from '../../../../db/schema/index.js';

/** Team-member model config (N1). name/role/bio are translatable (N5). */
export const teamMemberModelConfig: ModelConfig<typeof teamMemberTable> = {
  table: teamMemberTable,
  fillable: [
    'slug',
    'avatarMediaId',
    'email',
    'linkedinUrl',
    'githubUrl',
    'featured',
    'sortOrder',
  ],
  softDeletes: true,
  translatable: {
    table: teamMemberTranslationTable,
    foreignKey: 'teamMemberId',
    fields: ['name', 'role', 'bio'],
  },
};
