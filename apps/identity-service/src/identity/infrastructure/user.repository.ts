import { Inject, Injectable } from '@nestjs/common';
import {
  BaseRepository,
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { ListQuery, Paginated } from '@sanad/contracts';
import type { DbExecutor } from '../../db/executor.js';
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

/** A new user to persist (admin create) — password is pre-hashed by the service. */
export interface UserInsertInput {
  email: string;
  name: string;
  password: string;
  isActive: boolean;
}

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

  /** A live user by email (password stripped), or null — for the create/update conflict check. */
  findByEmail(email: string): Promise<UserRow | null> {
    return this.where('email', 'eq', email).first();
  }

  /**
   * Insert a user on the caller's executor (composes inside the create transaction so the
   * row + its role assignments commit together, N14). The argon2 hash is set explicitly here
   * (it is not mass-assignable, N2).
   */
  async insert(exec: DbExecutor, input: UserInsertInput): Promise<UserRow> {
    const rows = await exec
      .insert(userTable)
      .values({
        email: input.email,
        name: input.name,
        password: input.password,
        isActive: input.isActive,
      })
      .returning();
    const row = rows[0];
    if (!row) {
      throw new Error('user insert returned no row');
    }
    return row;
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
