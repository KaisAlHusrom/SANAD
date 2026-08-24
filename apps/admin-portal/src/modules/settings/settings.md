# settings module (admin-portal)

The **descriptor-driven settings page** — a generic editor over the settings-service catalog: **group = sidebar rail tab, section = sub-tab, field = a typed control**. Fully catalog-driven, so future setting groups appear with no UI change. Replaced the bespoke branding form (2026-06-27). Lives at `/settings` (`settings.read` to view; Save gated by `settings.manage` at the gateway).

The module also owns one **purpose-built** screen that deliberately does not go through the generic editor — **Tracking & consent** at `/settings/tracking` (see below). It lives here rather than in a module of its own because it writes through the very same `settingsApi`; a separate module would have needed a duplicate api slice against the same two generic endpoints (W5 vs U3).

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

## The `security` group (P8.10.A)

The first group added after `branding`, and it required **no code in this module** — only labels in
`i18n/{ar,en}.json` (`group.security`, `section.security.rateLimit`, `field.security.rateLimit.*`).
That is the descriptor-driven design paying off: `SettingFieldControl` already had a `boolean →
Switch` and `number → Input` branch, so a Switch plus six numeric inputs appeared from the catalog
alone.

It renders the gateway's edge **rate limits** — live-tunable, which is the point: a limit can be
tightened during an ad campaign and the gateway picks it up within ~60 s with no redeploy. See
`apps/api-gateway/src/security/security.md`.

⚠️ `lib/section-layout.ts` still branches on the literal section id `'colors'`. Naming this section
`rateLimit` sidesteps it, but the coupling is a latent trap for the **next** group — it should be
keyed on `group + section`.

## Tracking & consent (P8.23.A1)

The third settings group, `tracking`, and the first one that is **excluded from the generic page**
(`settings-page.tsx` filters `TRACKING_GROUP` out). Rendering it both generically and bespoke would
put two differently-shaped editors on the same keys, and an operator would have no way to know which
one is real.

Why it earns a bespoke screen (U0): a destination's real question is not "what is the value of
`tracking.destinations.ga4.id`" but **"is this actually working?"** — and only a status chip answers
it. A plain switch makes _on with no id_, _on with the wrong id_, and _on and working_ look
identical, and the first two cost real ad money silently, for months.

What the screen adds over a grid of controls:

- **A status chip per destination** — `Off` / `No ID yet` / `ID looks wrong` / `Live`, derived from
  the **live form values**, so it answers for what the operator is looking at, not the last save.
- **Inline format validation** against the destination's own pattern, with the expected shape shown
  as a hint and the id field pinned `dir="ltr"` (a vendor id reads left-to-right in both locales).
- **An ambiguity warning** — Meta and TikTok id shapes genuinely overlap, so a value that also
  matches another destination's shape is flagged rather than silently accepted.
- **The two caveats that would otherwise be folklore**: tags configured _inside_ a GTM container are
  loaded by GTM, not by this platform (we can only set Consent Mode); and GA4 + GTM both on
  double-counts every session.
- **The consent policy** in the same form: banner on/off (with an explicit note that "off" means
  nobody is asked, so nothing is granted and every destination stays dormant — not "track quietly"),
  remember-days, and the two policy links with a **live preview of where they will actually open**,
  locale segment included, plus a warning while they are unset.
- **"Ask everyone again"** is an action behind a confirmation, not a number field: it re-asks every
  visitor on their next page view. It is **disabled while the form is dirty**, because bumping
  refetches and re-baselines the form, which would discard whatever was being typed.
- **One page-level Save** — an operator adding a destination touches the switch, the id and often
  the policy in one sitting. `handleSubmit` carries an `onInvalid` that raises a toast + root error,
  so a blocked submit is never a silent no-op (U22).

## Files

- `api/settings.api.ts` — RTK Query api (`reducerPath: 'settingsApi'`). `getSettings` (`GET /settings` → `SettingsCatalog`), `updateSettings` (`PUT /settings`, batch `{ values: [{key,value}] }` → refreshed `SettingsCatalog`). The `Settings` tag refetch re-baselines every section form; the mutation publishes `settings.updated` (W4).
- `lib/setting-form.ts` — pure helpers: `fieldId` (dotted key → RHF-safe id), `toSectionFormValues` (resolved values → RHF shape by type), `toChangedWrites` (diff form vs resolved → only-changed `SettingWrite[]`; `'' → null` clears a nullable leaf; localized sent whole if either locale changed).
- `lib/section-layout.ts` — `sectionGroups`: splits a section into render groups; the `colors` section is sub-grouped (brand colors "base" group up front; the page-accents / surfaces / text advanced groups exist but are now empty — those keys are website-scoped and filtered out of the catalog — so only the base group renders).
- `hooks/use-settings-section-form.ts` — per-section RHF; prefills via `values` (not dirty, F6); Save sends only changed keys via `updateSettings` + toasts; Reset reverts to resolved.
- `components/setting-field-control.tsx` — renders one field by descriptor `type` (color→ColorInput, boolean→Switch, select→SelectField, image→MediaPickerField (W5), localized_text→per-locale Inputs under LocaleTabs (W6), else Input). Label from i18n keyed by the setting key.
- `components/setting-section-form.tsx` — a section as an editor card (fields grid + the advanced colors `<details>`) with a fixed Save/Reset `border-t` footer (the design's editor panel). Save/Reset gated by `isDirty`.
- `lib/tracking-view/` — pure derivations for the tracking screen: `destinationStatus`,
  `toDestinationViews` (registry × live form values), `isDoubleCounting`, `policyLinkPreview`.
- `hooks/use-tracking-settings/` — one RHF form over BOTH tracking sections, diffed through the same
  `toChangedWrites` (F9); exposes the destination views, the double-count flag, the resolved
  `branding.seo.siteUrl` for the link preview, and `bumpPolicyVersion`.
- `components/tracking-page/` — the screen: RenderGate (skeleton / error+retry / "group not
  available") + the two cards + a sticky Save/Reset bar with an unsaved-changes marker.
- `components/consent-policy-card/`, `components/destination-card/` — the two cards above.
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
- `lib/tracking-view/tracking-view.spec.ts` — the status/ambiguity/double-count/preview derivations.
- `components/tracking-page/tracking-page.spec.tsx` — the screen end to end against a stubbed
  catalog: every status, the inline rejection that saves **nothing**, only-changed keys on the wire,
  the server's own failure reason surfaced, both warnings, the unset-link warning, the link preview,
  the confirmed version bump, the dirty-blocks-bump rule, and the error + group-absent states.
