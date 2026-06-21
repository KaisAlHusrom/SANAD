# 00 — Full System Map

> The complete feature/module map for the Sanad Tech platform, tiered **MVP / Later / Someday**, with a domain-model sketch. The build order is `02-mvp.md`; this file is the destination.

## Surfaces

| Surface | Stack | Audience | Purpose |
|---|---|---|---|
| **Website** | Next.js (App Router) | Public | Premium Arabic-first marketing + lead capture; 100% DB-driven content. |
| **Admin / ERP portal** | React + Vite | Staff (admin, dev, designer, QA, blog-writer, business-manager…) | Manage website + run the agency (projects, CRM, HR, finance, support). |
| **Client portal** | React + Vite | Clients | Follow projects phase-by-phase, approve deliverables, message, pay, get support. |
| **API gateway** | NestJS | — | The only public entry; validates JWT, routes/aggregates to services over RMQ. |

## Backend services (bounded contexts)

Each is its own NestJS app with its **own database**, talking over RabbitMQ. Built incrementally.

### MVP services (the website + admin priority)
- **identity** — users, roles, permissions (RBAC), JWT access+refresh; staff roles + client role. *Reusable everywhere.*
- **settings** — advanced configuration engine: each setting has `key`, `type`, `requirement`, `options`, `defaultValue`, `scope`, `group`; resolves override→global→coded-default; holds branding/visual-identity. *Reusable in any project.*
- **content** (CMS) — pages, sections/blocks, services, portfolio/case-studies, blog (posts, categories, tags), testimonials, FAQ, navigation/menus, contact-form submissions → **lead event**. Translatable (ar/en).
- **media** — Cloudflare R2 uploads, signed URLs, media library. *Reusable.*
- **notifications** — email + in-app notifications; subscribes to domain events. *Reusable.*
- **analytics** (light) — page views, form submissions, content counts → admin dashboard stats. (May start as a thin module inside the gateway/content and graduate to a service.)

### Later services (post first-deploy)
- **projects** — projects, **phases/milestones**, tasks, sprints/kanban, **timesheets** (billable flag), deliverables, **client approvals/sign-off**, status reports for the weekly meeting.
- **crm** — leads (consumes website lead events), pipeline/opportunities, proposals/quotes, sales contracts, (later) retainers/subscriptions.
- **hr** — employees, departments/positions, attendance/work-time, leave/time-off, payroll-basics, recruitment/ATS, onboarding, appraisals. Shared **approval engine** + **work-entry ledger**.
- **finance** — invoicing (T&M / fixed-fee / milestone), payments (Stripe), expenses, per-project budgets, profitability (cost-rate vs bill-rate).
- **support** — helpdesk tickets, SLA policies, support/maintenance contracts (prepaid-hours burndown), KB.
- **documents** — document storage/workspaces, e-signature (signer roles + audit trail), internal wiki.
- **ai-assistant** — LLM assistant for staff + clients (Claude SDK), reads via RMQ request/reply into services (never raw DB).

### Someday
- Native mobile apps for the portals (React Native) — mobile is a *service Sanad sells*; only build Sanad's own app if demand appears.
- Multi-tenant white-labeling of the whole platform as a product (the advanced settings engine already leans this way).

## Admin / ERP portal modules

**MVP:** Auth/RBAC · **Website management** (settings/branding editor, pages, services, portfolio, blog, testimonials, FAQ, menus — translatable per-locale tabs) · **Leads inbox** · **Dashboard/stats** · **Media library** · **Notifications** · **Users & roles**.

**Later (PSA "earn → deliver → bill" loop):** Projects + Phases + Tasks + Sprints + Timesheets + Deliverables + Approvals · CRM pipeline + Quotes + Contracts · Invoicing + Payments + Expenses + Budgets + Profitability · HR (employees/positions/time-off/attendance/payroll/recruitment/appraisals) · Helpdesk + SLA + support contracts · Documents + e-sign · Audit log · BI dashboards · Company settings (currencies/taxes/work-calendars/templates/feature-toggles).

## Client portal modules

**MVP:** Secure login · Project overview dashboard (current phase, % completion, next milestone) · Phases/milestones + timeline/roadmap · **Per-phase deliverable review + approve/request-changes + formal sign-off** · Messages/inquiries + comments + announcements + **weekly-meeting notes** (differentiator) · Files/contracts access · Invoices + payment status + **pay online (Stripe)** · **Support tickets + support-contract-status widget** (differentiator) · New-project & scope-change requests · Notifications · Profile.

**Later:** Client-facing Gantt · proofing/annotation · phase-gates that block progress · in-portal video meetings + scheduling · retainers/subscriptions self-management · CSAT/feedback · knowledge base · multi-user client teams + roles · white-label branding.

## Domain-model sketch (per service — refined in `01-architecture.md`)

- **identity:** `user` (hidden:`password`), `role`, `permission`, `role_permission`, `user_role`, `refresh_token`. Permissions `<resource>.<action>` (`content.create`, `projects.read`, `manage`=wildcard). Client = a user with the `client` role + a `client_profile`.
- **settings:** `setting` (key, type, requirement, options, default, scope, group), `setting_value` (scope-keyed), `setting_translation`. Branding is a settings group.
- **content:** `page`, `section`, `block`, `service`, `portfolio_project`, `blog_post`, `blog_category`, `blog_tag`, `testimonial`, `faq`, `menu`, `menu_item`, `lead` (from contact form); each translatable entity + its `*_translations`.
- **media:** `media_asset` (R2 key, type, size, alt, dimensions), `media_folder`.
- **notifications:** `notification` (recipient, channel, type, payload, read_at), `processed_message` (idempotency).
- **projects (later):** `project`, `phase`, `milestone`, `task`, `sprint`, `time_entry`, `deliverable`, `approval`.
- **crm/hr/finance/support/documents (later):** see each future feature plan.

## Cross-service event catalog (seed — extend in `03-microservices-platform.md`)

| Event | Emitted by | Consumed by |
|---|---|---|
| `lead.created` | content | crm (later), notifications |
| `user.registered` / `user.role.changed` | identity | notifications, (audit later) |
| `media.deleted` | media | content (reconcile references) |
| `phase.signed_off` (later) | projects | finance (milestone billing), notifications, client-portal |
| `invoice.paid` (later) | finance | projects, notifications |

All events go through the **Outbox** (MS3); all consumers are **idempotent** (MS6).
