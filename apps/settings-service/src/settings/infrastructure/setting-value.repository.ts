import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { BaseRepository, DateTimeService, DRIZZLE } from '@sanad/database';
import type { SettingScope } from '@sanad/contracts';
import type { DbExecutor } from '../../db/executor.js';
import {
  settingValueTable,
  type SettingScalar,
  type SettingsDb,
  type SettingValueRow,
} from '../../db/schema/index.js';
import { settingValueModelConfig } from './setting-value.model-config.js';

/** Build the scope predicate: global (scopeId IS NULL) or a specific scoped id. */
function scopeWhere(scope: SettingScope, scopeId: string | null) {
  return scope === 'global'
    ? and(
        eq(settingValueTable.scope, 'global'),
        isNull(settingValueTable.scopeId),
      )
    : and(
        eq(settingValueTable.scope, scope),
        eq(settingValueTable.scopeId, scopeId ?? ''),
      );
}

/**
 * The scope-keyed setting **values** repository (N1) on the enhanced base. Reads resolve
 * override→global via the fluent builder (soft-delete scope applied by the base, N2).
 * `upsert` writes one value per (setting, scope) honoring the partial-unique indexes via
 * a find-then-write, on the caller's executor so it composes inside a transaction (MS3).
 */
@Injectable()
export class SettingValueRepository extends BaseRepository<
  typeof settingValueTable,
  SettingValueRow
> {
  constructor(@Inject(DRIZZLE) db: SettingsDb, dateTime: DateTimeService) {
    super(db, dateTime, settingValueModelConfig);
  }

  /** The single value for a setting at a scope (or null). */
  findOne(
    settingId: string,
    scope: SettingScope,
    scopeId: string | null,
  ): Promise<SettingValueRow | null> {
    const scoped = this.where('settingId', 'eq', settingId).where(
      'scope',
      'eq',
      scope,
    );
    const q =
      scope === 'global'
        ? scoped.where('scopeId', 'isNull', null)
        : scoped.where('scopeId', 'eq', scopeId ?? '');
    return q.first();
  }

  /** All values for a set of settings at a scope (bulk, avoids N+1). */
  findForSettings(
    settingIds: readonly string[],
    scope: SettingScope,
    scopeId: string | null,
  ): Promise<SettingValueRow[]> {
    if (settingIds.length === 0) {
      return Promise.resolve([]);
    }
    const scoped = this.whereIn('settingId', [...settingIds]).where(
      'scope',
      'eq',
      scope,
    );
    const q =
      scope === 'global'
        ? scoped.where('scopeId', 'isNull', null)
        : scoped.where('scopeId', 'eq', scopeId ?? '');
    return q.all();
  }

  /** Insert or update the value for a (setting, scope); runs on the given executor. */
  async upsert(
    exec: DbExecutor,
    settingId: string,
    scope: SettingScope,
    scopeId: string | null,
    value: SettingScalar | null,
  ): Promise<SettingValueRow> {
    const existing = await exec
      .select()
      .from(settingValueTable)
      .where(
        and(
          eq(settingValueTable.settingId, settingId),
          scopeWhere(scope, scopeId),
        ),
      )
      .limit(1);
    const current = existing[0];
    if (current) {
      const updated = await exec
        .update(settingValueTable)
        .set({ value, updatedAt: this.dateTime.now().toJSDate() })
        .where(eq(settingValueTable.id, current.id))
        .returning();
      const row = updated[0];
      if (!row) {
        throw new Error(`No setting_value to update for id ${current.id}`);
      }
      return row;
    }
    const inserted = await exec
      .insert(settingValueTable)
      .values({
        settingId,
        scope,
        scopeId: scope === 'global' ? null : scopeId,
        value,
      })
      .returning();
    const row = inserted[0];
    if (!row) {
      throw new Error('setting_value insert returned no row');
    }
    return row;
  }
}
