import { Injectable } from '@nestjs/common';
import type {
  BlogCategoryCreateRequest,
  BlogCategoryItem,
  BlogCategoryListQuery,
  BlogCategoryUpdateRequest,
  ContentId,
  LocalizedText,
  Paginated,
} from '@sanad/contracts';
import {
  blogCategoryTable,
  type BlogCategoryRow,
} from '../../../db/schema/index.js';
import { BlogCategoryRepository } from '../../infrastructure/persistence/repositories/blog-category.repository.js';
import { assembleBlogCategory } from '../assemblers/blog-category.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';

type BlogCategoryInsert = typeof blogCategoryTable.$inferInsert;

/**
 * The blog-categories lookup (WEB1) — translatable CRUD on the shared canon. Reads return both
 * locales (F7); writes save both locales (W6). Slug uniqueness is checked to return a clean 409.
 */
@Injectable()
export class BlogCategoryService {
  constructor(private readonly categories: BlogCategoryRepository) {}

  async list(
    query: BlogCategoryListQuery,
  ): Promise<Paginated<BlogCategoryItem>> {
    const page = await this.categories.list(query);
    const fields = await this.categories.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) =>
        assembleBlogCategory(row, fields.get(row.id)),
      ),
      meta: page.meta,
    };
  }

  async create(req: BlogCategoryCreateRequest): Promise<BlogCategoryItem> {
    await this.assertSlugFree(req.slug, undefined);
    const created = await this.categories.create({
      slug: req.slug,
      sortOrder: req.sortOrder,
    });
    await this.categories.upsertTranslations(created.id, {
      name: req.name,
      description: req.description ?? { ar: '', en: '' },
    });
    return this.byId(created.id);
  }

  async update(req: BlogCategoryUpdateRequest): Promise<BlogCategoryItem> {
    const existing = await this.categories.find(req.id);
    if (!existing) {
      throw contentNotFound('BlogCategory', req.id);
    }
    if (req.slug !== undefined) {
      await this.assertSlugFree(req.slug, req.id);
    }

    const base: Partial<BlogCategoryInsert> = {};
    if (req.slug !== undefined) base.slug = req.slug;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (Object.keys(base).length > 0) {
      await this.categories.update(req.id, base);
    }

    const translations: Record<string, LocalizedText> = {};
    if (req.name) translations['name'] = req.name;
    if (req.description) translations['description'] = req.description;
    if (Object.keys(translations).length > 0) {
      await this.categories.upsertTranslations(req.id, translations);
    }

    return this.byId(req.id);
  }

  /** Atomically renumber sortOrder to match the given id order (drag-and-drop reorder, U21). */
  reorder(ids: string[]): Promise<void> {
    return this.categories.reorderByIds(ids);
  }

  async delete(id: string): Promise<ContentId> {
    const existing = await this.categories.find(id);
    if (!existing) {
      throw contentNotFound('BlogCategory', id);
    }
    await this.categories.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<BlogCategoryItem> {
    const row = await this.categories.findOrFail(id);
    const fields = await this.categories.localizedFieldsFor(id);
    return assembleBlogCategory(row, fields);
  }

  private async assertSlugFree(
    slug: string,
    id: string | undefined,
  ): Promise<void> {
    const existing: BlogCategoryRow | null =
      await this.categories.findBySlug(slug);
    if (existing && existing.id !== id) {
      throw slugConflict(slug);
    }
  }
}
