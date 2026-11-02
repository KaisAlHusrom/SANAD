import type { Dictionary } from '../../i18n/get-dictionary';

/**
 * The strings the consent surfaces need, taken as a SLICE of the site dictionary rather than
 * redeclared (U3) — the `PhoneFieldCopy` convention. Each surface is handed only its own slice, so
 * a spec can render it without building a whole dictionary, and a renamed key is a compile error
 * here rather than a blank label at runtime.
 */
export type ConsentCopy = Dictionary['consent'];

export type ConsentBarCopy = ConsentCopy['bar'];
export type ConsentDialogCopy = ConsentCopy['dialog'];
export type ConsentCategoriesCopy = ConsentCopy['categories'];
export type ConsentLinksCopy = ConsentCopy['links'];

/** All the footer affordance needs — one label. */
export type ConsentPreferencesCopy = ConsentCopy['preferences'];
