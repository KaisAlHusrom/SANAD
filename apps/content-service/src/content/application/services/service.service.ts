import { Injectable } from '@nestjs/common';
import type {
  ContentId,
  LocalizedText,
  Paginated,
  ServiceCreateRequest,
  ServiceItem,
  ServiceListQuery,
  ServiceUpdateRequest,
} from '@sanad/contracts';
import { serviceTable, type ServiceRow } from '../../../db/schema/index.js';
import { ServiceRepository } from '../../infrastructure/persistence/repositories/service.repository.js';
import { assembleService } from '../assemblers/service.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';

type ServiceInsert = typeof serviceTable.$inferInsert;

const EMPTY: LocalizedText = { ar: '', en: '' };

/**
 * The services collection (WEB1) — translatable CRUD on the shared canon. Reads return both
 * locales (F7); writes save both locales (W6). Slug uniqueness is checked to return a clean
 * 409 instead of a raw DB error.
 */
@Injectable()
export class ServiceService {
  constructor(private readonly services: ServiceRepository) {}

  /** Paginated, searchable, category-filterable list (public website + admin). */
  async list(query: ServiceListQuery): Promise<Paginated<ServiceItem>> {
    const page = await this.services.list(query);
    const fields = await this.services.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) => assembleService(row, fields.get(row.id))),
      meta: page.meta,
    };
  }

  /**
   * Services for a set of ids, returned IN THE GIVEN ORDER (the `picked` section-config
   * hydration). Unknown/soft-deleted ids are simply dropped. Both locales resolved (F7).
   */
  async listByIds(ids: readonly string[]): Promise<ServiceItem[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.services.findByIds(ids);
    const fields = await this.services.localizedFieldsForMany(
      rows.map((row) => row.id),
    );
    const byId = new Map(
      rows.map((row) => [row.id, assembleService(row, fields.get(row.id))]),
    );
    return ids
      .map((id) => byId.get(id))
      .filter((item): item is ServiceItem => item !== undefined);
  }

  /** A single service by slug (the website detail page). 404 when absent. */
  async getBySlug(slug: string): Promise<ServiceItem> {
    const row = await this.services.findBySlug(slug);
    if (!row) {
      throw contentNotFound('Service', slug);
    }
    return this.byId(row.id);
  }

  /** Create a service + both-locale copy (admin). */
  async create(req: ServiceCreateRequest): Promise<ServiceItem> {
    await this.assertSlugFree(req.slug, undefined);
    const created = await this.services.create({
      slug: req.slug,
      category: req.category,
      iconKey: req.iconKey ?? null,
      coverMediaId: req.coverMediaId ?? null,
      sortOrder: req.sortOrder,
    });
    await this.services.upsertTranslations(created.id, {
      title: req.title,
      summary: req.summary ?? EMPTY,
      detailBody: req.detailBody ?? EMPTY,
    });
    return this.byId(created.id);
  }

  /** Update a service by id (admin). Only provided fields change. */
  async update(req: ServiceUpdateRequest): Promise<ServiceItem> {
    const existing = await this.services.find(req.id);
    if (!existing) {
      throw contentNotFound('Service', req.id);
    }
    if (req.slug !== undefined) {
      await this.assertSlugFree(req.slug, req.id);
    }

    const base: Partial<ServiceInsert> = {};
    if (req.slug !== undefined) base.slug = req.slug;
    if (req.category !== undefined) base.category = req.category;
    if (req.iconKey !== undefined) base.iconKey = req.iconKey;
    if (req.coverMediaId !== undefined) base.coverMediaId = req.coverMediaId;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (Object.keys(base).length > 0) {
      await this.services.update(req.id, base);
    }

    const translations: Record<string, LocalizedText> = {};
    if (req.title) translations['title'] = req.title;
    if (req.summary) translations['summary'] = req.summary;
    if (req.detailBody) translations['detailBody'] = req.detailBody;
    if (Object.keys(translations).length > 0) {
      await this.services.upsertTranslations(req.id, translations);
    }

    return this.byId(req.id);
  }

  /** Atomically renumber sortOrder to match the given id order (drag-and-drop reorder, U21). */
  reorder(ids: string[]): Promise<void> {
    return this.services.reorderByIds(ids);
  }

  /** Soft-delete a service (admin). */
  async delete(id: string): Promise<ContentId> {
    const existing = await this.services.find(id);
    if (!existing) {
      throw contentNotFound('Service', id);
    }
    await this.services.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<ServiceItem> {
    const row = await this.services.findOrFail(id);
    const fields = await this.services.localizedFieldsFor(id);
    return assembleService(row, fields);
  }

  private async assertSlugFree(
    slug: string,
    id: string | undefined,
  ): Promise<void> {
    const existing: ServiceRow | null = await this.services.findBySlug(slug);
    if (existing && existing.id !== id) {
      throw slugConflict(slug);
    }
  }
}
