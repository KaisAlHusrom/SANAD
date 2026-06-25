# settings module (admin-portal)

The branding / visual-identity editor — the admin controls the site's logo, colors, fonts, and links, all DB-driven (P3 surface). Built in P7.B. Lives at `/settings` (`settings.manage`).

## Files

- `api/settings.api.ts` — RTK Query api (`reducerPath: 'settingsApi'`). `getBranding` (`GET /branding` → resolved `BrandingRecord`), `updateBranding` (`PUT /branding`, deep-partial → `BrandingRecord`). The `Branding` tag refetch re-baselines the form; the mutation publishes `settings.branding.updated` (W4).
- `validation/branding-form.zod.types.ts` — the **form** values schema (`brandingFormSchema`/`BrandingFormValues`, U16) — distinct from the response/request contracts. Nullable leaves are `''`; messages are i18n keys (F6); the hex pattern is shared with `ColorInput` (U3).
- `lib/to-form-values.ts` — maps the resolved `BrandingRecord` → form values (null → `''`); fed to RHF as `values` (stable via `useMemo`) so prefill is not dirty (F6/F7).
- `lib/diff-branding.ts` — **the deep-partial diff**: compares the record against current values and emits ONLY changed leaves; each `LocalizedText` is whole-object; nullable leaves map `'' → null`; an unchanged form → `{}` (no-op).
- `hooks/use-branding-form.ts` — RHF + zodResolver; on submit builds the diff, validates it against `brandingUpdateRequestSchema` (U16), and PUTs (empty diff → no-op).
- `components/` — `branding-page.tsx` (`RenderGate(getBranding)`), `branding-form.tsx` (FormProvider + sections + Save gated by `isDirty`), and the sections: `identity` (logo/favicon via `MediaPickerField`, brand text in `LocaleTabs`, W6), `colors` (primary/secondary + an "Advanced color system" `<details>` driving the 20 deeper tokens via `ColorField`), `typography`, `social`, `contact` (email/phone + per-locale address). `branding-field.tsx`/`color-field.tsx` are the shared row wrappers.
- `constants/branding-color-groups.ts` — the typed advanced-color field map (paths checked against the form shape).
- `i18n/{ar,en}.json` — the `settings` catalog (parity, U8); registered at import.

## Cross-module (W5)

The logo/favicon fields use the shared `MediaPickerField` (`src/components/media-picker/`), which bridges to `mediaLookupApi` — branding never imports the media module's api.

## Contracts

`BrandingRecord`, `BrandingUpdateRequest`/`brandingUpdateRequestSchema`, `PageAccent`, `LocalizedText` — all from `@sanad/contracts` (U3).

## Events

Publishes `settings.branding.updated` on the client event bus after a successful update (W4).

## Tests

- `lib/diff-branding.spec.ts` — the heaviest unit: no-change → `{}`, single-leaf only, LocalizedText whole-object, clear → null, deep nested accent, schema-valid multi-section diff.
- `api/settings.api.spec.ts` — GET/PUT + the update event.
- `hooks/use-branding-form.spec.tsx` — prefill not dirty, single-leaf PUT, empty-diff no-op, invalid hex blocks submit.
- `components/branding-page.spec.tsx` — RenderGate (editor renders, error state).
