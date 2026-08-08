import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';

/** A serialisable team card — the section's hydrated team member, projected for the roster grid. */
export interface TeamCardData {
  id: string;
  /** the member's name in the active locale. */
  name: string;
  /** the member's role in the active locale, blank when unset. */
  role: string;
  /** the member's avatar CDN url — resolved server-side (so only PLAIN data crosses into any client
   *  wrapper, never a function — RSC-safe); `''` when there is no avatar or it doesn't resolve. */
  avatarUrl: string;
  /** the first letter of the name — the gradient-initial fallback when there is no avatar (F3). */
  initial: string;
  linkedinUrl: string | null;
  githubUrl: string | null;
}

/** A member's initial, for the gradient-initial avatar fallback (F3). */
function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '·';
}

/**
 * Derive the roster cards from a section node (pure — the same projection the website's bespoke
 * `AboutIndex` team grid did, ported into the lib so `@sanad/web-ui` stays self-contained). Cards come
 * from the section's HYDRATED `team` collection (`section.collection`, attached in-service). The avatar
 * is resolved **here** (server-side) via the injected `resolveImageUrl`, so each card carries a plain
 * `avatarUrl` string — any client wrapper then receives only serialisable data (RSC-safe). Empty when
 * the section links no team members.
 */
export function deriveTeamCards(
  section: SectionNode,
  locale: Locale,
  resolveImageUrl?: (imageMediaId: string) => string,
): TeamCardData[] {
  const items =
    section.collection?.collection === 'team' ? section.collection.items : [];

  return items.map((item) => {
    const name = pickLocalized(item.name, locale);
    return {
      id: item.id,
      name,
      role: pickLocalized(item.role, locale),
      avatarUrl: item.avatarMediaId
        ? (resolveImageUrl?.(item.avatarMediaId) ?? '')
        : '',
      initial: initialOf(name),
      linkedinUrl: item.linkedinUrl,
      githubUrl: item.githubUrl,
    };
  });
}
