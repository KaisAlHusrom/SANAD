import { DEFAULT_LOCALE, LOCALES } from '@sanad/contracts';
import { z } from 'zod';

/**
 * The adapter between the content contracts' `LocalizedText` ({ar,en}) shape and the
 * DynamicForm's per-locale form shape. The kit binds translatable fields to
 * `translations.<locale>.<field>` (see `build-default-values.ts` + `dynamic-form.tsx`),
 * but the API entities carry each translatable field at the top level as `{ar,en}`. These
 * pure helpers pivot both directions so every translatable content vertical reuses them
 * (U17) instead of hand-rolling the conversion. Pure → unit-tested.
 */

type LocaleMap = Record<string, Record<string, unknown>>;

/**
 * Build the per-locale shape for a translatable field group. The DynamicForm's
 * `translations` value is `{ ar: {<key>: string}, en: {<key>: string} }`. `required` keys
 * must be non-empty in the **default locale** (ar) — content always has its primary script;
 * the secondary locale falls back via `pickLocalized`, so it (and `optional` keys) may be
 * empty. Avoids blocking a save on incomplete English (Arabic-first, U7/U8).
 */
export function localizedFormSchema(config: {
  required?: readonly string[];
  optional?: readonly string[];
}): z.ZodObject<z.ZodRawShape> {
  const localeShape = (locale: (typeof LOCALES)[number]): z.ZodRawShape => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const key of config.required ?? []) {
      shape[key] =
        locale === DEFAULT_LOCALE
          ? z.string().trim().min(1)
          : z.string().trim();
    }
    for (const key of config.optional ?? []) {
      // Optional keys must tolerate `undefined`: a form seeds `translations.<locale>.<key>`
      // only for the fields it actually renders (build-default-values.ts), so a key the kind
      // never renders is absent. A bare `z.string()` would reject the missing key and make
      // `handleSubmit` abort silently — the block-save no-op bug (2026-07-10).
      shape[key] = z.string().trim().optional();
    }
    return shape;
  };
  return z.object(
    Object.fromEntries(
      LOCALES.map((locale) => [locale, z.object(localeShape(locale))]),
    ),
  );
}

/**
 * The phantom top-level entries a form schema needs for each translatable field: the kit
 * types a translatable `FieldConfig.name` as a `Path<TValues>` (the bare key), so the key
 * must exist on the values type even though the real data lives under `translations`. They
 * are optional (never populated at runtime) — spread into the form schema's object shape.
 */
export function phantomTranslatableKeys<K extends string>(
  keys: readonly K[],
): Record<K, z.ZodOptional<z.ZodString>> {
  // The literal key union K must survive into the schema shape so each `<key>` becomes a
  // real `Path<TValues>` (Object.fromEntries widens to string, hence the cast).
  return Object.fromEntries(
    keys.map((key) => [key, z.string().optional()]),
  ) as Record<K, z.ZodOptional<z.ZodString>>;
}

/**
 * Pivot an API entity into the DynamicForm edit-prefill record: each translatable field's
 * `{ar,en}` is flattened into a `translations` map the LocaleTabs bind to (missing locales
 * default to `''`). Non-translatable fields pass through (null leaves become `''` via
 * `buildDefaultValues`). Used as the `record` prop on edit.
 */
export function toLocalizedFormRecord(
  entity: object,
  translatableKeys: readonly string[],
): Record<string, unknown> {
  const source = entity as Record<string, unknown>;
  const translations: {
    ar: Record<string, unknown>;
    en: Record<string, unknown>;
  } = { ar: {}, en: {} };
  for (const key of translatableKeys) {
    const value = source[key] as { ar?: string; en?: string } | undefined;
    translations.ar[key] = value?.ar ?? '';
    translations.en[key] = value?.en ?? '';
  }
  return { ...source, translations };
}

/**
 * Pivot validated form values back into a contract upsert body: each translatable field's
 * `translations.<locale>.<key>` collapses to a top-level `{ar,en}`, and `nullableKeys`
 * whose form value is `''`/`undefined` become `null` (a cleared optional). The `translations`
 * map itself is dropped. Used inside the form's `submit`.
 */
export function toLocalizedUpsertBody<TBody>(
  values: Record<string, unknown>,
  options: {
    translatableKeys: readonly string[];
    nullableKeys?: readonly string[];
  },
): TBody {
  const { translations, ...rest } = values as {
    translations?: LocaleMap;
  } & Record<string, unknown>;
  const body: Record<string, unknown> = { ...rest };
  const map = translations ?? {};
  for (const key of options.translatableKeys) {
    body[key] = {
      ar: (map.ar?.[key] as string | undefined) ?? '',
      en: (map.en?.[key] as string | undefined) ?? '',
    };
  }
  for (const key of options.nullableKeys ?? []) {
    if (body[key] === '' || body[key] === undefined) {
      body[key] = null;
    }
  }
  return body as TBody;
}
