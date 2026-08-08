import { Injectable } from '@nestjs/common';
import type {
  BlogTagCreateRequest,
  BlogTagItem,
  BlogTagListQuery,
  BlogTagUpdateRequest,
  ContentId,
  Paginated,
} from '@sanad/contracts';
import { blogTagTable, type BlogTagRow } from '../../../db/schema/index.js';
import { BlogTagRepository } from '../../infrastructure/persistence/repositories/blog-tag.repository.js';
import { assembleBlogTag } from '../assemblers/blog-tag.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';

type BlogTagInsert = typeof blogTagTable.$inferInsert;

/**
 * The blog-tags lookup (WEB1) — translatable CRUD on the shared canon. Reads return both locales
 * (F7); writes save both locales (W6). Slug uniqueness is checked to return a clean 409.
 */
@Injectable()
export class BlogTagService {
  constructor(private readonly tags: BlogTagRepository) {}

  async list(query: BlogTagListQuery): Promise<Paginated<BlogTagItem>> {
    const page = await this.tags.list(query);
    const fields = await this.tags.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) => assembleBlogTag(row, fields.get(row.id))),
      meta: page.meta,
    };
  }

  async create(req: BlogTagCreateRequest): Promise<BlogTagItem> {
    await this.assertSlugFree(req.slug, undefined);
    const created = await this.tags.create({
      slug: req.slug,
      sortOrder: req.sortOrder,
    });
    await this.tags.upsertTranslations(created.id, { name: req.name });
    return this.byId(created.id);
  }

  async update(req: BlogTagUpdateRequest): Promise<BlogTagItem> {
    const existing = await this.tags.find(req.id);
    if (!existing) {
      throw contentNotFound('BlogTag', req.id);
    }
    if (req.slug !== undefined) {
      await this.assertSlugFree(req.slug, req.id);
    }

    const base: Partial<BlogTagInsert> = {};
    if (req.slug !== undefined) base.slug = req.slug;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (Object.keys(base).length > 0) {
      await this.tags.update(req.id, base);
    }

    if (req.name) {
      await this.tags.upsertTranslations(req.id, { name: req.name });
    }

    return this.byId(req.id);
  }

  /** Atomically renumber sortOrder to match the given id order (drag-and-drop reorder, U21). */
  reorder(ids: string[]): Promise<void> {
    return this.tags.reorderByIds(ids);
  }

  async delete(id: string): Promise<ContentId> {
    const existing = await this.tags.find(id);
    if (!existing) {
      throw contentNotFound('BlogTag', id);
    }
    await this.tags.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<BlogTagItem> {
    const row = await this.tags.findOrFail(id);
    const fields = await this.tags.localizedFieldsFor(id);
    return assembleBlogTag(row, fields);
  }

  private async assertSlugFree(
    slug: string,
    id: string | undefined,
  ): Promise<void> {
    const existing: BlogTagRow | null = await this.tags.findBySlug(slug);
    if (existing && existing.id !== id) {
      throw slugConflict(slug);
    }
  }
}
