import { Inject, Injectable } from '@nestjs/common';
import {
  BaseRepository,
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { ListQuery, Paginated } from '@sanad/contracts';
import {
  userTable,
  type IdentityDb,
  type UserRow,
} from '../../db/schema/index.js';
import { userModelConfig } from './user.model-config.js';

/** Whitelisted free-text search over the user list (N7). */
const USER_FILTERS: FilterSpec = {
  search: { kind: 'search', columns: ['email', 'name'] },
};

/**
 * User persistence (N1) on the enhanced base repository. Generic reads strip the hidden
 * `password` (N2); credential checks read it explicitly via `withHidden()`.
 */
@Injectable()
export class UserRepository extends BaseRepository<typeof userTable, UserRow> {
  constructor(@Inject(DRIZZLE) db: IdentityDb, dateTime: DateTimeService) {
    super(db, dateTime, userModelConfig);
  }

  /** A live user by id (password stripped), or null. */
  findById(id: string): Promise<UserRow | null> {
    return this.find(id);
  }

  /** The live user with this email INCLUDING the password hash — for credential checks. */
  findByEmailWithSecret(email: string): Promise<UserRow | null> {
    return this.where('email', 'eq', email).withHidden().first();
  }

  /** A paginated, searchable list of live users (password stripped). */
  list(query: ListQuery): Promise<Paginated<UserRow>> {
    return this.paginateFiltered(
      { search: query.search },
      USER_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
