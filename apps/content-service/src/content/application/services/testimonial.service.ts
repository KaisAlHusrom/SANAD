import { Injectable } from '@nestjs/common';
import type {
  ContentId,
  LocalizedText,
  Paginated,
  TestimonialCreateRequest,
  TestimonialItem,
  TestimonialListQuery,
  TestimonialUpdateRequest,
} from '@sanad/contracts';
import { testimonialTable } from '../../../db/schema/index.js';
import { TestimonialRepository } from '../../infrastructure/persistence/repositories/testimonial.repository.js';
import { assembleTestimonial } from '../assemblers/testimonial.assembler.js';
import { contentNotFound } from '../errors/content-errors.js';

type TestimonialInsert = typeof testimonialTable.$inferInsert;

const EMPTY: LocalizedText = { ar: '', en: '' };

/**
 * The testimonials collection (WEB1) — translatable CRUD on the shared canon. Reads return both
 * locales (F7); writes save both locales (W6). No slug — testimonials are listed, not addressed
 * by a public detail page; addressed by id for write.
 */
@Injectable()
export class TestimonialService {
  constructor(private readonly testimonials: TestimonialRepository) {}

  /** Paginated, searchable, featured-filterable list (public website + admin). */
  async list(query: TestimonialListQuery): Promise<Paginated<TestimonialItem>> {
    const page = await this.testimonials.list(query);
    const fields = await this.testimonials.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) =>
        assembleTestimonial(row, fields.get(row.id)),
      ),
      meta: page.meta,
    };
  }

  /** Create a testimonial + both-locale copy (admin). */
  async create(req: TestimonialCreateRequest): Promise<TestimonialItem> {
    const created = await this.testimonials.create({
      authorName: req.authorName,
      companyName: req.companyName ?? null,
      avatarMediaId: req.avatarMediaId ?? null,
      rating: req.rating ?? null,
      featured: req.featured,
      sortOrder: req.sortOrder,
    });
    await this.testimonials.upsertTranslations(created.id, {
      quote: req.quote,
      authorRole: req.authorRole ?? EMPTY,
      companyDescriptor: req.companyDescriptor ?? EMPTY,
    });
    return this.byId(created.id);
  }

  /** Update a testimonial by id (admin). Only provided fields change. */
  async update(req: TestimonialUpdateRequest): Promise<TestimonialItem> {
    const existing = await this.testimonials.find(req.id);
    if (!existing) {
      throw contentNotFound('Testimonial', req.id);
    }

    const base: Partial<TestimonialInsert> = {};
    if (req.authorName !== undefined) base.authorName = req.authorName;
    if (req.companyName !== undefined) base.companyName = req.companyName;
    if (req.avatarMediaId !== undefined) base.avatarMediaId = req.avatarMediaId;
    if (req.rating !== undefined) base.rating = req.rating;
    if (req.featured !== undefined) base.featured = req.featured;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (Object.keys(base).length > 0) {
      await this.testimonials.update(req.id, base);
    }

    const translations: Record<string, LocalizedText> = {};
    if (req.quote) translations['quote'] = req.quote;
    if (req.authorRole) translations['authorRole'] = req.authorRole;
    if (req.companyDescriptor)
      translations['companyDescriptor'] = req.companyDescriptor;
    if (Object.keys(translations).length > 0) {
      await this.testimonials.upsertTranslations(req.id, translations);
    }

    return this.byId(req.id);
  }

  /** Soft-delete a testimonial (admin). */
  async delete(id: string): Promise<ContentId> {
    const existing = await this.testimonials.find(id);
    if (!existing) {
      throw contentNotFound('Testimonial', id);
    }
    await this.testimonials.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<TestimonialItem> {
    const row = await this.testimonials.findOrFail(id);
    const fields = await this.testimonials.localizedFieldsFor(id);
    return assembleTestimonial(row, fields);
  }
}
