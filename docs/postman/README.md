# Sanad Tech — Postman collection

The **single, fully-documented map of every gateway endpoint** (DOC2). A frontend dev should integrate against this without reading backend code. Kept in sync with the code: every endpoint added or changed updates the collection **in the same change**.

## Files

| File                             | What                                                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sanad.postman_collection.json`  | The collection — folders per domain, every request documented (purpose, auth, params/body, returns), with token-capture test scripts. Postman schema v2.1. |
| `sanad.postman_environment.json` | Dev environment (`baseUrl` = `http://localhost:8190/api` — the stack through nginx).                                                                       |

## Use

1. Import both files into Postman (or `newman run`).
2. Select the **Sanad Tech — Dev** environment.
3. Run **Auth → Login** first — it captures `{{accessToken}}` / `{{refreshToken}}` / `{{userId}}` into collection variables. The collection sends `Authorization: Bearer {{accessToken}}` by default; public routes (Health, Login/Refresh/Logout, Get branding) override to no-auth.
4. Run any other request. Dev seed admin: `admin@sanad.tech` / `change-me-admin`.

## Conventions

- **Envelope (N9):** read the payload from `data` in `{ success, message, data, path, timestamp }`.
- **Auth:** RS256 bearer; authorization enforced at the gateway edge against the token's `permissions` claim (`<resource>.<action>`, `manage` wildcard).
- **Locales:** translatable values are `{ ar, en }` (Arabic default).
- **Validation:** bodies are `.strict()` — unknown fields → 400.

## Keeping it current (DOC2)

When you **add or change** a gateway route, in the **same change**:

- add/update its request under the right folder, with a markdown `description` (purpose, auth + required permission, query/body shape, returns);
- if the route returns tokens/ids a later request needs, add a `test` script that captures them into a collection variable;
- if it's a new domain, add a folder with a `description`;
- keep request/response shapes aligned with `libs/contracts` (U3/U15 — verify, don't invent).

A PR that adds/modifies an endpoint without updating this collection fails review.

## Current coverage

P1–P4 gateway surface: **Health** (`GET /health`), **Auth** (`POST /auth/{login,refresh,logout}`, `GET /auth/me`), **Identity** (`GET /identity/users`), **Branding** (`GET /branding`, `PUT /branding`), **Media** (`POST /media/uploads`, `POST /media/uploads/:id/confirm`, `GET /media`, `GET /media/:id`, `DELETE /media/:id`, `POST /media/folders`, `GET /media/folders`).

P5 content surface (public reads + `content.read`/`content.manage` guarded writes): **Content** (page tree + sections/blocks + services), **Testimonials**, **Team**, **Portfolio** (categories + projects), **Blog** (categories + tags + posts — posts embed category/author/tags, take `tagIds` M2M on write, drafts hidden on the public path), **FAQs**, **Menus** (keyed nav trees), **Leads** (public `POST /leads` + guarded inbox). Every orderable content collection now exposes a `content.manage`-guarded `PATCH /content/<resource>/reorder` (`{ ids }` → atomic drag-and-drop `sortOrder` renumber), and blog adds an admin `GET /content/blog/manage/:id` (`content.read`, drafts visible — feeds the post editor).

P6 surface: **Integrations** (`GET /integrations` — `settings.integrations.read`, masked: secrets only as `last4`; `PUT /integrations/:capability/:provider` to configure, `PUT /integrations/:capability/active` to choose the active provider, `POST /integrations/:capability/:provider/test` for a real round-trip — each gated by `settings.integrations.<capability>.manage`, N13) and **Notifications** (`GET /notifications`, `PATCH /notifications/:id/read` — `notification.read`; the caller's own in-app notices). A contact submission (`POST /leads`) now triggers the notifications-service to email the team + visitor and create an in-app notice **exactly once** (the `lead.created` consumer).

P8.23.A1 surface: **Settings** (`GET /settings` — `settings.read`; `PUT /settings` — `settings.manage`) — the descriptor-driven catalog every admin settings screen writes through. It served `branding` and `security` long before this phase but had never been documented here; it is the only write path for the new `tracking` group. **Tracking** (`GET /tracking-config`) is that group's **public** projection: the consent policy the website's banner obeys plus the destinations it may load — listing only destinations that are both enabled and configured, and degrading to coded defaults (banner on, no destinations) when the settings-service is unreachable.
