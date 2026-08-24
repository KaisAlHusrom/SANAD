import { z } from 'zod';

/**
 * The consent categories a visitor decides on. Deliberately code-shaped rather than
 * admin-configurable: making the SET a setting multiplies the state machine the banner must
 * prove without buying an operator anything they would ever actually change.
 */
export const consentCategorySchema = z.enum([
  'necessary',
  'analytics',
  'marketing',
]);

export type ConsentCategory = z.infer<typeof consentCategorySchema>;

/** A category the visitor can actually decide — `necessary` is not one of them. */
export type TogglableConsentCategory = Exclude<ConsentCategory, 'necessary'>;

/** Every category, in banner display order. */
export const CONSENT_CATEGORIES: readonly ConsentCategory[] = [
  'necessary',
  'analytics',
  'marketing',
];

/**
 * `necessary` is always granted and is shown, never toggled — rendering it as a switch would
 * promise a choice the product cannot honour.
 */
export const TOGGLABLE_CONSENT_CATEGORIES: readonly TogglableConsentCategory[] =
  ['analytics', 'marketing'];
