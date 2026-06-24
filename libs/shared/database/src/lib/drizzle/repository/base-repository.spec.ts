import { describe, expect, it } from 'vitest';
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { DateTimeService } from '../../date-time.js';
import { BaseRepository } from './base-repository.js';
import type { ModelConfig } from './model-config.js';
import type { RepoDb } from './repository.types.js';

const thingTable = pgTable('thing', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  secret: text('secret').notNull(),
  count: text('count'),
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

type ThingRow = typeof thingTable.$inferSelect;

/** A concrete repo exposing the protected pure methods for assertion (no DB calls). */
class ThingRepository extends BaseRepository<typeof thingTable, ThingRow> {
  constructor(config: ModelConfig<typeof thingTable>) {
    super({} as RepoDb, new DateTimeService(), config);
  }
  pubSanitize(data: Record<string, unknown>): Record<string, unknown> {
    return this.sanitize(data);
  }
  pubTransform(row: Record<string, unknown>, includeHidden = false): ThingRow {
    return this.transformRead(row, includeHidden);
  }
}

describe('BaseRepository read pipeline (N2)', () => {
  const repo = new ThingRepository({
    table: thingTable,
    hidden: ['secret'],
    casts: { count: 'number' },
    appends: { label: (row) => `#${String(row['name'])}` },
  });

  it('strips hidden fields by default and keeps them with includeHidden', () => {
    const row = { id: '1', name: 'a', secret: 's', count: '5', isActive: true };
    const out = repo.pubTransform(row);
    expect('secret' in out).toBe(false);
    const withHidden = repo.pubTransform(row, true) as Record<string, unknown>;
    expect(withHidden['secret']).toBe('s');
  });

  it('applies casts and injects computed appends', () => {
    const out = repo.pubTransform({
      id: '1',
      name: 'a',
      secret: 's',
      count: '5',
      isActive: true,
    }) as Record<string, unknown>;
    expect(out['count']).toBe(5);
    expect(out['label']).toBe('#a');
  });
});

describe('BaseRepository mass-assignment guard (N1)', () => {
  it('with fillable, keeps only allow-listed keys', () => {
    const repo = new ThingRepository({
      table: thingTable,
      fillable: ['name', 'isActive'],
    });
    expect(
      repo.pubSanitize({ name: 'a', isActive: false, id: 'x', secret: 's' }),
    ).toEqual({ name: 'a', isActive: false });
  });

  it('without fillable, denies pk + timestamps + guarded', () => {
    const repo = new ThingRepository({
      table: thingTable,
      guarded: ['secret'],
    });
    expect(
      repo.pubSanitize({
        name: 'a',
        secret: 's',
        id: 'x',
        createdAt: 'now',
        updatedAt: 'now',
        deletedAt: null,
      }),
    ).toEqual({ name: 'a' });
  });
});
