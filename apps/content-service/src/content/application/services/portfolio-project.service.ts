import { Injectable } from '@nestjs/common';
import { DateTimeService } from '@sanad/database';
import type {
  ContentId,
  LocalizedText,
  Paginated,
  PortfolioCategoryRef,
  PortfolioCreateRequest,
  PortfolioListQuery,
  PortfolioProjectItem,
  PortfolioUpdateRequest,
} from '@sanad/contracts';
import {
  portfolioProjectTable,
  type PortfolioProjectRow,
} from '../../../db/schema/index.js';
import { PortfolioCategoryRepository } from '../../infrastructure/persistence/repositories/portfolio-category.repository.js';
import { PortfolioProjectRepository } from '../../infrastructure/persistence/repositories/portfolio-project.repository.js';
import { assemblePortfolioProject } from '../assemblers/portfolio-project.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';

type PortfolioProjectInsert = typeof portfolioProjectTable.$inferInsert;

const EMPTY: LocalizedText = { ar: '', en: '' };

/**
 * The portfolio projects / case studies collection (WEB1) — translatable CRUD on the shared
 * canon. Reads embed the category (embed-on-read) and resolve copy to both locales (F7); writes
 * take `categoryId` (ids-on-write) and save both locales (W6). `publishedAt` is server-managed:
 * set the first time the project is published (via the DateTime service, never `new Date()` —
 * N3). Visibility is gated by `status` — the gateway forces `published` on the public path.
 */
@Injectable()
export class PortfolioProjectService {
  constructor(
    private readonly projects: PortfolioProjectRepository,
    private readonly categories: PortfolioCategoryRepository,
    private readonly dateTime: DateTimeService,
  ) {}

  /** Paginated, searchable, filterable list with embedded categories (public + admin). */
  async list(
    query: PortfolioListQuery,
  ): Promise<Paginated<PortfolioProjectItem>> {
    const page = await this.projects.list(query);
    const fields = await this.projects.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    const categories = await this.resolveCategories(
      page.items.map((row) => row.categoryId),
    );
    return {
      items: page.items.map((row) =>
        assemblePortfolioProject(
          row,
          fields.get(row.id),
          row.categoryId ? (categories.get(row.categoryId) ?? null) : null,
        ),
      ),
      meta: page.meta,
    };
  }

  /**
   * A single PUBLISHED project by slug (the website case-study detail). 404 when absent OR a
   * draft — drafts never leak on the public detail (WEB2). The admin reads draft data from the
   * `manage` list (which returns full items).
   */
  async getBySlug(slug: string): Promise<PortfolioProjectItem> {
    const row = await this.projects.findBySlug(slug);
    if (!row || row.status !== 'published') {
      throw contentNotFound('PortfolioProject', slug);
    }
    return this.byId(row.id);
  }

  /** Create a project + both-locale copy (admin). Sets `publishedAt` if created published. */
  async create(req: PortfolioCreateRequest): Promise<PortfolioProjectItem> {
    await this.assertSlugFree(req.slug, undefined);
    const created = await this.projects.create({
      slug: req.slug,
      categoryId: req.categoryId ?? null,
      coverMediaId: req.coverMediaId ?? null,
      clientName: req.clientName ?? null,
      projectUrl: req.projectUrl ?? null,
      status: req.status,
      publishedAt:
        req.status === 'published' ? this.dateTime.now().toJSDate() : null,
      featured: req.featured,
      sortOrder: req.sortOrder,
    });
    await this.projects.upsertTranslations(created.id, {
      title: req.title,
      summary: req.summary ?? EMPTY,
      challenge: req.challenge ?? EMPTY,
      solution: req.solution ?? EMPTY,
      result: req.result ?? EMPTY,
    });
    return this.byId(created.id);
  }

  /** Update a project by id (admin). Only provided fields change; stamps `publishedAt` on first publish. */
  async update(req: PortfolioUpdateRequest): Promise<PortfolioProjectItem> {
    const existing = await this.projects.find(req.id);
    if (!existing) {
      throw contentNotFound('PortfolioProject', req.id);
    }
    if (req.slug !== undefined) {
      await this.assertSlugFree(req.slug, req.id);
    }

    const base: Partial<PortfolioProjectInsert> = {};
    if (req.slug !== undefined) base.slug = req.slug;
    if (req.categoryId !== undefined) base.categoryId = req.categoryId;
    if (req.coverMediaId !== undefined) base.coverMediaId = req.coverMediaId;
    if (req.clientName !== undefined) base.clientName = req.clientName;
    if (req.projectUrl !== undefined) base.projectUrl = req.projectUrl;
    if (req.featured !== undefined) base.featured = req.featured;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (req.status !== undefined) {
      base.status = req.status;
      // stamp publishedAt the first time it goes live (records first publish)
      if (req.status === 'published' && existing.publishedAt === null) {
        base.publishedAt = this.dateTime.now().toJSDate();
      }
    }
    if (Object.keys(base).length > 0) {
      await this.projects.update(req.id, base);
    }

    const translations: Record<string, LocalizedText> = {};
    if (req.title) translations['title'] = req.title;
    if (req.summary) translations['summary'] = req.summary;
    if (req.challenge) translations['challenge'] = req.challenge;
    if (req.solution) translations['solution'] = req.solution;
    if (req.result) translations['result'] = req.result;
    if (Object.keys(translations).length > 0) {
      await this.projects.upsertTranslations(req.id, translations);
    }

    return this.byId(req.id);
  }

  /** Soft-delete a project (admin). */
  async delete(id: string): Promise<ContentId> {
    const existing = await this.projects.find(id);
    if (!existing) {
      throw contentNotFound('PortfolioProject', id);
    }
    await this.projects.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<PortfolioProjectItem> {
    const row = await this.projects.findOrFail(id);
    const fields = await this.projects.localizedFieldsFor(id);
    const category = row.categoryId
      ? ((await this.resolveCategories([row.categoryId])).get(row.categoryId) ??
        null)
      : null;
    return assemblePortfolioProject(row, fields, category);
  }

  /** Batch-resolve the embedded category refs for a set of (possibly null) category ids. */
  private async resolveCategories(
    categoryIds: ReadonlyArray<string | null>,
  ): Promise<Map<string, PortfolioCategoryRef>> {
    const ids = [
      ...new Set(categoryIds.filter((id): id is string => id !== null)),
    ];
    const map = new Map<string, PortfolioCategoryRef>();
    if (ids.length === 0) {
      return map;
    }
    const rows = await this.categories.findByIds(ids);
    const fields = await this.categories.localizedFieldsForMany(ids);
    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        slug: row.slug,
        name: fields.get(row.id)?.['name'] ?? EMPTY,
      });
    }
    return map;
  }

  private async assertSlugFree(
    slug: string,
    id: string | undefined,
  ): Promise<void> {
    const existing: PortfolioProjectRow | null =
      await this.projects.findBySlug(slug);
    if (existing && existing.id !== id) {
      throw slugConflict(slug);
    }
  }
}
