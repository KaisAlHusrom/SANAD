import { Injectable } from '@nestjs/common';
import type {
  ContentId,
  FaqCreateRequest,
  FaqItem,
  FaqListQuery,
  FaqUpdateRequest,
  LocalizedText,
  Paginated,
} from '@sanad/contracts';
import { faqTable } from '../../../db/schema/index.js';
import { FaqRepository } from '../../infrastructure/persistence/repositories/faq.repository.js';
import { assembleFaq } from '../assemblers/faq.assembler.js';
import { contentNotFound } from '../errors/content-errors.js';

type FaqInsert = typeof faqTable.$inferInsert;

/**
 * The FAQ collection (WEB1) — translatable CRUD on the shared canon. Reads return both locales
 * (F7); writes save both locales (W6). No slug — FAQs are listed, addressed by id for write.
 */
@Injectable()
export class FaqService {
  constructor(private readonly faqs: FaqRepository) {}

  /** Paginated, searchable, category-filterable list (public website + admin). */
  async list(query: FaqListQuery): Promise<Paginated<FaqItem>> {
    const page = await this.faqs.list(query);
    const fields = await this.faqs.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) => assembleFaq(row, fields.get(row.id))),
      meta: page.meta,
    };
  }

  /** Create an FAQ + both-locale copy (admin). */
  async create(req: FaqCreateRequest): Promise<FaqItem> {
    const created = await this.faqs.create({
      category: req.category ?? null,
      sortOrder: req.sortOrder,
    });
    await this.faqs.upsertTranslations(created.id, {
      question: req.question,
      answer: req.answer,
    });
    return this.byId(created.id);
  }

  /** Update an FAQ by id (admin). Only provided fields change. */
  async update(req: FaqUpdateRequest): Promise<FaqItem> {
    const existing = await this.faqs.find(req.id);
    if (!existing) {
      throw contentNotFound('Faq', req.id);
    }

    const base: Partial<FaqInsert> = {};
    if (req.category !== undefined) base.category = req.category;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (Object.keys(base).length > 0) {
      await this.faqs.update(req.id, base);
    }

    const translations: Record<string, LocalizedText> = {};
    if (req.question) translations['question'] = req.question;
    if (req.answer) translations['answer'] = req.answer;
    if (Object.keys(translations).length > 0) {
      await this.faqs.upsertTranslations(req.id, translations);
    }

    return this.byId(req.id);
  }

  /** Soft-delete an FAQ (admin). */
  async delete(id: string): Promise<ContentId> {
    const existing = await this.faqs.find(id);
    if (!existing) {
      throw contentNotFound('Faq', id);
    }
    await this.faqs.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<FaqItem> {
    const row = await this.faqs.findOrFail(id);
    const fields = await this.faqs.localizedFieldsFor(id);
    return assembleFaq(row, fields);
  }
}
