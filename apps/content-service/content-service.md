# content-service

> The Sanad Tech CMS (P5) — the translatable content every website page renders from and the
> admin portal edits. Owns the flexible **Page → Section → Block** tree, the **services**,
> **testimonials**, **team-members**, **portfolio** (categories + projects), **blog** (categories
>
> - tags + posts), **faqs**, **menus** collections, and **leads** (the contact /
>   request-a-project capture). Never faces the public internet directly (MS4); the gateway exposes
>   public reads + guarded writes.

## Purpose

The single source of website content. The website (P8) fetches assembled page trees +
collections in both locales; the admin (P7) composes pages from sections/blocks and manages
services + the leads inbox. A contact submission persists a `lead` and emits `lead.created`
(Outbox, MS3) for the notifications service (P6). It is the first consumer of `media.deleted`
(MS6) — it nulls stale media references.

## Toolchain

NestJS 11, ESM + SWC (N11), **hybrid app**: an HTTP `/health` endpoint + an RMQ microservice
consuming `content.commands` (request/reply, MS2) **and** the producer's `media.events` queue
(the idempotent `media.deleted` consumer, MS6). Own database (MS5) via Drizzle; migrations in
`src/db/migrations` (generate → migrate, never push).

## Layout (DDD layering + U20 kind-subfolders)

The `content/` module follows DDD layering (N4) with files grouped **by kind within each layer**
(U20), each subfolder barrelled (U10):
`presentation/` (RMQ message-controllers) · `application/{services,assemblers,errors}/`
(request logic / row→contract assemblers / typed `RpcException` factories) ·
`infrastructure/{persistence/{repositories,model-configs},consumers}/` (entity repos + their
`ModelConfig` declarations + the idempotent event consumer). `db/schema/` holds the Drizzle
tables (one kind). Parent barrels re-export the subfolder barrels.

## Entities (own DB — `content` / `content_test`)

| Table                            | Notes                                                                                                                                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`                           | `slug` (unique route key), `status` (`draft`/`published`), `sort_order`; soft-delete                                                                                                                                                                                         |
| `page_translation`               | per-locale `title` + SEO `meta_title`/`meta_description` (N5); PK `(page_id, locale)`                                                                                                                                                                                        |
| `section`                        | `page_id` (FK cascade), `type` (hero/services/process/stats/cta/…), `sort_order`, `published`; soft-delete                                                                                                                                                                   |
| `section_translation`            | per-locale `eyebrow`/`title`/`subtitle` (N5); PK `(section_id, locale)`                                                                                                                                                                                                      |
| `block`                          | `section_id` (FK cascade), `type` (text/stat/step/feature/image/cta), `data` (jsonb, non-translatable: stat values in Western digits, icon keys, urls), `image_media_id` (soft media ref, NOT a cross-service FK), `sort_order`; soft-delete                                 |
| `block_translation`              | per-locale `title`/`body` (N5); PK `(block_id, locale)`                                                                                                                                                                                                                      |
| `service`                        | `slug` (unique), `icon_key`, `category` (`core`/`support`), `cover_media_id` (soft media ref), `sort_order`; soft-delete                                                                                                                                                     |
| `service_translation`            | per-locale `title`/`summary`/`detail_body` (N5); PK `(service_id, locale)`                                                                                                                                                                                                   |
| `testimonial`                    | `author_name`/`company_name` (proper nouns), `rating` (1–5, nullable), `featured`, `avatar_media_id` (soft media ref), `sort_order`; soft-delete. No slug (list-only)                                                                                                        |
| `testimonial_translation`        | per-locale `quote`/`author_role`/`company_descriptor` (N5); PK `(testimonial_id, locale)`                                                                                                                                                                                    |
| `team_member`                    | `slug` (unique), `email`/`linkedin_url`/`github_url`, `featured`, `avatar_media_id` (soft media ref), `sort_order`; soft-delete                                                                                                                                              |
| `team_member_translation`        | per-locale `name`/`role`/`bio` (N5); PK `(team_member_id, locale)`                                                                                                                                                                                                           |
| `portfolio_category`             | `slug` (unique), `sort_order`; soft-delete. Translatable lookup                                                                                                                                                                                                              |
| `portfolio_category_translation` | per-locale `name` (N5); PK `(portfolio_category_id, locale)`                                                                                                                                                                                                                 |
| `portfolio_project`              | `slug` (unique), `category_id` (FK → portfolio_category, `set null`), `client_name`/`project_url`, `status` (`draft`/`published`), `published_at` (set on first publish), `featured`, `cover_media_id` (soft media ref), `sort_order`; soft-delete                           |
| `portfolio_project_translation`  | per-locale `title`/`summary`/`challenge`/`solution`/`result` (N5); PK `(portfolio_project_id, locale)`                                                                                                                                                                       |
| `blog_category`                  | `slug` (unique), `sort_order`; soft-delete. Translatable lookup                                                                                                                                                                                                              |
| `blog_category_translation`      | per-locale `name`/`description` (N5); PK `(blog_category_id, locale)`                                                                                                                                                                                                        |
| `blog_tag`                       | `slug` (unique), `sort_order`; soft-delete. Translatable lookup                                                                                                                                                                                                              |
| `blog_tag_translation`           | per-locale `name` (N5); PK `(blog_tag_id, locale)`                                                                                                                                                                                                                           |
| `blog_post`                      | `slug` (unique), `category_id` (FK → blog_category, `set null`), `author_team_member_id` (FK → team_member, `set null`), `cover_media_id` (soft media ref), `status` (`draft`/`published`), `published_at` (set on first publish), `read_minutes`, `sort_order`; soft-delete |
| `blog_post_translation`          | per-locale `title`/`excerpt`/`body` (N5); PK `(blog_post_id, locale)`                                                                                                                                                                                                        |
| `blog_post_tag`                  | post ↔ tag M2M join (`blog_post_id`, `blog_tag_id`); PK `(blog_post_id, blog_tag_id)`, both FKs cascade. Plain repo (no entity state — N1)                                                                                                                                   |
| `faq`                            | `category` (`general`/`pricing`/`process`/`support`, nullable), `sort_order`; soft-delete. No slug (list-only)                                                                                                                                                               |
| `faq_translation`                | per-locale `question`/`answer` (N5); PK `(faq_id, locale)`                                                                                                                                                                                                                   |
| `menu`                           | `key` (`primary`/`footer`, unique machine key), `sort_order`; soft-delete. **NOT translatable** — a plain `BaseRepository` keyed container; items carry the labels                                                                                                           |
| `menu_item`                      | `menu_id` (FK cascade), `parent_id` (self-FK cascade, one nesting level), `url`, `icon`, `sort_order`; soft-delete                                                                                                                                                           |
| `menu_item_translation`          | per-locale `label` (N5); PK `(menu_item_id, locale)`                                                                                                                                                                                                                         |
| `lead`                           | `name`/`email`/`company`/`budget`/`project_type`/`message`, `source` (`contact`/`request-project`), `locale`, `status` (`new`/`contacted`/`archived`); soft-delete. Not translatable                                                                                         |
| `processed_message`              | idempotency ledger (MS6); PK `(consumer_id, message_id)`                                                                                                                                                                                                                     |
| `outbox`                         | transactional Outbox (MS3), shared table from `@sanad/messaging`                                                                                                                                                                                                             |

## The translatable repository canon (N5)

Every translatable entity repo extends the content-local `LocalizedRepository` (on the shared
`TranslatableRepository` from `@sanad/database`). It returns translatable fields as
`LocalizedText` ({ar,en}, null-safe — F7), batch-loaded N+1-safe (`localizedFieldsForMany`),
and writes both locales in one upsert (`upsertTranslations`, the admin per-locale save, W6).
Each entity is then a thin model-config + repo + service (reuse, not reinvent — U3/F9). The
`createLocalized`/`updateLocalized`/`findAllTranslations` canon is proven against `content_test`
in `content-db.int.spec.ts`.

## The page tree

The website fetches a page as an assembled tree: `PageTree = { page, sections: [{ …section,
blocks: [...] }] }`, copy resolved to BOTH locales, ordered by `sort_order`, **published only**
on the public read (drafts are hidden, WEB2). The admin composes it with granular upserts
(page → sections → blocks), each keyed by an optional `id` (present → update, absent → create).

## Message patterns (MS2 — request/reply)

| Pattern                             | Payload                                              | Reply                                                     |
| ----------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `content.page.tree`                 | `{ slug }`                                           | `PageTree`                                                |
| `content.page.list`                 | `ListQuery`                                          | `Paginated<PageSummary>`                                  |
| `content.page.upsert`               | `PageUpsertRequest`                                  | `PageSummary`                                             |
| `content.page.delete`               | `{ id }`                                             | `{ id }`                                                  |
| `content.section.upsert`            | `SectionUpsertRequest`                               | `SectionNode`                                             |
| `content.section.delete`            | `{ id }`                                             | `{ id }`                                                  |
| `content.block.upsert`              | `BlockUpsertRequest`                                 | `BlockNode`                                               |
| `content.block.delete`              | `{ id }`                                             | `{ id }`                                                  |
| `content.service.list`              | `ServiceListQuery`                                   | `Paginated<ServiceItem>`                                  |
| `content.service.get`               | `{ slug }`                                           | `ServiceItem`                                             |
| `content.service.create`            | `ServiceCreateRequest`                               | `ServiceItem`                                             |
| `content.service.update`            | `ServiceUpdateRequest`                               | `ServiceItem`                                             |
| `content.service.delete`            | `{ id }`                                             | `{ id }`                                                  |
| `content.testimonial.list`          | `TestimonialListQuery`                               | `Paginated<TestimonialItem>`                              |
| `content.testimonial.create`        | `TestimonialCreateRequest`                           | `TestimonialItem`                                         |
| `content.testimonial.update`        | `TestimonialUpdateRequest`                           | `TestimonialItem`                                         |
| `content.testimonial.delete`        | `{ id }`                                             | `{ id }`                                                  |
| `content.team-member.list`          | `TeamMemberListQuery`                                | `Paginated<TeamMemberItem>`                               |
| `content.team-member.get`           | `{ slug }`                                           | `TeamMemberItem`                                          |
| `content.team-member.create`        | `TeamMemberCreateRequest`                            | `TeamMemberItem`                                          |
| `content.team-member.update`        | `TeamMemberUpdateRequest`                            | `TeamMemberItem`                                          |
| `content.team-member.delete`        | `{ id }`                                             | `{ id }`                                                  |
| `content.portfolio-category.list`   | `PortfolioCategoryListQuery`                         | `Paginated<PortfolioCategoryItem>`                        |
| `content.portfolio-category.create` | `PortfolioCategoryCreateRequest`                     | `PortfolioCategoryItem`                                   |
| `content.portfolio-category.update` | `PortfolioCategoryUpdateRequest`                     | `PortfolioCategoryItem`                                   |
| `content.portfolio-category.delete` | `{ id }`                                             | `{ id }`                                                  |
| `content.portfolio.list`            | `PortfolioListQuery` (status filter)                 | `Paginated<PortfolioProjectItem>` (category embedded)     |
| `content.portfolio.get`             | `{ slug }`                                           | `PortfolioProjectItem` (published only)                   |
| `content.portfolio.create`          | `PortfolioCreateRequest`                             | `PortfolioProjectItem`                                    |
| `content.portfolio.update`          | `PortfolioUpdateRequest`                             | `PortfolioProjectItem`                                    |
| `content.portfolio.delete`          | `{ id }`                                             | `{ id }`                                                  |
| `content.blog-category.list`        | `BlogCategoryListQuery`                              | `Paginated<BlogCategoryItem>`                             |
| `content.blog-category.create`      | `BlogCategoryCreateRequest`                          | `BlogCategoryItem`                                        |
| `content.blog-category.update`      | `BlogCategoryUpdateRequest`                          | `BlogCategoryItem`                                        |
| `content.blog-category.delete`      | `{ id }`                                             | `{ id }`                                                  |
| `content.blog-tag.list`             | `BlogTagListQuery`                                   | `Paginated<BlogTagItem>`                                  |
| `content.blog-tag.create`           | `BlogTagCreateRequest`                               | `BlogTagItem`                                             |
| `content.blog-tag.update`           | `BlogTagUpdateRequest`                               | `BlogTagItem`                                             |
| `content.blog-tag.delete`           | `{ id }`                                             | `{ id }`                                                  |
| `content.blog-post.list`            | `BlogPostListQuery` (category/status filter)         | `Paginated<BlogPostItem>` (category+author+tags embedded) |
| `content.blog-post.get`             | `{ slug }`                                           | `BlogPostItem` (published only)                           |
| `content.blog-post.create`          | `BlogPostCreateRequest` (`tagIds` M2M, ids-on-write) | `BlogPostItem`                                            |
| `content.blog-post.update`          | `BlogPostUpdateRequest` (`tagIds` replaces the set)  | `BlogPostItem`                                            |
| `content.blog-post.delete`          | `{ id }`                                             | `{ id }`                                                  |
| `content.faq.list`                  | `FaqListQuery`                                       | `Paginated<FaqItem>`                                      |
| `content.faq.create`                | `FaqCreateRequest`                                   | `FaqItem`                                                 |
| `content.faq.update`                | `FaqUpdateRequest`                                   | `FaqItem`                                                 |
| `content.faq.delete`                | `{ id }`                                             | `{ id }`                                                  |
| `content.menu.get`                  | `{ key }`                                            | `MenuTree`                                                |
| `content.menu.list`                 | (none)                                               | `MenuSummary[]`                                           |
| `content.menu.create`               | `MenuCreateRequest`                                  | `MenuSummary`                                             |
| `content.menu.delete`               | `{ id }`                                             | `{ id }`                                                  |
| `content.menu-item.create`          | `MenuItemCreateRequest`                              | `MenuItemNode`                                            |
| `content.menu-item.update`          | `MenuItemUpdateRequest`                              | `MenuItemNode`                                            |
| `content.menu-item.delete`          | `{ id }`                                             | `{ id }`                                                  |
| `content.lead.submit`               | `LeadCreateRequest`                                  | `{ id }`                                                  |
| `content.lead.list`                 | `LeadListQuery`                                      | `Paginated<Lead>`                                         |
| `content.lead.update`               | `LeadUpdateRequest`                                  | `Lead`                                                    |

## Events emitted (MS3 — Outbox)

| Event          | Payload            | Consumers                       |
| -------------- | ------------------ | ------------------------------- |
| `lead.created` | `LeadCreatedEvent` | notifications (P6), CRM (later) |

## Events consumed (MS6 — idempotent)

| Event           | Source        | Action                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `media.deleted` | media-service | Nulls every `image_media_id`/`cover_media_id`/`avatar_media_id` referencing the deleted asset (block, service, testimonial, team_member, portfolio_project), in one tx with the `processed_message` claim (idempotent; the asset id is the idempotency key). Invalid/transient failures are dropped without requeue (a DLQ + retry counter is a future `@sanad/messaging` enhancement). |

## Gateway surface (MS4)

**Public** (no auth — the website): `GET /api/content/pages/:slug` (assembled tree),
`GET /api/content/services`, `GET /api/content/services/:slug`, `GET /api/content/testimonials`,
`GET /api/content/team`, `GET /api/content/team/:slug`,
`GET /api/content/portfolio-categories`, `GET /api/content/portfolio` (published only),
`GET /api/content/portfolio/:slug` (published only), `GET /api/content/blog-categories`,
`GET /api/content/blog-tags`, `GET /api/content/blog` (published only),
`GET /api/content/blog/:slug` (published only), `GET /api/content/faqs`,
`GET /api/content/menus/:key` (assembled menu tree), `POST /api/leads`.
**Guarded** `content.read`: `GET /api/content/pages`, `GET /api/content/portfolio/manage`
(sees drafts), `GET /api/content/blog/manage` (sees drafts), `GET /api/content/menus`.
**Guarded** `content.manage`: `POST /api/content/pages`, `DELETE /api/content/pages/:id`,
`POST|DELETE /api/content/sections[/:id]`, `POST|DELETE /api/content/blocks[/:id]`,
`POST /api/content/services`, `PATCH|DELETE /api/content/services/:id`,
`POST /api/content/testimonials`, `PATCH|DELETE /api/content/testimonials/:id`,
`POST /api/content/team`, `PATCH|DELETE /api/content/team/:id`,
`POST /api/content/portfolio-categories`, `PATCH|DELETE /api/content/portfolio-categories/:id`,
`POST /api/content/portfolio`, `PATCH|DELETE /api/content/portfolio/:id`,
`POST /api/content/blog-categories`, `PATCH|DELETE /api/content/blog-categories/:id`,
`POST /api/content/blog-tags`, `PATCH|DELETE /api/content/blog-tags/:id`,
`POST /api/content/blog`, `PATCH|DELETE /api/content/blog/:id`,
`POST /api/content/faqs`, `PATCH|DELETE /api/content/faqs/:id`,
`POST|DELETE /api/content/menus[/:id]`, `POST /api/content/menu-items`,
`PATCH|DELETE /api/content/menu-items/:id`, `GET /api/leads`, `PATCH /api/leads/:id`.

## Coded defaults / seed (U9 / WEB1 / F7)

`SeedService` (boot, idempotent) populates the default **landing** page tree
(hero/services/process/stats/cta + process steps + stat blocks), the four **core services**,
two **testimonials**, four **team members** (the `role.*` labels), five **portfolio categories**
(from `trust.domain.*`; case-study projects are admin-managed — seed 0), three **blog categories**

- three **blog tags** + **one sample DRAFT post** (the blog index/taxonomy is populated; the
  draft never leaks publicly — WEB2 — and proves the category+author+tags embed pipeline), four
  **FAQs**, and the **primary + footer menus** (from `nav.*`) from `seed/seed-data.ts` (authored
  bilingual copy from `.claude/design/content-defaults.md`), so the site never renders blank.
  Slug/key-keyed collections (pages/services/team/portfolio-categories/blog/menus) seed only
  **absent** slugs/keys; key-less collections (testimonials/faqs) seed only when the collection is
  **empty**. The blog post resolves its `categorySlug`/`authorSlug`/`tagSlugs` to ids at seed time
  (categories/tags/team seed first). Brand/global strings (brand.name, tagline) stay in the
  settings-service (P3) — not duplicated here (U3).

## Settings used

None yet. (A future enhancement may resolve a feature toggle / locale set from the
settings-service via `settings.resolve`, U9.)
