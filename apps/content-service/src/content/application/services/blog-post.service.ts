import { Injectable } from '@nestjs/common';
import { DateTimeService } from '@sanad/database';
import type {
  BlogEntityRef,
  BlogPostCreateRequest,
  BlogPostItem,
  BlogPostListQuery,
  BlogPostUpdateRequest,
  ContentId,
  LocalizedText,
  Paginated,
} from '@sanad/contracts';
import { blogPostTable, type BlogPostRow } from '../../../db/schema/index.js';
import { BlogCategoryRepository } from '../../infrastructure/persistence/repositories/blog-category.repository.js';
import { BlogPostTagRepository } from '../../infrastructure/persistence/repositories/blog-post-tag.repository.js';
import { BlogPostRepository } from '../../infrastructure/persistence/repositories/blog-post.repository.js';
import { BlogTagRepository } from '../../infrastructure/persistence/repositories/blog-tag.repository.js';
import { TeamMemberRepository } from '../../infrastructure/persistence/repositories/team-member.repository.js';
import { assembleBlogPost } from '../assemblers/blog-post.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';

type BlogPostInsert = typeof blogPostTable.$inferInsert;

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Structural lookup for batch ref resolution — every translatable lookup repo satisfies it. */
interface RefLookup {
  findByIds(
    ids: readonly string[],
  ): Promise<ReadonlyArray<{ id: string; slug: string }>>;
  localizedFieldsForMany(
    ids: readonly string[],
  ): Promise<Map<string, Record<string, LocalizedText>>>;
}

/**
 * The blog posts collection (WEB1) — translatable CRUD on the shared canon. Reads embed the
 * category, author, and tags (embed-on-read, all batch-resolved — no N+1) and resolve copy to
 * both locales (F7). Writes take `categoryId`/`authorTeamMemberId`/`tagIds` (ids-on-write); tags
 * go through the `blog_post_tag` M2M repo. `publishedAt` is server-managed (stamped on first
 * publish via the DateTime service — N3). Drafts are hidden on the public path (WEB2).
 */
@Injectable()
export class BlogPostService {
  constructor(
    private readonly posts: BlogPostRepository,
    private readonly categories: BlogCategoryRepository,
    private readonly tags: BlogTagRepository,
    private readonly members: TeamMemberRepository,
    private readonly postTags: BlogPostTagRepository,
    private readonly dateTime: DateTimeService,
  ) {}

  /** Paginated, searchable, filterable list with embedded category/author/tags (public + admin). */
  async list(query: BlogPostListQuery): Promise<Paginated<BlogPostItem>> {
    const page = await this.posts.list(query);
    const items = await this.assembleMany(page.items);
    return { items, meta: page.meta };
  }

  /**
   * A single PUBLISHED post by slug (the website article). 404 when absent OR a draft — drafts
   * never leak on the public detail (WEB2). The admin reads draft data from the `manage` list.
   */
  async getBySlug(slug: string): Promise<BlogPostItem> {
    const row = await this.posts.findBySlug(slug);
    if (!row || row.status !== 'published') {
      throw contentNotFound('BlogPost', slug);
    }
    return this.byId(row.id);
  }

  /** Create a post + both-locale copy + its tag set (admin). Stamps publishedAt if created published. */
  async create(req: BlogPostCreateRequest): Promise<BlogPostItem> {
    await this.assertSlugFree(req.slug, undefined);
    const created = await this.posts.create({
      slug: req.slug,
      categoryId: req.categoryId ?? null,
      authorTeamMemberId: req.authorTeamMemberId ?? null,
      coverMediaId: req.coverMediaId ?? null,
      status: req.status,
      publishedAt:
        req.status === 'published' ? this.dateTime.now().toJSDate() : null,
      readMinutes: req.readMinutes ?? null,
      sortOrder: req.sortOrder,
    });
    await this.posts.upsertTranslations(created.id, {
      title: req.title,
      excerpt: req.excerpt ?? EMPTY,
      body: req.body ?? EMPTY,
    });
    await this.postTags.setTagsFor(created.id, req.tagIds);
    return this.byId(created.id);
  }

  /** Update a post by id (admin). Only provided fields change; `tagIds` (when present) replaces the set. */
  async update(req: BlogPostUpdateRequest): Promise<BlogPostItem> {
    const existing = await this.posts.find(req.id);
    if (!existing) {
      throw contentNotFound('BlogPost', req.id);
    }
    if (req.slug !== undefined) {
      await this.assertSlugFree(req.slug, req.id);
    }

    const base: Partial<BlogPostInsert> = {};
    if (req.slug !== undefined) base.slug = req.slug;
    if (req.categoryId !== undefined) base.categoryId = req.categoryId;
    if (req.authorTeamMemberId !== undefined)
      base.authorTeamMemberId = req.authorTeamMemberId;
    if (req.coverMediaId !== undefined) base.coverMediaId = req.coverMediaId;
    if (req.readMinutes !== undefined) base.readMinutes = req.readMinutes;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (req.status !== undefined) {
      base.status = req.status;
      if (req.status === 'published' && existing.publishedAt === null) {
        base.publishedAt = this.dateTime.now().toJSDate();
      }
    }
    if (Object.keys(base).length > 0) {
      await this.posts.update(req.id, base);
    }

    const translations: Record<string, LocalizedText> = {};
    if (req.title) translations['title'] = req.title;
    if (req.excerpt) translations['excerpt'] = req.excerpt;
    if (req.body) translations['body'] = req.body;
    if (Object.keys(translations).length > 0) {
      await this.posts.upsertTranslations(req.id, translations);
    }

    if (req.tagIds !== undefined) {
      await this.postTags.setTagsFor(req.id, req.tagIds);
    }

    return this.byId(req.id);
  }

  /** Soft-delete a post (admin). */
  async delete(id: string): Promise<ContentId> {
    const existing = await this.posts.find(id);
    if (!existing) {
      throw contentNotFound('BlogPost', id);
    }
    await this.posts.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<BlogPostItem> {
    const row = await this.posts.findOrFail(id);
    const [item] = await this.assembleMany([row]);
    if (!item) {
      throw contentNotFound('BlogPost', id);
    }
    return item;
  }

  /** Batch-assemble posts: load copy + resolve embedded category/author/tags (N+1-safe). */
  private async assembleMany(rows: BlogPostRow[]): Promise<BlogPostItem[]> {
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const fields = await this.posts.localizedFieldsForMany(ids);
    const categoryRefs = await this.resolveRefs(
      this.categories,
      rows.map((row) => row.categoryId),
    );
    const authorRefs = await this.resolveRefs(
      this.members,
      rows.map((row) => row.authorTeamMemberId),
    );
    const tagIdsByPost = await this.postTags.tagIdsForMany(ids);
    const allTagIds = [...new Set([...tagIdsByPost.values()].flat())];
    const tagRefs = await this.resolveRefs(this.tags, allTagIds);

    return rows.map((row) =>
      assembleBlogPost(
        row,
        fields.get(row.id),
        row.categoryId ? (categoryRefs.get(row.categoryId) ?? null) : null,
        row.authorTeamMemberId
          ? (authorRefs.get(row.authorTeamMemberId) ?? null)
          : null,
        (tagIdsByPost.get(row.id) ?? [])
          .map((tagId) => tagRefs.get(tagId))
          .filter((ref): ref is BlogEntityRef => ref !== undefined),
      ),
    );
  }

  /** Batch-resolve `{id,slug,name}` refs for a set of (possibly null) ids from a lookup repo. */
  private async resolveRefs(
    repo: RefLookup,
    ids: ReadonlyArray<string | null>,
  ): Promise<Map<string, BlogEntityRef>> {
    const unique = [...new Set(ids.filter((id): id is string => id !== null))];
    const map = new Map<string, BlogEntityRef>();
    if (unique.length === 0) {
      return map;
    }
    const rows = await repo.findByIds(unique);
    const fields = await repo.localizedFieldsForMany(unique);
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
    const existing: BlogPostRow | null = await this.posts.findBySlug(slug);
    if (existing && existing.id !== id) {
      throw slugConflict(slug);
    }
  }
}
