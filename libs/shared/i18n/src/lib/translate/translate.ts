import {
  DEFAULT_LOCALE,
  type Locale,
  type LocalizedMessage,
  type MessageParams,
} from '@sanad/contracts';
import { CATALOGS } from '../catalog/catalogs.js';
import type { MessageKey } from '../catalog/ar.catalog.js';

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(text: string, params: MessageParams | undefined): string {
  if (!params) {
    // No params supplied: strip placeholders rather than leaking `{id}` to the user.
    return text.replace(PLACEHOLDER, '');
  }
  return text.replace(PLACEHOLDER, (_match, name: string) => {
    const value = params[name];
    return value === undefined ? '' : String(value);
  });
}

/**
 * Whether a string is a KEY the catalog can actually render — as opposed to prose (framework
 * English, a vendor sentence, a typo'd key). Callers use it to decide whether a value is safe to
 * put in front of a user: anything this rejects would render verbatim and leak English (U24).
 */
export function hasMessage(value: string): boolean {
  // `hasOwn`, not `in`: `in` walks the prototype chain, so `'constructor'`/`'toString'` would
  // report as renderable keys and then blow up in `interpolate` on a function value.
  return Object.hasOwn(CATALOGS[DEFAULT_LOCALE], value);
}

/**
 * Render a message key into `locale` (U24). This is the ONLY place backend text is produced:
 * the gateway edge calls it for the envelope + errors, and a service calls it directly for
 * text that lives inside a payload (an integration test result, an email body).
 *
 * An **unknown key is returned unchanged**, deliberately — a legacy literal that has not been
 * migrated yet degrades to today's English prose instead of showing the user a raw key.
 */
export function translate(
  key: MessageKey | string,
  locale: Locale,
  params?: MessageParams,
): string {
  const catalog = CATALOGS[locale] ?? CATALOGS[DEFAULT_LOCALE];
  const text = Object.hasOwn(catalog, key)
    ? catalog[key]
    : CATALOGS[DEFAULT_LOCALE][key];
  return typeof text === 'string' ? interpolate(text, params) : key;
}

/** Render a `{ messageKey, params }` pair — the shape that crosses the boundaries (U3). */
export function translateMessage(
  message: LocalizedMessage,
  locale: Locale,
): string {
  return translate(message.messageKey, locale, message.params);
}
