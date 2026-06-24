import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { Paginated, TeamMemberListQuery } from '@sanad/contracts';
import {
  teamMemberTable,
  teamMemberTranslationTable,
  type ContentDb,
  type TeamMemberRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { teamMemberModelConfig } from '../model-configs/team-member.model-config.js';

/**
 * Whitelisted team-member list filters (N7): free-text search across the translatable
 * `name`/`role` (any locale) + an exact `featured` flag. Never raw column passthrough.
 */
const TEAM_MEMBER_FILTERS: FilterSpec = {
  search: { kind: 'search', columns: [], translatableFields: ['name', 'role'] },
  featured: { kind: 'column', field: 'featured', op: 'eq' },
};

/**
 * Team-member persistence (N1) on the translatable base. Owns base-row CRUD + the whitelisted
 * list + slug lookup; name/role/bio are translatable (N5).
 */
@Injectable()
export class TeamMemberRepository extends LocalizedRepository<
  typeof teamMemberTable,
  typeof teamMemberTranslationTable,
  TeamMemberRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, teamMemberModelConfig, teamMemberTranslationTable);
  }

  /** A live team member by its unique slug, or null. */
  findBySlug(slug: string): Promise<TeamMemberRow | null> {
    return this.where('slug', 'eq', slug).first();
  }

  /** Live team members for a set of ids (the blog-post author embed; caller maps by id). */
  findByIds(ids: readonly string[]): Promise<TeamMemberRow[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('id', [...ids]).all();
  }

  /** A paginated, searchable, featured-filterable list of live team members (base rows). */
  list(query: TeamMemberListQuery): Promise<Paginated<TeamMemberRow>> {
    return this.listFiltered(
      { search: query.search, featured: query.featured },
      TEAM_MEMBER_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
