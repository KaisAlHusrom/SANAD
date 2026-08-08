import { Injectable } from '@nestjs/common';
import type {
  ContentId,
  LocalizedText,
  Paginated,
  PortfolioCategoryCreateRequest,
  PortfolioCategoryItem,
  PortfolioCategoryListQuery,
  PortfolioCategoryUpdateRequest,
} from '@sanad/contracts';
import {
  portfolioCategoryTable,
  type PortfolioCategoryRow,
} from '../../../db/schema/index.js';
import { PortfolioCategoryRepository } from '../../infrastructure/persistence/repositories/portfolio-category.repository.js';
import { assemblePortfolioCategory } from '../assemblers/portfolio-category.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';

type PortfolioCategoryInsert = typeof portfolioCategoryTable.$inferInsert;

/**
 * The portfolio-categories lookup (WEB1) — translatable CRUD on the shared canon. Reads return
 * both locales (F7); writes save both locales (W6). Slug uniqueness is checked to return a clean
 * 409.
 */
@Injectable()
export class PortfolioCategoryService {
  constructor(private readonly categories: PortfolioCategoryRepository) {}

  /** Paginated, searchable list (public website filter + admin). */
  async list(
    query: PortfolioCategoryListQuery,
  ): Promise<Paginated<PortfolioCategoryItem>> {
    const page = await this.categories.list(query);
    const fields = await this.categories.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) =>
        assemblePortfolioCategory(row, fields.get(row.id)),
      ),
      meta: page.meta,
    };
  }

  /** Create a portfolio category + both-locale name (admin). */
  async create(
    req: PortfolioCategoryCreateRequest,
  ): Promise<PortfolioCategoryItem> {
    await this.assertSlugFree(req.slug, undefined);
    const created = await this.categories.create({
      slug: req.slug,
      sortOrder: req.sortOrder,
    });
    await this.categories.upsertTranslations(created.id, { name: req.name });
    return this.byId(created.id);
  }

  /** Update a portfolio category by id (admin). Only provided fields change. */
  async update(
    req: PortfolioCategoryUpdateRequest,
  ): Promise<PortfolioCategoryItem> {
    const existing = await this.categories.find(req.id);
    if (!existing) {
      throw contentNotFound('PortfolioCategory', req.id);
    }
    if (req.slug !== undefined) {
      await this.assertSlugFree(req.slug, req.id);
    }

    const base: Partial<PortfolioCategoryInsert> = {};
    if (req.slug !== undefined) base.slug = req.slug;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (Object.keys(base).length > 0) {
      await this.categories.update(req.id, base);
    }

    const translations: Record<string, LocalizedText> = {};
    if (req.name) translations['name'] = req.name;
    if (Object.keys(translations).length > 0) {
      await this.categories.upsertTranslations(req.id, translations);
    }

    return this.byId(req.id);
  }

  /** Atomically renumber sortOrder to match the given id order (drag-and-drop reorder, U21). */
  reorder(ids: string[]): Promise<void> {
    return this.categories.reorderByIds(ids);
  }

  /** Soft-delete a portfolio category (admin). Projects keep the (now-dangling) FK → set null. */
  async delete(id: string): Promise<ContentId> {
    const existing = await this.categories.find(id);
    if (!existing) {
      throw contentNotFound('PortfolioCategory', id);
    }
    await this.categories.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<PortfolioCategoryItem> {
    const row = await this.categories.findOrFail(id);
    const fields = await this.categories.localizedFieldsFor(id);
    return assemblePortfolioCategory(row, fields);
  }

  private async assertSlugFree(
    slug: string,
    id: string | undefined,
  ): Promise<void> {
    const existing: PortfolioCategoryRow | null =
      await this.categories.findBySlug(slug);
    if (existing && existing.id !== id) {
      throw slugConflict(slug);
    }
  }
}
