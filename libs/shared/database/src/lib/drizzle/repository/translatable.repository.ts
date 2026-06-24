import {
  and,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNull,
  type Column,
  type InferInsertModel,
  type InferSelectModel,
} from 'drizzle-orm';
import type { IndexColumn, PgTable } from 'drizzle-orm/pg-core';
import type { Locale, Paginated } from '@sanad/contracts';
import type { DateTimeService } from '../../date-time.js';
import { applyFilters, type FilterValues } from './apply-filters.js';
import { BaseRepository } from './base-repository.js';
import type { FilterSpec } from './filter-spec.js';
import type { ModelConfig, TranslatableConfig } from './model-config.js';
import type { PaginateArgs, RepoDb } from './repository.types.js';

type Row = Record<string, unknown>;

/**
 * Base repository for entities whose translatable columns live in a dedicated
 * `*_translations` table (N5). Adds locale-aware writes and N+1-safe batch translation
 * merging on reads. The translation table is passed in typed so all Drizzle
 * inserts/upserts stay fully checked. Ported from the smart-restaurant canon (no
 * injected EventBus; cross-service events go via the Outbox, MS3).
 */
export abstract class TranslatableRepository<
  TTable extends PgTable,
  TTrans extends PgTable,
  TSelect extends Row = InferSelectModel<TTable>,
  TInsert extends Row = InferInsertModel<TTable>,
  TUpdate extends Row = Partial<TInsert>,
> extends BaseRepository<TTable, TSelect, TInsert, TUpdate> {
  protected readonly translation: TranslatableConfig;
  protected readonly translationColumns: Record<string, Column>;

  constructor(
    db: RepoDb,
    dateTime: DateTimeService,
    config: ModelConfig<TTable>,
    protected readonly translationTable: TTrans,
  ) {
    super(db, dateTime, config);
    if (!config.translatable) {
      throw new Error(
        `TranslatableRepository requires config.translatable on ${this.tableName}`,
      );
    }
    this.translation = config.translatable;
    this.translationColumns = getTableColumns(translationTable);
  }

  /** Create a base row + its translation row for one locale (base hooks still fire). */
  async createLocalized(data: Row, locale: Locale): Promise<TSelect> {
    const { base, translated } = this.splitFields(data);
    const created = await this.create(base as TInsert);
    const parentId = String(created[this.pkName]);
    await this.db.insert(this.translationTable as PgTable).values({
      [this.translation.foreignKey]: parentId,
      locale,
      ...translated,
    } as InferInsertModel<TTrans>);
    return { ...created, ...translated } as TSelect;
  }

  /** Update base columns and upsert the translation row for one locale. */
  async updateLocalized(
    id: string,
    data: Row,
    locale: Locale,
  ): Promise<TSelect> {
    const { base, translated } = this.splitFields(data);
    if (Object.keys(base).length > 0) {
      await this.update(id, base as TUpdate);
    }
    if (Object.keys(translated).length > 0) {
      await this.db
        .insert(this.translationTable as PgTable)
        .values({
          [this.translation.foreignKey]: id,
          locale,
          ...translated,
        } as InferInsertModel<TTrans>)
        .onConflictDoUpdate({
          target: [
            this.translationColumn(this.translation.foreignKey),
            this.translationColumn('locale'),
          ],
          set: translated as Partial<InferInsertModel<TTrans>>,
        });
    }
    const merged = await this.findLocalized(id, locale);
    if (!merged) {
      return { ...translated } as TSelect;
    }
    return merged;
  }

  /** Find one row with its translation for the given locale merged on. */
  async findLocalized(id: string, locale: Locale): Promise<TSelect | null> {
    const row = await this.find(id);
    if (!row) {
      return null;
    }
    const merged = await this.mergeTranslations([row], locale);
    return merged[0] ?? null;
  }

  /** Paginate, then batch-merge translations for the given locale (N+1-safe). */
  async paginateLocalized(
    args: PaginateArgs,
    locale: Locale,
  ): Promise<Paginated<TSelect>> {
    const page = await this.paginate(args);
    const items = await this.mergeTranslations(page.items, locale);
    return { items, meta: page.meta };
  }

  /** Paginate with whitelisted filters + search, then batch-merge translations (N7 + N5). */
  async paginateFilteredLocalized(
    values: FilterValues,
    spec: FilterSpec,
    args: PaginateArgs,
    locale: Locale,
  ): Promise<Paginated<TSelect>> {
    const query = await applyFilters(this.query(), values, spec, this);
    const page = await query.paginate(args);
    const items = await this.mergeTranslations(page.items, locale);
    return { items, meta: page.meta };
  }

  /**
   * Batch-merge: one query loads all translations for the page's ids in the active
   * locale, then each row gets its translatable fields spread on (N+1-safe).
   */
  async mergeTranslations(rows: TSelect[], locale: Locale): Promise<TSelect[]> {
    if (rows.length === 0) {
      return rows;
    }
    const ids = rows.map((row) => String(row[this.pkName]));
    const fkColumn = this.translationColumn(this.translation.foreignKey);
    const localeColumn = this.translationColumn('locale');
    const conditions = [eq(localeColumn, locale), inArray(fkColumn, ids)];
    const deletedAt = this.translationColumns['deletedAt'];
    if (deletedAt) {
      conditions.push(isNull(deletedAt));
    }

    const translations = (await this.db
      .select()
      .from(this.translationTable as PgTable)
      .where(and(...conditions))) as Row[];

    const byParent = new Map<string, Row>();
    for (const translation of translations) {
      byParent.set(
        String(translation[this.translation.foreignKey]),
        translation,
      );
    }

    return rows.map((row) => {
      const translation = byParent.get(String(row[this.pkName]));
      if (!translation) {
        return row;
      }
      const merged: Row = { ...row };
      for (const field of this.translation.fields) {
        merged[field] = translation[field];
      }
      return merged as TSelect;
    });
  }

  /**
   * Load every translation row for one entity and return its translatable fields as
   * per-locale maps, e.g. `{ name: { en: 'Beef', ar: 'لحم' } }` (N5). Reads normally
   * resolve a single locale (`findLocalized`); this exposes the full set for admin
   * multi-locale edit forms. Every configured field is present as a key (empty `{}` when
   * untranslated in all locales).
   */
  async findAllTranslations(
    id: string,
  ): Promise<Record<string, Partial<Record<Locale, string>>>> {
    const fkColumn = this.translationColumn(this.translation.foreignKey);
    const conditions = [eq(fkColumn, id)];
    const deletedAt = this.translationColumns['deletedAt'];
    if (deletedAt) {
      conditions.push(isNull(deletedAt));
    }
    const rows = (await this.db
      .select()
      .from(this.translationTable as PgTable)
      .where(and(...conditions))) as Row[];

    const out: Record<string, Partial<Record<Locale, string>>> = {};
    for (const field of this.translation.fields) {
      out[field] = {};
    }
    for (const row of rows) {
      const locale = row['locale'] as Locale;
      for (const field of this.translation.fields) {
        const bucket = out[field];
        const value = row[field];
        if (bucket && typeof value === 'string') {
          bucket[locale] = value;
        }
      }
    }
    return out;
  }

  /** Parent ids whose translatable field matches the term in ANY locale (cross-locale search). */
  async searchAcrossLocales(field: string, term: string): Promise<string[]> {
    const fieldColumn = this.translationColumn(field);
    const fkColumn = this.translationColumn(this.translation.foreignKey);
    const conditions = [ilike(fieldColumn, `%${term}%`)];
    const deletedAt = this.translationColumns['deletedAt'];
    if (deletedAt) {
      conditions.push(isNull(deletedAt));
    }
    const rows = await this.db
      .selectDistinct({ key: fkColumn })
      .from(this.translationTable as PgTable)
      .where(and(...conditions));
    return rows.map((row) => String(row.key));
  }

  // ===== helpers =====
  private splitFields(data: Row): { base: Row; translated: Row } {
    const translatableFields = new Set(this.translation.fields);
    const base: Row = {};
    const translated: Row = {};
    for (const [key, value] of Object.entries(data)) {
      if (translatableFields.has(key)) {
        translated[key] = value;
      } else {
        base[key] = value;
      }
    }
    return { base, translated };
  }

  protected translationColumn(name: string): IndexColumn {
    const column = this.translationColumns[name];
    if (!column) {
      throw new Error(
        `Unknown translation column '${name}' on ${this.tableName}`,
      );
    }
    return column as IndexColumn;
  }
}
