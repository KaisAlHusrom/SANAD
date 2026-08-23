import type { LeadSpamSignalId } from '@sanad/contracts';

/**
 * The detection tuning (P8.10.B3). Coded, not settings-resolved: unlike the B2 dedup window —
 * a campaign policy an operator moves mid-flight — these numbers change together with the code
 * that reads them, and every score they produce is advisory.
 *
 * Calibrated so that no SINGLE weak signal can leave the `clean` band. A real enquiry is
 * routinely short, or contains a link, or shouts a little; only a combination is evidence.
 */

/** Weight per fired signal. Counted signals multiply by their capped count. */
export const SPAM_WEIGHTS: Readonly<Record<LeadSpamSignalId, number>> = {
  keywords: 15,
  links: 12,
  contactLinks: 25,
  foreignScript: 30,
  repeatedChars: 15,
  shortMessage: 15,
  shouting: 10,
};

/** Counted signals stop accumulating here — ten links are not ten times one link. */
export const SPAM_COUNT_CAP = 3;

/** A link is normal; a list of them is an advert. */
export const LINKS_MIN_COUNT = 2;

/** Under this many characters a message cannot state a real requirement. */
export const SHORT_MESSAGE_MAX_CHARS = 25;

/** Below this many letters a caps ratio means nothing — "ERP CRM POS" is not shouting. */
export const SHOUTING_MIN_LETTERS = 20;
export const SHOUTING_CAPS_RATIO = 0.7;
/** `!!!!` — four in a row, so an ordinary emphatic `!!` passes. */
export const SHOUTING_RUN_MIN = 4;

/** Six of the same letter in a row: "حيااااااك", "sooooooo". */
export const REPEATED_CHARS_RUN_MIN = 6;

/**
 * A message is "foreign" only when the scripts this site actually serves are a minority of its
 * letters. Arabic and Latin are BOTH expected — the site is Arabic-first with an English locale,
 * and Arabic enquiries routinely carry Latin brand names.
 */
export const EXPECTED_SCRIPT_MIN_RATIO = 0.5;

/** URLs, bare domains and `www.` hosts — enough to catch an advert, loose enough to stay pure. */
export const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s<>()[\]]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|info|biz|ru|cn|xyz|top|club|online|site|shop)\b/giu;

/**
 * The spam-phrase list — the ONE curated dataset here, kept deliberately tiny and bilingual.
 *
 * Two admission rules, both learned the expensive way:
 *
 * 1. **Every entry is an offer being made TO us**, never an industry a client might work in.
 *    A bare `crypto` / `forex` / `تداول` flags the Gulf fintech client who wants us to BUILD a
 *    trading app — two such nouns in one enquiry stack to `suspicious` for no reason at all.
 *    So the selling shape is in the phrase itself (`forex signal`, `إشارات التداول`).
 * 2. **No entry may contain another** (`lead-spam.scorer.spec.ts` enforces it). `'seo service'` and
 *    `'seo services'` both used to sit here, and a single "SEO services" matched BOTH — scoring
 *    30 instead of 15 and telling the team it had seen two phrases when it had seen one. An
 *    ordinary "a new website plus ongoing SEO services" is exactly our inbound, and it was
 *    landing in `suspicious`. Plurals are handled by the matcher, not by a second entry.
 */
export const SPAM_PHRASES: readonly string[] = [
  // — English —
  'seo service',
  'search engine optimization',
  'backlink',
  'back link',
  'guest post',
  'link building',
  'domain authority',
  'increase your traffic',
  'first page of google',
  'rank #1',
  'make money online',
  'work from home',
  'guaranteed profit',
  'guaranteed return',
  'crypto investment',
  'forex signal',
  'payday loan',
  'casino',
  'viagra',
  // — Arabic —
  'تحسين محركات البحث',
  'باك لينك',
  'باكلينك',
  'خدمات سيو',
  'أرباح مضمونة',
  'ربح المال',
  'استثمار العملات الرقمية',
  'إشارات التداول',
  'قرض سريع',
  'كازينو',
];
