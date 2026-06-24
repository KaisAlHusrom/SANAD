import { Injectable } from '@nestjs/common';
import type {
  ContentId,
  LocalizedText,
  Paginated,
  TeamMemberCreateRequest,
  TeamMemberItem,
  TeamMemberListQuery,
  TeamMemberUpdateRequest,
} from '@sanad/contracts';
import {
  teamMemberTable,
  type TeamMemberRow,
} from '../../../db/schema/index.js';
import { TeamMemberRepository } from '../../infrastructure/persistence/repositories/team-member.repository.js';
import { assembleTeamMember } from '../assemblers/team-member.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';

type TeamMemberInsert = typeof teamMemberTable.$inferInsert;

const EMPTY: LocalizedText = { ar: '', en: '' };

/**
 * The team-members collection (the About page, WEB1) — translatable CRUD on the shared canon.
 * Reads return both locales (F7); writes save both locales (W6). Slug uniqueness is checked to
 * return a clean 409 instead of a raw DB error.
 */
@Injectable()
export class TeamMemberService {
  constructor(private readonly members: TeamMemberRepository) {}

  /** Paginated, searchable, featured-filterable list (public website + admin). */
  async list(query: TeamMemberListQuery): Promise<Paginated<TeamMemberItem>> {
    const page = await this.members.list(query);
    const fields = await this.members.localizedFieldsForMany(
      page.items.map((row) => row.id),
    );
    return {
      items: page.items.map((row) =>
        assembleTeamMember(row, fields.get(row.id)),
      ),
      meta: page.meta,
    };
  }

  /** A single team member by slug (a future detail page). 404 when absent. */
  async getBySlug(slug: string): Promise<TeamMemberItem> {
    const row = await this.members.findBySlug(slug);
    if (!row) {
      throw contentNotFound('TeamMember', slug);
    }
    return this.byId(row.id);
  }

  /** Create a team member + both-locale copy (admin). */
  async create(req: TeamMemberCreateRequest): Promise<TeamMemberItem> {
    await this.assertSlugFree(req.slug, undefined);
    const created = await this.members.create({
      slug: req.slug,
      avatarMediaId: req.avatarMediaId ?? null,
      email: req.email ?? null,
      linkedinUrl: req.linkedinUrl ?? null,
      githubUrl: req.githubUrl ?? null,
      featured: req.featured,
      sortOrder: req.sortOrder,
    });
    await this.members.upsertTranslations(created.id, {
      name: req.name,
      role: req.role,
      bio: req.bio ?? EMPTY,
    });
    return this.byId(created.id);
  }

  /** Update a team member by id (admin). Only provided fields change. */
  async update(req: TeamMemberUpdateRequest): Promise<TeamMemberItem> {
    const existing = await this.members.find(req.id);
    if (!existing) {
      throw contentNotFound('TeamMember', req.id);
    }
    if (req.slug !== undefined) {
      await this.assertSlugFree(req.slug, req.id);
    }

    const base: Partial<TeamMemberInsert> = {};
    if (req.slug !== undefined) base.slug = req.slug;
    if (req.avatarMediaId !== undefined) base.avatarMediaId = req.avatarMediaId;
    if (req.email !== undefined) base.email = req.email;
    if (req.linkedinUrl !== undefined) base.linkedinUrl = req.linkedinUrl;
    if (req.githubUrl !== undefined) base.githubUrl = req.githubUrl;
    if (req.featured !== undefined) base.featured = req.featured;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (Object.keys(base).length > 0) {
      await this.members.update(req.id, base);
    }

    const translations: Record<string, LocalizedText> = {};
    if (req.name) translations['name'] = req.name;
    if (req.role) translations['role'] = req.role;
    if (req.bio) translations['bio'] = req.bio;
    if (Object.keys(translations).length > 0) {
      await this.members.upsertTranslations(req.id, translations);
    }

    return this.byId(req.id);
  }

  /** Soft-delete a team member (admin). */
  async delete(id: string): Promise<ContentId> {
    const existing = await this.members.find(id);
    if (!existing) {
      throw contentNotFound('TeamMember', id);
    }
    await this.members.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async byId(id: string): Promise<TeamMemberItem> {
    const row = await this.members.findOrFail(id);
    const fields = await this.members.localizedFieldsFor(id);
    return assembleTeamMember(row, fields);
  }

  private async assertSlugFree(
    slug: string,
    id: string | undefined,
  ): Promise<void> {
    const existing: TeamMemberRow | null = await this.members.findBySlug(slug);
    if (existing && existing.id !== id) {
      throw slugConflict(slug);
    }
  }
}
