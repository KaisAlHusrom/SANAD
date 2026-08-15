# Sanad Tech — Design reference (imported from Claude Design)

These files are the **canonical visual reference** for the Sanad Tech website (P8) and the
admin + client portals (P7). They were produced in **Claude Design** and imported here so the
build has one fixed, authoritative source of truth for tokens, layout, and the signature
interaction — instead of inventing values at build time (U6 / WEB9 / WEB10).

> ⚠️ **Read this before using anything here.**
>
> - **Tokens, layout, spacing, the signature scene, RTL handling → authoritative.** Build P7/P8 to match.
> - **The copy in the designs is PLACEHOLDER.** Do **not** treat the design's Arabic/English strings
>   as the product's default content. The real default copy is authored in
>   [`content-defaults.md`](./content-defaults.md) and is what seeds the settings/content services
>   (U9 coded defaults). Final content is admin-editable from the CMS.
> - **The final logo is delivered** and lives in [`logo/`](./logo/) (the cyan `سَنَد التقنية`
>   wordmark — cyan matches the locked accent `#22d3ee`). This **supersedes** the discarded
>   generated mark and the [`logo-prompt.md`](./logo-prompt.md) placeholder workflow. Variants:
>   `sanad-logo-primary.png` · `sanad-logo-white-on-black.png` · `sanad-logo-black-on-white.png` ·
>   `sanad-logo-transparent.png` · `sanad-logo-geometric.png`. The dark/light runtime copies live in
>   `apps/admin-portal/public/brand/` (the portal's coded-default logo; settings `branding.logoUrl`
>   still wins at runtime, U9/WEB1).

## What's here

| File                                           | Purpose                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`design-spec.md`](./design-spec.md)           | The locked token system + shell + signature spec. **Build against this.**               |
| [`content-defaults.md`](./content-defaults.md) | Professional bilingual (ar-first / en) **default** copy that replaces the placeholders. |
| [`logo/`](./logo/)                             | **The delivered final logo** (سَنَد التقنية wordmark) — 5 variants. **Use these.**      |
| [`logo-prompt.md`](./logo-prompt.md)           | _(superseded)_ the ideogram.ai prompt used before the final mark was delivered.         |
| `source/Sanad Landing.dc.html`                 | Archived raw design (landing).                                                          |
| `source/Sanad Admin.dc.html`                   | Archived raw design (admin portal).                                                     |

## Re-pulling any source on demand (canonical store)

The permanent source of truth is the Claude Design project. Any of the six surfaces can be re-pulled
via the `claude_design` MCP (`DesignSync` → `get_file`) — re-run `/design-login` first if auth lapsed.

- **Project:** `Support thread identity system`
- **projectId:** `c71e9e18-fec7-4ed0-a30d-553c3d3eca3e`
- **Files:** `Sanad Landing.dc.html`, `Sanad About.dc.html`, `Sanad Services.dc.html`,
  `Sanad Service Detail.dc.html`, `Sanad Admin.dc.html`, `Sanad Client.dc.html`
  (`Sanad Logo.dc.html` is intentionally **excluded** — discarded.)
- Shared runtime in the project: `cosmos.js` (the signature WebGL scene), `support.js` (the Design
  Component runtime — **not** part of our build; we re-implement the scene per the spec).

> Only `Landing` + `Admin` are mirrored locally (they're the most complex references). The other four
> returned inline during import and were not auto-persisted; pull them with `get_file` when needed —
> their full structure and copy are already distilled into `design-spec.md` + `content-defaults.md`.

## How the designs map to the build

| Design file                    | Surface                       | Phase            |
| ------------------------------ | ----------------------------- | ---------------- |
| `Sanad Landing.dc.html`        | Website landing               | P8               |
| `Sanad About.dc.html`          | Website /about                | P8               |
| `Sanad Services.dc.html`       | Website /services             | P8               |
| `Sanad Service Detail.dc.html` | Website /services/[slug]      | P8               |
| `Sanad Admin.dc.html`          | Admin portal shell + screens  | P7               |
| `Sanad Client.dc.html`         | Client portal shell + screens | later (post-MVP) |

The token foundation extracted here is seeded into `libs/shared/config` (Tailwind preset + token CSS)
during **P0**, so every later surface resolves real brand tokens from day one.
