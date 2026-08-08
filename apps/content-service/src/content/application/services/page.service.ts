import { Injectable } from '@nestjs/common';
import { paginateArgsFromListQuery } from '@sanad/database';
import type {
  BlockNode,
  BlockUpsertRequest,
  ContentId,
  ListQuery,
  LocalizedText,
  PageSummary,
  PageTree,
  Paginated,
  PageUpsertRequest,
  SectionNode,
  SectionUpsertRequest,
} from '@sanad/contracts';
import type {
  BlockRow,
  PageRow,
  SectionRow,
} from '../../../db/schema/index.js';
import { BlockRepository } from '../../infrastructure/persistence/repositories/block.repository.js';
import { PageRepository } from '../../infrastructure/persistence/repositories/page.repository.js';
import { SectionRepository } from '../../infrastructure/persistence/repositories/section.repository.js';
import {
  assembleBlock,
  assemblePageSummary,
  assemblePageTree,
  assembleSection,
} from '../assemblers/page.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';
import { CollectionHydrationService } from './collection-hydration.service.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Order by `sortOrder` ascending, stable by created time. */
function bySortOrder<T extends { sortOrder: number }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder;
}

/**
 * The Page → Section → Block tree (WEB1). Reads assemble the published tree with copy in
 * BOTH locales (null-safe, F7); writes are granular upserts the admin builder uses (W6).
 * No cross-service events here (only the lead emits, MS3) — plain translatable CRUD.
 */
@Injectable()
export class PageService {
  constructor(
    private readonly pages: PageRepository,
    private readonly sections: SectionRepository,
    private readonly blocks: BlockRepository,
    private readonly hydration: CollectionHydrationService,
  ) {}

  /** The assembled published tree for the website (WEB2). Null when no published page matches. */
  async getTree(slug: string): Promise<PageTree | null> {
    const page = await this.pages.findBySlug(slug);
    if (!page || page.status !== 'published') {
      return null;
    }
    return this.assembleTree(page, { publishedOnly: true });
  }

  /**
   * The full tree by page id for the admin builder (P7) — drafts + unpublished sections
   * visible (W6). Null when the id matches no live page (the gateway maps it to 404).
   */
  async getAdminTree(id: string): Promise<PageTree | null> {
    const page = await this.pages.find(id);
    if (!page) {
      return null;
    }
    return this.assembleTree(page, { publishedOnly: false });
  }

  /** The admin page list (P7), paginated (no tree). */
  async list(query: ListQuery): Promise<Paginated<PageSummary>> {
    const page = await this.pages.list(paginateArgsFromListQuery(query));
    const fields = await this.pages.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) =>
        assemblePageSummary(row, fields.get(row.id)),
      ),
      meta: page.meta,
    };
  }

  /** Create or update a page's meta + both-locale copy (admin, W6). */
  async upsertPage(req: PageUpsertRequest): Promise<PageSummary> {
    await this.assertSlugFree(req.slug, req.id);
    const base = {
      slug: req.slug,
      status: req.status,
      sortOrder: req.sortOrder,
    };
    const id = req.id
      ? (await this.pages.update(req.id, base)).id
      : (await this.pages.create(base)).id;
    await this.pages.upsertTranslations(id, {
      title: req.title,
      metaTitle: req.metaTitle ?? EMPTY,
      metaDescription: req.metaDescription ?? EMPTY,
    });
    const row = await this.pages.findOrFail(id);
    const fields = await this.pages.localizedFieldsFor(id);
    return assemblePageSummary(row, fields);
  }

  /** Create or update a section within a page (admin, W6). */
  async upsertSection(req: SectionUpsertRequest): Promise<SectionNode> {
    const base = {
      pageId: req.pageId,
      type: req.type,
      sortOrder: req.sortOrder,
      published: req.published,
      // `config` is written only when provided (partial semantics) so an inline copy edit —
      // which sends no config — never wipes a section's collection link.
      ...(req.config !== undefined ? { config: req.config } : {}),
    };
    const id = req.id
      ? (await this.sections.update(req.id, base)).id
      : (await this.sections.create(base)).id;
    await this.sections.upsertTranslations(id, {
      eyebrow: req.eyebrow ?? EMPTY,
      title: req.title ?? EMPTY,
      subtitle: req.subtitle ?? EMPTY,
    });
    return this.sectionNode(id);
  }

  /** Create or update a block within a section (admin, W6). */
  async upsertBlock(req: BlockUpsertRequest): Promise<BlockNode> {
    const base = {
      sectionId: req.sectionId,
      type: req.type,
      sortOrder: req.sortOrder,
      data: req.data,
      imageMediaId: req.imageMediaId ?? null,
    };
    const id = req.id
      ? (await this.blocks.update(req.id, base)).id
      : (await this.blocks.create(base)).id;
    await this.blocks.upsertTranslations(id, {
      title: req.title ?? EMPTY,
      body: req.body ?? EMPTY,
    });
    const row = await this.blocks.findOrFail(id);
    const fields = await this.blocks.localizedFieldsFor(id);
    return assembleBlock(row, fields);
  }

  /** Atomically renumber pages to the given id order (admin list drag-and-drop, U21). */
  reorderPages(ids: string[]): Promise<void> {
    return this.pages.reorderByIds(ids);
  }

  /** Atomically renumber a page's sections to the given id order (builder drag, U21). */
  reorderSections(ids: string[]): Promise<void> {
    return this.sections.reorderByIds(ids);
  }

  /** Atomically renumber a section's blocks to the given id order (builder drag, U21). */
  reorderBlocks(ids: string[]): Promise<void> {
    return this.blocks.reorderByIds(ids);
  }

  /** Soft-delete a page (admin). */
  async deletePage(id: string): Promise<ContentId> {
    await this.ensureExists(this.pages, 'Page', id);
    await this.pages.delete(id);
    return { id };
  }

  /** Soft-delete a section (admin). */
  async deleteSection(id: string): Promise<ContentId> {
    await this.ensureExists(this.sections, 'Section', id);
    await this.sections.delete(id);
    return { id };
  }

  /** Soft-delete a block (admin). */
  async deleteBlock(id: string): Promise<ContentId> {
    await this.ensureExists(this.blocks, 'Block', id);
    await this.blocks.delete(id);
    return { id };
  }

  // ===== helpers =====
  /** Assemble a page row into the full tree; `publishedOnly` gates unpublished sections (WEB2 vs P7). */
  private async assembleTree(
    page: PageRow,
    opts: { publishedOnly: boolean },
  ): Promise<PageTree> {
    const pageFields = await this.pages.localizedFieldsFor(page.id);

    const sections = (await this.sections.listForPage(page.id))
      .filter((section) => !opts.publishedOnly || section.published)
      .sort(bySortOrder);
    const sectionFields = await this.sections.localizedFieldsForMany(
      sections.map((section) => section.id),
    );

    const blocks = (
      await this.blocks.listForSections(sections.map((section) => section.id))
    ).sort(bySortOrder);
    const blockFields = await this.blocks.localizedFieldsForMany(
      blocks.map((block) => block.id),
    );
    const blocksBySection = this.groupBlocks(blocks);

    const nodes: SectionNode[] = await Promise.all(
      sections.map(async (section) => {
        const collection = await this.hydration.hydrate(
          section.type,
          section.config ?? null,
          { publishedOnly: opts.publishedOnly },
        );
        return assembleSection(
          section,
          sectionFields.get(section.id),
          (blocksBySection.get(section.id) ?? []).map((block) =>
            assembleBlock(block, blockFields.get(block.id)),
          ),
          collection,
        );
      }),
    );

    return assemblePageTree(page, pageFields, nodes);
  }

  private async sectionNode(id: string): Promise<SectionNode> {
    const row = await this.sections.findOrFail(id);
    const fields = await this.sections.localizedFieldsFor(id);
    const blocks = (await this.blocks.listForSections([id])).sort(bySortOrder);
    const blockFields = await this.blocks.localizedFieldsForMany(
      blocks.map((block) => block.id),
    );
    // Admin write-back path → drafts visible (publishedOnly: false).
    const collection = await this.hydration.hydrate(
      row.type,
      row.config ?? null,
      {
        publishedOnly: false,
      },
    );
    return assembleSection(
      row,
      fields,
      blocks.map((block) => assembleBlock(block, blockFields.get(block.id))),
      collection,
    );
  }

  private groupBlocks(blocks: BlockRow[]): Map<string, BlockRow[]> {
    const map = new Map<string, BlockRow[]>();
    for (const block of blocks) {
      const list = map.get(block.sectionId) ?? [];
      list.push(block);
      map.set(block.sectionId, list);
    }
    return map;
  }

  private async assertSlugFree(
    slug: string,
    id: string | undefined,
  ): Promise<void> {
    const existing = await this.pages.findBySlug(slug);
    if (existing && existing.id !== id) {
      throw slugConflict(slug);
    }
  }

  private async ensureExists(
    repo: {
      find(id: string): Promise<SectionRow | BlockRow | { id: string } | null>;
    },
    entity: string,
    id: string,
  ): Promise<void> {
    const row = await repo.find(id);
    if (!row) {
      throw contentNotFound(entity, id);
    }
  }
}
