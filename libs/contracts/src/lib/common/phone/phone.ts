import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import { z } from 'zod';

/** An ISO-3166-1 alpha-2 country, as libphonenumber's metadata knows it. */
export type PhoneCountry = CountryCode;

/**
 * The country a phone field starts on, and the only country a national number may be read
 * as. Saudi Arabia — the audience both website forms are built for. When P8.9's Legal Entity
 * Profile lands, that is the natural place for this to become a resolved setting (U9).
 */
export const DEFAULT_PHONE_COUNTRY: PhoneCountry = 'SA';

/**
 * The catalog key a rejected number carries as its Zod message. `ZodValidationPipe` prefers an
 * author-written message when the catalog can render it, so the gateway returns this in the
 * caller's locale with no per-field plumbing (U24).
 */
export const PHONE_INVALID_MESSAGE_KEY = 'validation.invalidPhone';

/** A validated number, split the way a dial-code picker needs to render it. */
export interface ParsedPhone {
  /** The canonical stored form, e.g. `+966501234567`. */
  e164: string;
  country: PhoneCountry | undefined;
  callingCode: string;
  nationalNumber: string;
}

/**
 * Validate a phone number **against its own country's rules** (not just its shape) and return
 * it split for display, or `null` if it is not a real number.
 *
 * `defaultCountry` is what makes a national number (`0501234567`) readable; omit it and only
 * an international number is accepted. {@link phoneSchema} deliberately omits it, so the server
 * never guesses a country a caller did not state.
 */
export function parsePhone(
  value: string,
  defaultCountry?: PhoneCountry,
): ParsedPhone | null {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  // `00` is the international prefix written out; libphonenumber only reads a leading `+`.
  const candidate = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;
  const parsed = parsePhoneNumberFromString(
    candidate,
    candidate.startsWith('+') ? undefined : defaultCountry,
  );
  if (!parsed?.isValid()) {
    return null;
  }
  return {
    e164: parsed.number,
    country: parsed.country,
    callingCode: parsed.countryCallingCode,
    nationalNumber: parsed.nationalNumber,
  };
}

/**
 * A required phone number, stored normalized as E.164. Used by BOTH website forms and by the
 * gateway that re-validates them (N7), so a number the form accepts is exactly a number the
 * API accepts (U3).
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => parsePhone(value)?.e164 ?? null)
  .refine((value): value is string => value !== null, {
    message: PHONE_INVALID_MESSAGE_KEY,
  });

/**
 * The one place a stored number is turned into readable text (F8) — the admin inbox cell and
 * the team alert email both call it. An unparseable stored value renders as itself rather than
 * disappearing (U23).
 */
export function formatPhoneInternational(value: string): string {
  return parsePhoneNumberFromString(value)?.formatInternational() ?? value;
}
