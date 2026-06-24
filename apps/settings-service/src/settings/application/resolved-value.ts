import type { LocalizedText } from '@sanad/contracts';
import type { SettingScalar } from '../../db/schema/index.js';

/**
 * A fully-resolved setting value: a scalar (text/number/boolean/color/url/image/
 * select), a `localized_text` map, or `null` (an explicitly-unset url/contact leaf).
 * Never `undefined` — absence is modelled by the key being missing from a result map.
 */
export type ResolvedValue = SettingScalar | LocalizedText | null;

/** Narrow a resolved value to a `localized_text` map. */
export function isLocalizedText(value: ResolvedValue): value is LocalizedText {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ar' in value &&
    'en' in value
  );
}
