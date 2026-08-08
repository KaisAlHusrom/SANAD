# settings module (admin-portal)

The **descriptor-driven settings page** — a generic editor over the settings-service catalog: **group = sidebar rail tab, section = sub-tab, field = a typed control**. Fully catalog-driven, so future setting groups appear with no UI change. Replaced the bespoke branding form (2026-06-27). Lives at `/settings` (`settings.read` to view; Save gated by `settings.manage` at the gateway).

**Every field on this page takes real effect** (the settings-service filters the catalog to `EDITABLE_SETTING_KEYS`), across two audiences:

| Section                                                               | Drives                                                                                    |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Identity** (`brand.name`, `brand.tagline`, `logoUrl`, `faviconUrl`) | Portal shell chrome (sidebar/login logo, tab title) **+** website footer/meta             |
| **Colors** (`colors.primary`, `colors.secondary`)                     | The **portal** accent, applied live on Save                                               |
| **Contact** (`contact.email/phone/address`)                           | Website footers (chrome + landing finale) + Organization JSON-LD                          |
| **Social** (5 links)                                                  | Website footer social row + JSON-LD `sameAs` + the derived `twitter:site` handle          |
| **Legal** (`legal.copyright`)                                         | The copyright line in **both** footers (composed as `© {brand.name} — {copyright}`)       |
| **SEO** (`seo.siteUrl`, `seo.shareImageUrl`)                          | `metadataBase`/canonical, OpenGraph + Twitter cards, `sitemap.xml`, `robots.txt`, JSON-LD |

**Deliberately NOT exposed** (they would be dead controls): `colors.pageAccents.*` (per-page website color lives in the **CMS pages settings**), `colors.surface.*`/`colors.text.*` (the website's fixed art direction), `fonts.*` (a font can't be swapped by name at runtime without shipping its files), `brand.shortDesc` (nothing renders it). They stay in the `BrandingRecord` so the website's `GET /branding` is unchanged. **Per-page SEO title/description stays in the pages builder** — these are the site-wide defaults. The live portal theming lives in `providers/branding/` (see below) — this module just edits the values.

## Files

- `api/settings.api.ts` — RTK Query api (`reducerPath: 'settingsApi'`). `getSettings` (`GET /settings` → `SettingsCatalog`), `updateSettings` (`PUT /settings`, batch `{ values: [{key,value}] }` → refreshed `SettingsCatalog`). The `Settings` tag refetch re-baselines every section form; the mutation publishes `settings.updated` (W4).
- `lib/setting-form.ts` — pure helpers: `fieldId` (dotted key → RHF-safe id), `toSectionFormValues` (resolved values → RHF shape by type), `toChangedWrites` (diff form vs resolved → only-changed `SettingWrite[]`; `'' → null` clears a nullable leaf; localized sent whole if either locale changed).
- `lib/section-layout.ts` — `sectionGroups`: splits a section into render groups; the `colors` section is sub-grouped (brand colors "base" group up front; the page-accents / surfaces / text advanced groups exist but are now empty — those keys are website-scoped and filtered out of the catalog — so only the base group renders).
- `hooks/use-settings-section-form.ts` — per-section RHF; prefills via `values` (not dirty, F6); Save sends only changed keys via `updateSettings` + toasts; Reset reverts to resolved.
- `components/setting-field-control.tsx` — renders one field by descriptor `type` (color→ColorInput, boolean→Switch, select→SelectField, image→MediaPickerField (W5), localized_text→per-locale Inputs under LocaleTabs (W6), else Input). Label from i18n keyed by the setting key.
- `components/setting-section-form.tsx` — a section as an editor card (fields grid + the advanced colors `<details>`) with a fixed Save/Reset `border-t` footer (the design's editor panel). Save/Reset gated by `isDirty`.
- `components/settings-page.tsx` — fetches the catalog (RenderGate, F2); a vertical **group rail** + the active group's horizontal **section sub-tabs** (Radix `Tabs`) → `SettingSectionForm` per section. Tokens-only, RTL.
- `i18n/{ar,en}.json` — the `settings` catalog (parity, U8): a nested `field.<key>` label tree + `group.<g>` / `section.<g>.<s>` / `colorGroups.*` + `title`/`subtitle`/`actions`/`errors`. Registered at import.

## Cross-module (W5)

Image fields (logo/favicon) use the shared `MediaPickerField` (`src/components/media-picker/`), which bridges to `mediaLookupApi` — settings never imports the media module's api.

## Contracts

`SettingsCatalog`/`SettingGroup`/`SettingSection`/`SettingField`, `SettingsUpdateRequest`/`settingsUpdateRequestSchema`, `SettingWrite`, `SettingValue`, `SettingType`, `LocalizedText` — all from `@sanad/contracts` (U3). The website + public `GET /api/branding` use `BrandingRecord`; the **admin now also reads `BrandingRecord`** (public `GET /branding`) to theme itself — see `providers/branding/`.

## Events

Publishes `settings.updated` on the client event bus after a successful update (W4). The **branding theme provider** (`providers/branding/use-branding-theme.ts`) subscribes to it and invalidates the `Branding` tag, so a Save re-skins the running portal instantly — the accent (`portal-brand-css.ts` → `--accent`/`--accent-ink`/`--accent-soft`/`--accent-line`/`--accent-2`), favicon, and tab title update with no reload. The sidebar + login logo/name also read the branding query. This is what makes the Visual Identity settings actually _take effect_ (they previously stored-but-did-nothing on the portal).

## Tests

- `lib/setting-form.spec.ts` — the diff core: project by type, null→'', no-change → no writes, only-changed keys, clear → null, localized whole-object.
- `components/settings-page.spec.tsx` — renders the rail + section sub-tabs + typed fields from a catalog; per-section Save PUTs only the changed key.
