import {
  and,
  inArray,
  isNull,
  type InferInsertModel,
  type InferSelectModel,
} from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import {
  applyFilters,
  TranslatableRepository,
  type FilterSpec,
  type FilterValues,
  type PaginateArgs,
} from '@sanad/database';
import {
  LOCALES,
  type Locale,
  type LocalizedText,
  type Paginated,
} from '@sanad/contracts';

type Row = Record<string, unknown>;

/**
 * The content-service base for every translatable entity (N5). Builds on the shared
 * `TranslatableRepository` canon (createLocalized/updateLocalized/findAllTranslations are
 * proven in the int spec) and adds the SANAD convention this service returns everywhere:
 * translatable fields resolved to BOTH locales as `LocalizedText` ({ar,en}, null-safe — F7),
 * batch-loaded N+1-safe, plus a both-locales upsert for the admin save (W6). Each concrete
 * entity repo is then a thin subclass + its model-config (U3/F9 — reuse, don't reinvent).
 */
export abstract class LocalizedRepository<
  TTable extends PgTable,
  TTrans extends PgTable,
  TSelect extends Row = InferSelectModel<TTable>,
> extends TranslatableRepository<TTable, TTrans, TSelect> {
  /** One row's translatable fields as `{ field: { ar, en } }` (null-safe, F7). */
  async localizedFieldsFor(id: string): Promise<Record<string, LocalizedText>> {
    const map = await this.localizedFieldsForMany([id]);
    return map.get(id) ?? this.emptyFields();
  }

  /** Batch: `id → { field: { ar, en } }` for many rows in ONE query (N+1-safe). */
  async localizedFieldsForMany(
    ids: readonly string[],
  ): Promise<Map<string, Record<string, LocalizedText>>> {
    const result = new Map<string, Record<string, LocalizedText>>();
    if (ids.length === 0) {
      return result;
    }
    for (const id of ids) {
      result.set(id, this.emptyFields());
    }

    const fkColumn = this.translationColumn(this.translation.foreignKey);
    const conditions = [inArray(fkColumn, [...ids])];
    const deletedAt = this.translationColumns['deletedAt'];
    if (deletedAt) {
      conditions.push(isNull(deletedAt));
    }
    const rows = (await this.db
      .select()
      .from(this.translationTable as PgTable)
      .where(and(...conditions))) as Row[];

    for (const row of rows) {
      const parentId = String(row[this.translation.foreignKey]);
      const locale = row['locale'];
      if (locale !== 'ar' && locale !== 'en') {
        continue;
      }
      const bucket = result.get(parentId);
      if (!bucket) {
        continue;
      }
      for (const field of this.translation.fields) {
        const value = row[field];
        const target = bucket[field];
        if (target && typeof value === 'string') {
          target[locale] = value;
        }
      }
    }
    return result;
  }

  /**
   * Write BOTH locales for the given translatable fields (the admin per-locale save, W6).
   * One upsert per locale on the translation table; runs on the pooled handle (collection/
   * tree writes don't need an Outbox tx — that's only the lead, MS3).
   */
  async upsertTranslations(
    id: string,
    fields: Record<string, LocalizedText>,
  ): Promise<void> {
    const names = Object.keys(fields);
    if (names.length === 0) {
      return;
    }
    for (const locale of LOCALES) {
      const values: Row = { [this.translation.foreignKey]: id, locale };
      for (const name of names) {
        values[name] = fields[name]?.[locale] ?? '';
      }
      await this.db
        .insert(this.translationTable as PgTable)
        .values(values as InferInsertModel<TTrans>)
        .onConflictDoUpdate({
          target: [
            this.translationColumn(this.translation.foreignKey),
            this.translationColumn('locale'),
          ],
          set: this.translationSet(names, fields, locale),
        });
    }
  }

  /** Paginate with whitelisted filters + cross-locale search (N7), returning base rows. */
  async listFiltered(
    values: FilterValues,
    spec: FilterSpec,
    args: PaginateArgs,
  ): Promise<Paginated<TSelect>> {
    const query = await applyFilters(this.query(), values, spec, this);
    return query.paginate(args);
  }

  // ===== helpers =====
  private translationSet(
    names: string[],
    fields: Record<string, LocalizedText>,
    locale: Locale,
  ): Partial<InferInsertModel<TTrans>> {
    const set: Row = { updatedAt: this.dateTime.now().toJSDate() };
    for (const name of names) {
      set[name] = fields[name]?.[locale] ?? '';
    }
    return set as Partial<InferInsertModel<TTrans>>;
  }

  private emptyFields(): Record<string, LocalizedText> {
    const out: Record<string, LocalizedText> = {};
    for (const field of this.translation.fields) {
      out[field] = { ar: '', en: '' };
    }
    return out;
  }
}
