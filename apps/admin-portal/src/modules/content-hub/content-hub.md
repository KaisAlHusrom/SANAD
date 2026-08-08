# content-hub (admin module)

The landing page for content management at **`/content`** (`content.read`) — a card grid routing
to each content-management domain. The nav/IA decision for P7.C: keep a **single** `nav.content`
sidebar entry (design-spec §4) and route to domains from this hub, so the sidebar stays clean as
content scales to 9+ domains.

## Surface

- `ContentHubPage` — maps `CONTENT_AREAS` (`constants/content-areas.ts`) to cards, each a router
  `Link` to its domain page. Only **built** areas are listed; later P7.C stages append
  portfolio/blog/pages/menus (no dead links). Tokens-only, RTL-correct.

## i18n

Namespace `contentHub` — `title`/`subtitle` + a `areas.<key>.{title,desc}` entry per area.

## Permissions

`content.read` gates the `/content` route (and every domain route); the hub itself shows all
built areas to anyone who can reach it.
