import type { LocalizedText } from '../common/localized-text.js';

/**
 * A team member as the gateway returns it (the About page, WEB1). `slug` is the unique key
 * (a future detail page). The translatable `name`/`role`/`bio` are carried in BOTH locales
 * (`LocalizedText`, null-safe — F7); `name` localizes because the bilingual site shows both
 * scripts. `avatarMediaId` is a soft media reference (NOT a cross-service FK, MS5). Pure shape (U16).
 */
export interface TeamMemberItem {
  id: string;
  slug: string;
  avatarMediaId: string | null;
  email: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  sortOrder: number;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
