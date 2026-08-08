import type { Paginated, TeamMemberItem } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read the team members the About page's team grid renders (WEB1). Public gateway read;
 * cached + tagged. Default 12 covers the seeded team with headroom.
 */
export async function getTeamMembers(limit = 12): Promise<TeamMemberItem[]> {
  const page = await fetchEnvelope<Paginated<TeamMemberItem>>(
    `/content/team?pageSize=${limit}`,
    { revalidate: 60, tags: ['content', 'team'] },
  );
  return page.items;
}
