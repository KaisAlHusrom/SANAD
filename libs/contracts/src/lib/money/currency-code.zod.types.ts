import { z } from 'zod';

/**
 * The currencies the platform can price in (ISO 4217). Closed rather than a free string: the
 * admin picks one from a `select` descriptor (P8.9) and every amount is stored in that
 * currency's MINOR units, so a code whose exponent nobody knows would be a silent 100× error.
 * The set spans all three exponents on purpose — 0 (JPY), 2 (most), 3 (KWD/BHD/OMR/JOD).
 */
export const CURRENCY_CODES = [
  'SAR',
  'AED',
  'QAR',
  'KWD',
  'BHD',
  'OMR',
  'JOD',
  'USD',
  'EUR',
  'GBP',
  'TRY',
  'EGP',
  'SYP',
  'JPY',
] as const;

export const currencyCodeSchema = z.enum(CURRENCY_CODES);

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

/**
 * The coded default (U9). P8.9 turns the active currency into a setting resolving
 * override → global → this; no render site may hardcode a currency of its own.
 */
export const DEFAULT_CURRENCY: CurrencyCode = 'SAR';
