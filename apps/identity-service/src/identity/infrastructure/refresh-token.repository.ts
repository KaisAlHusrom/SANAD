import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import {
  refreshTokenTable,
  type IdentityDb,
  type RefreshTokenRow,
} from '../../db/schema/index.js';

/** Input to persist a freshly-issued refresh token (its hash, never the raw token). */
export interface NewRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
}

/** Persistence for the stateful, rotated refresh tokens (decision 3, N1). */
@Injectable()
export class RefreshTokenRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: IdentityDb,
    private readonly clock: DateTimeService,
  ) {}

  async create(input: NewRefreshToken): Promise<void> {
    await this.db.insert(refreshTokenTable).values({
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    });
  }

  async findById(id: string): Promise<RefreshTokenRow | null> {
    const rows = await this.db
      .select()
      .from(refreshTokenTable)
      .where(eq(refreshTokenTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  /** Revoke a single token (rotation / logout). */
  async revoke(id: string): Promise<void> {
    await this.db
      .update(refreshTokenTable)
      .set({ revokedAt: this.clock.nowIso() })
      .where(eq(refreshTokenTable.id, id));
  }
}
