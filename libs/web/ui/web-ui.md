# @sanad/web-ui

The shared **website renderer** for Page → Section → Block content. One set of components renders
the same content in three places, selected by a `mode` prop:

- **`mode="preview"`** — the admin pages-builder live preview (P7). Empty content shows a neutral
  placeholder; unpublished sections are dimmed.
- **`mode="edit"`** — the admin Content Studio (P8.5). Same placeholders/dimming as preview, PLUS
  the editable affordances light up when an `EditProvider` supplies the seam callbacks:
  - content leaves (`SectionField`/`EditableText`) → inline text edit (hover outline + pencil +
    `contentEditable`) via `onCommit`;
  - `image` blocks (`EditableImage`) → a corner "change image" button via `onPickImage(path)` (a
    `block-image` field path); the admin opens its media picker and commits the chosen `imageMediaId`;
  - collection cards (work/testimonial/blog, wrapped by `RecordEditFrame`) → a corner "edit record"
    button via `onEditRecord(collection, id)`; the admin routes to that record's editor (their covers
    live on their own tables, not the page tree, so they can't be inline-committed).
    All three enter as **injected props/context** — the lib imports no data/route layer (`type:ui`), and
    the primitives are mounted ONLY in `edit`, so the website ships pure server HTML (no added hydration).
- **`mode="live"`** — the public Next.js website (P8). Empty content renders nothing (the data layer
  has already filtered publish state); the website injects its real motion + navigation via `slots`
  (below) so the animated landing renders the SAME components as the CMS preview (**preview===live**,
  the P8.5 live-swap).

This is the realization of the "one prop-driven renderer shared by website + admin" decision: the
admin preview and the website render byte-for-byte the same DOM, so a change to a section's visual
shows up in both. The **data contract is the bond** (`SectionNode`/`BlockNode` from
`@sanad/contracts`).

## Public API

- `WebsiteShell` — the single place the website's fixed-dark theme attaches. Renders the
  `.sanad-web` scope (which sources every `--web-*` color), injects the per-page accent inline from
  `pageAccents[pageAccent]`, and sets `dir` from the locale. Wrap the admin preview canvas — or the
  whole website page (P8) — in this. Optional `style` prop (P8.A): extra inline CSS merged AFTER the
  accent onto the same `.sanad-web` element, so the website can inject the runtime branding
  `--web-*` surface/text/font vars (they win over `web-ui.css` defaults by cascade).
  **`pageAccent="route"` (P8.D one-universe, WEB12):** omits the inline accent vars entirely so the
  website's server-rendered `AccentStyle` `:has([data-system])` rules resolve the accent per route
  (an inline style would beat them by cascade). The admin preview keeps passing a concrete
  `PageAccentKey`; only the website layout uses `'route'`.
- `SectionRenderer` — renders an ordered list of `SectionNode`s (the website page body, P8).
- `SectionBlock` — renders one `SectionNode`. Dispatches on `section.type` through the
  `SECTION_REGISTRY` (a per-type shared component); an unregistered type falls through to the
  generic eyebrow/title/subtitle + `BlockRenderer` body. **Every real `SectionType` is now
  registered** (`hero`/`stats`/`process`/`services`/`trust`/`work`/`testimonials`/`blog`/`cta` +
  the Phase-5 `richtext`/`faq`/`team`) — the generic body is a defensive fallback for an
  unrecognized/forward-compat type only.
- `HeroSection` / `StatsSection` / `ProcessSection` / `ServicesSection` / `TrustSection` /
  `WorksSection` / `TestimonialsSection` / `BlogSection` / `CtaSection` — the per-type shared
  components. **Phase 5** adds three generic marketing-page sections: **`RichTextSection`** (a prose
  band — section head + its `richtext` blocks' trusted HTML via `BlockRenderer`; long-form prose is
  authored in the typed Quill block modal, NOT inline — no `EditableRichText`; also the component the
  seeded privacy/terms + marketing hero/CTA bands render through, so its head fields carry NO live
  fallback), **`FaqSection`** (head + a collection-backed accordion — the `FaqDisclosures` client
  island ported from the website; rows localized server-side via `deriveFaqRows`; `RecordEditFrame`
  per row in edit), and **`TeamSection`** (head + a roster grid from the hydrated `team` collection;
  `deriveTeamCards` bakes `avatarUrl` server-side — RSC-safe — with a gradient-initial fallback, F3).
  Content lives here; page-chrome + motion are **injected as slots**. Each ships its coded-default
  copy (`HERO_COPY`/…/`FAQ_SECTION_COPY`/`TEAM_SECTION_COPY`, F7; `RICH_TEXT_COPY` is edit-placeholders
  only).
- `BlockRenderer` — renders one `BlockNode`; a `switch` over the 7 block types
  (`text`/`richtext`/`stat`/`step`/`feature`/`image`/`cta`). `richtext` uses
  `dangerouslySetInnerHTML` for **admin-authored, trusted** content — the same trust boundary holds
  when P8 serves it publicly (content is admin-authored; do not wire untrusted input through it). A
  `cta` block's **root-relative** href is locale-prefixed by the active `locale` (`/contact` →
  `/en/contact`) so a CTA keeps the visitor in their language; external/hash/prefixed hrefs pass
  through.
- `RenderMode` — the `'preview' | 'live' | 'edit'` type + `RenderProps`; `isEditorMode(mode)` is
  `mode !== 'live'`.

## Motion + chrome slots (the live-swap seam)

Motion is **injected, never imported** — the lib stays `type:ui` (framer-free, SSR-clean) and the
website's SEO text is server-rendered. A section component takes an optional `slots` prop
(`SectionSlots`); `resolveSlots` defaults each to a static passthrough, so the admin preview passes
NONE → faithful-static, while the website injects its real client wrappers for `mode='live'`:

- `Reveal` — scroll-reveal wrapper (website passes its `.lp-flow`-emitting `Reveal`; default = a
  plain `<div>`). On the landing this is what the `ChapterStage` GSAP driver keys off.
- `Headline` — word-split `<h1>` (website passes `WordReveal`; default splits on `<br>`, no motion).
- `Counter` — count-up number (website passes `CountUpNumber`; default = static value + suffix).
- `Actions` — the hero CTA row (website injects the warp CTA → `/request-a-project` + the `#works`
  anchor; default = two static `<span class="web-cta">` labels).
- `Backdrop` — a full-bleed layer behind a section — the hero's legibility veil over the cosmos
  star, or the **cta** launch band's veil/glow/rings (website injects `.web-hero-veil` /
  `.lp-cta-veil` chrome; default = nothing). `cta` reuses `Reveal`+`Actions`+`Backdrop` (no new slot).
- `Cue` — the "begin the journey" scroll cue under the hero (default = nothing).

**`ProcessSection`** takes a dedicated **`System?`** prop (the live "phases as moons" visualization —
the website injects `ProcessMoons`) rather than a generic slot, so the shared `SectionSlots` union
stays free of a process-only concern (mirrors hero's `anchorId` prop). Without it (admin
preview/edit, or any non-`live` render) the section draws the phase-briefing cards **statically** —
byte-identical `.web-process-card*` DOM to the live moons (preview===live), editable in `edit` mode.
The phase-accent cycle (cyan→sky→indigo→teal) is `processPhaseAccents` (`@sanad/config` → `--web-phase-*`,
drift-guarded by `web-ui.tokens.spec`).

`HeroSection` also takes an optional **`anchorId`** → the rendered `<section id>`; the website
passes `"hero"` so the cosmos planet-dock (`use-section-metrics`), the wayfinder rail and the
`#hero`/`#works` anchor glide keep resolving. The admin omits it (no cosmos to dock). The website's
concrete slots live in `apps/website/src/components/landing/live-section-slots.tsx`.

Components take `locale` as a **prop** (not an i18n hook) — the lib stays framework-light and
SSR-clean for P8. Images: pass an optional `resolveImageUrl(id)` (P8 injects R2/CDN resolution); the
admin omits it and shows the placeholder frame.

## Styling — colocated CSS (approach a)

All styling lives in **`src/web-ui.css`**, scoped under `.sanad-web` and themed from `--web-*`
custom properties. The host imports it once:

```ts
import '@sanad/web-ui/web-ui.css';
```

The scope **never references an admin/portal token** (`--surface`/`--accent`/`--text`), so the
renderer always shows the website's fixed-dark signature theme (WEB7) regardless of the host app's
light/dark state — the preview inside the admin looks like the live site, not the dashboard. The
host needs no Tailwind change (the lib ships its own CSS; it builds via `tsc`, not Tailwind). Logical
properties only (U7) so the same components flip for RTL (ar default) and LTR.

The `--web-*` literal values are the website token single source (`websiteTokens`/`fonts` in
`@sanad/config`, U6); **`web-ui.tokens.spec.ts`** asserts the CSS and `tokens.ts` stay in lockstep.
The per-page accent is dynamic (inline `--web-accent` from `WebsiteShell`).

## Boundaries

Tagged `["scope:web", "type:ui"]`. `type:ui` may depend only on `type:ui`/`type:util`/`type:types`
— it can never reach a `type:data-access` lib, keeping the renderer browser-safe (deps:
`@sanad/contracts`, `@sanad/config`, `lucide-react`; React is a peer dependency). Both the
admin-portal and the future website (`scope:web`) may import it.

## Tests

`nx test web-ui` (vitest + jsdom + RTL): per-block-type render + localized copy + data reading,
locale fallback (F7), `mode` placeholder behavior, section sort order, unpublished dimming, the
`WebsiteShell` accent/`dir`, an **isolation** assertion (only `.web-*`/`.sanad-web` classes are
emitted — no admin token leaks), and the token-drift guard.
