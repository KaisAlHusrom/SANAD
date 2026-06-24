/**
 * A non-translatable setting value as stored in `setting_value.value` (jsonb).
 * `localized_text` settings store NULL here (their text lives in `setting_translation`).
 */
export type SettingScalar = string | number | boolean;
