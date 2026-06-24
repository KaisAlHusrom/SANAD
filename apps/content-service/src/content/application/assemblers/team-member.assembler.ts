import type { LocalizedText, TeamMemberItem } from '@sanad/contracts';
import type { TeamMemberRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Assemble a team member with its translatable copy resolved to both locales (F7). */
export function assembleTeamMember(
  row: TeamMemberRow,
  fields: Record<string, LocalizedText> | undefined,
): TeamMemberItem {
  return {
    id: row.id,
    slug: row.slug,
    avatarMediaId: row.avatarMediaId,
    email: row.email,
    linkedinUrl: row.linkedinUrl,
    githubUrl: row.githubUrl,
    featured: row.featured,
    sortOrder: row.sortOrder,
    name: fields?.['name'] ?? EMPTY,
    role: fields?.['role'] ?? EMPTY,
    bio: fields?.['bio'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
