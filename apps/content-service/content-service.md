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
(Outbox, MS3) for the notifications service (P6) — the website has **two** front-ends onto this
same `content.lead.submit` path: the simple `/contact` form (`source: 'contact'`) and the
multi-step `/request-a-project` form (`source: 'request-project'`, 8.E-5); the `source` column
distinguishes them (no schema change was needed — both values pre-existed on `leadSourceSchema`).
Since **P8.10.B1** a lead also carries a **required `phone`**, validated per-country by the shared
`phoneSchema` (`@sanad/contracts`) and stored normalized as **E.164**; the column is nullable only
because leads captured before it have none, and the inbox `search` filter covers it.
It is the first consumer of `media.deleted`
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
| `section`                        | `page_id` (FK cascade), `type` (hero/services/process/stats/cta/…), `sort_order`, `published`, `config` (jsonb, nullable — the collection link `{ mode, limit?, ids }`, Phase 3); soft-delete                                                                                |
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
| `lead`                           | `name`/`email`/`phone`/`company`/`budget`/`project_type`/`message`, `source` (`contact`/`request-project`), `locale`, `status` (`new`/`contacted`/`archived`); soft-delete. Not translatable                                                                                 |
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

The **admin builder** (P7.C Stage 4) reads the **draft-visible** tree by page id via
`content.page.tree-admin` (`{ id }` → `PageTree`, no published filter on the page or its
sections) — the public `content.page.tree` (by slug) stays published-only.

### Section↔collection hydration (P8.5 Content Studio, Phase 3)

A section can **link a collection** (services / work / testimonials / blog…) instead of (or
alongside) hand-authored blocks. The link is a non-translatable **`section.config`** jsonb
(`SectionCollectionConfig = { mode: 'featured'|'picked'|'all', limit?, ids }`, from
`@sanad/contracts`), written by the admin's section collection panel. During tree assembly
(`PageService.assembleTree` / `sectionNode`), `CollectionHydrationService.hydrate(type, config,
{ publishedOnly })` resolves the linked records **in-service** (same DB — no RMQ, MS5) and
attaches them onto the returned **`SectionNode.collection`** (`HydratedCollection`, a
discriminated union on `collection`; `null` when the type links no collection). The shared
`@sanad/web-ui` section component then reads `section.collection.items` exactly like it reads
`section.blocks`, so the website (live) and the admin preview render the identical cards
(preview===live).

The hydrator registry grows **one collection at a time** as each section is unified into the
shared lib (MS9): **`services`** first, then **`trust` → the `portfolio` collection** (the domain
constellation; groups the projects by category), then **`work` → the `portfolio` collection** (the
WEB10 case-study orbit; the shared component renders each project as an instrument card with a
cover), then **`testimonials` → the `testimonials` collection** (the received-transmissions wall;
each quote is a card with the author's photo + rating) and **`blog` → the `blog` collection** (the
ship's-log teaser; each post is a log row with an optional cover thumbnail), and — **Phase 5** — the
marketing-page collections: **`faq` → the `faq` collection** (the `/faq` accordion) and **`team` →
the `team_member` collection** (the `/about` roster, avatars pre-resolved server-side). `trust` and
`work` share the same `hydratePortfolio` (same collection, keyed on the section TYPE). Each hydrator
reuses the collection's existing application service (`ServiceService` / `PortfolioProjectService` /
`TestimonialService` / `BlogPostService` / `FaqService` / `TeamMemberService`) — same row→`*Item`
mapping the public list endpoint uses (single source of truth, U3) — never a duplicate query. `testimonials`/`blog` gained a
`listByIds`/`findByIds` for the `picked` path (the blog one runs through `assembleMany` so the
embedded category/author/tags survive). **Per-collection mode semantics:** `picked` → exactly
`config.ids` in order; `all` → the collection's own order (services/portfolio/testimonials/blog:
`sortOrder`) capped at `limit`; `featured` → the featured subset (a collection's `featured` flag —
portfolio's `work` reel + testimonials' flagged wall), or `all` for collections without a `featured`
flag (services, **blog**, **faq**). **Default caps** match the website's live fetchers so the swap
is a visual no-op: services **8**, trust/work **6**, testimonials **2** (the visible count), blog
**3**, faq/team **8**. `faq`/`team` gained a `listByIds`/`findByIds` for the `picked` path.
On the **public** tree (`publishedOnly`) the portfolio + blog hydrators force `status:'published'`
so drafts never leak (WEB2; testimonials have no draft concept). `config` is written with **partial
semantics** (only when the upsert body carries it) so an inline copy edit never wipes the link.
**Admin curation modes:** trust **`all`-only** (breadth of domains); **`work`/`testimonials`
`featured`/`picked`/`all`** (curated showcases); **`blog` `picked`/`all`** (no featured flag). The
landing seed includes `work`, `testimonials`, and `blog` sections (no blocks; `config` unset →
`all`) so a fresh DB renders every collection-backed chapter.

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

Every orderable entity also answers a `*.reorder` pattern (`content.<resource>.reorder`,
payload `{ ids }` → reply `{ ids }`) — services, testimonials, team-member, faq, portfolio,
portfolio-category, blog-category, blog-tag, and (P7.C Stage 4) **page, section, block,
menu-item** — backed by `BaseRepository.reorderByIds` (a single atomic `UPDATE … CASE` that
renumbers `sort_order` to match the id sequence, drag-and-drop, W6). The caller passes the
sibling id set (sections within a page, blocks within a section, items within a menu/parent).
Blog adds `content.blog-post.get-by-id` (`{ id }` → `BlogPostItem`, admin — drafts visible),
the by-id counterpart of the slug `content.blog-post.get` that feeds the admin post editor.

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
**Guarded** `content.read`: `GET /api/content/pages`, `GET /api/content/pages/:id/tree`
(**draft-visible admin tree** — the P7 builder), `GET /api/content/portfolio/manage`
(sees drafts), `GET /api/content/blog/manage` (sees drafts), `GET /api/content/menus`.
**Guarded** `content.manage`: `POST /api/content/pages`, `DELETE /api/content/pages/:id`,
`PATCH /api/content/{pages,sections,blocks,menu-items}/reorder` (drag-and-drop, P7.C Stage 4),
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

`SeedService` (boot, idempotent) populates the default **landing** page tree plus the **legal
pages** `privacy` + `terms` (8.E-4 — each a `richtext` section tree with bilingual sanitized-HTML
block bodies; rendered by the website's `[...slug]` catch-all, no bespoke route) plus the **Phase-5
marketing pages** `about` + `faq` (editable CMS trees replacing the hardcoded routes — `about` =
`richtext` hero/story/values + a hydrated `team` roster + a `richtext` closing CTA; `faq` = a
`richtext` hero + a hydrated `faq` accordion + a `richtext` closing CTA; a marketing hero/CTA is a
generic `richtext` section, NOT the landing `hero`/`cta` type whose components carry landing-only
chrome) plus the **Phase-5 HYBRID marketing pages** `process` + `portfolio` + `services` + `blog`
(each seeds ONLY the two editable bands — a `richtext` hero + a `richtext` closing CTA; the page
BODY — the process phases-timeline, the portfolio/blog filtered galleries, the services grid — stays
a website component rendered between the bands, so no collection section is seeded on these pages;
copy byte-sourced from the website's `PROCESS_COPY`/`PORTFOLIO_COPY`/`SERVICES_COPY`/`BLOG_COPY`)
plus the **Phase-5 FINAL marketing pages** `careers` + `contact` + `request-a-project`: **`careers`**
is a FULL CMS page — four editable `richtext` bands (hero + culture + openings + a closing CTA →
`/contact`); its culture/openings render as `richtext` prose (`<h3>`/`<p>`), the coded card grid
retired for full studio editability (mirrors how `about` retired its bespoke body). **`contact`** +
**`request-a-project`** are CMS-chrome pages — a single editable `richtext` hero band above the KEPT
bespoke lead form (the form → `POST /leads` → `lead.created` path is untouched); the hero carries no
CTA block + there is no closing band, because the form is the conversion. Copy byte-sourced from the
website's `CAREERS_COPY`/`CONTACT_COPY`/`REQUEST_COPY`.
`SEED_PAGES = [LANDING, PRIVACY, TERMS, ABOUT, FAQ, PROCESS, PORTFOLIO, SERVICES, BLOG, CAREERS, CONTACT, REQUEST_A_PROJECT]`
(guarded by `seed-data.spec.ts` — the hybrid pages assert 2 richtext bands + the hero's
conversion-route CTA; careers asserts 4 bands with hero + closing → `/contact`; contact/request assert
a single hero band with no CTA block). **`section_type` now also carries
`faq` + `team`** (added by the additive `0006_*` `ALTER TYPE … ADD VALUE` migration alongside the
already-present `richtext`; N10 — schema-qualified, its own migration, no co-pending use)
(hero/**trust**/services/process/stats/cta — enriched 2026-07-07 for the mission-panel landing:
the hero carries three proof-strip `feature` blocks; `trust` is a real seeded section; `services`
carries per-service capability `feature` blocks + a mono tech `text` block joined by
`data.service`; each process `step` carries a translatable `data.duration` plus per-phase
deliverable `feature` blocks joined by `data.step`; each `stat` carries a mono context line in
`body`; `cta` carries the three "ماذا يحدث بعد رسالتك" `feature` steps), the four **core
services**, three **testimonials**, four **team members** (the `role.*` labels), five **portfolio
categories** (from `trust.domain.*`) + **five PUBLISHED case studies** (one per category, each
with a `clientName` + a numeric-led `result` the works instrument card splits into metric + words;
admin-editable, idempotent on slug), three **blog categories**

- three **blog tags** + **four PUBLISHED blog posts** (8.E-3 — the `/blog` index + post pages
  render from the DB, so the public blog is never empty; `publishedAt` auto-stamps on create,
  `coverMediaId` stays null → the amber Logbook-planet fallback; bilingual title/excerpt/prose
  body across all three categories to exercise the index filter), **eleven FAQs** (8.E-4 — 2–3 per
  `faq_category`: process/pricing/support/general, so the `/faq` accordion is substantial), and the
  **primary and footer menus** (from `nav.*`) from `seed/seed-data.ts` (authored
  bilingual copy from `docs/design/content-defaults.md`), so the site never renders blank. The
  **footer menu is nested columns** (8.E-4 — `SeedMenuItem.children`; the seed loop creates each
  child with `parentId`): **Company** / **Services** / **Legal**, so Careers + the legal pages are
  reachable from the footer; the **primary menu is flat** (incl. FAQ).
  Slug/key-keyed collections (pages/services/team/portfolio-categories/blog/menus) seed only
  **absent** slugs/keys; key-less collections (testimonials/faqs) seed only when the collection is
  **empty**. The blog post resolves its `categorySlug`/`authorSlug`/`tagSlugs` to ids at seed time
  (categories/tags/team seed first). Brand/global strings (brand.name, tagline) stay in the
  settings-service (P3) — not duplicated here (U3).

## Errors — one not-found key PER ENTITY (U24)

[`content-errors.ts`](src/content/application/errors/content-errors.ts) returns
`rpcError(status, key, params)` from [`@sanad/i18n`](../../libs/shared/i18n/i18n.md); the text
lives only in the ar/en catalogs and is rendered once at the gateway edge.

- `contentNotFound(entity, idOrSlug)` → 404. It maps the entity through `NOT_FOUND_KEYS` to its
  **own** key — `content.notFound.blogPost`, `.menuItem`, `.page`, `.section`, `.block`,
  `.blogCategory`, `.blogTag`, `.service`, `.portfolioProject`, `.portfolioCategory`,
  `.teamMember`, `.testimonial`, `.faq`, `.menu`, `.lead` — because Arabic will not take an
  English entity noun pasted into a generic template (U8). An unmapped entity falls back to the
  generic `content.notFound`.
- `slugConflict(slug)` → 409 `content.slugConflict`.

## Settings used

None yet. (A future enhancement may resolve a feature toggle / locale set from the
settings-service via `settings.resolve`, U9.)

## Event catalog (U27)

Every event this service emits or consumes is declared once in the **`EVENT_CATALOG`**
(`libs/contracts/src/lib/events/`), with its payload schema, its producer and its consumers —
and the publish path is typed against it, so an un-catalogued name is a typecheck failure
(`createOutboxRecord` only accepts a `BrokerEventName`). Adding an event here means adding its
`*.event.ts` to the catalog in the same change.
