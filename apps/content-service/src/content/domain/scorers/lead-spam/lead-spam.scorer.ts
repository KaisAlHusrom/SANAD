import {
  LEAD_SPAM_SCORE_MAX,
  type LeadSpamSignal,
  type LeadSpamSignalId,
} from '@sanad/contracts';
import {
  EXPECTED_SCRIPT_MIN_RATIO,
  LINKS_MIN_COUNT,
  REPEATED_CHARS_RUN_MIN,
  SHORT_MESSAGE_MAX_CHARS,
  SHOUTING_CAPS_RATIO,
  SHOUTING_MIN_LETTERS,
  SHOUTING_RUN_MIN,
  SPAM_COUNT_CAP,
  SPAM_PHRASES,
  SPAM_WEIGHTS,
  URL_PATTERN,
} from './lead-spam.constants.js';

/** The submitted fields a score can be derived from — nothing about the request or the sender. */
export interface ScorableLead {
  name: string;
  company: string | null;
  message: string;
}

export interface LeadSpamAssessment {
  score: number;
  signals: LeadSpamSignal[];
}

const ARABIC_LETTER = /\p{Script=Arabic}/u;
const LATIN_LETTER = /\p{Script=Latin}/u;
const ANY_LETTER = /\p{L}/u;
const UPPERCASE_LATIN = /\p{Lu}/u;

function countUrls(text: string): number {
  // A fresh regex per call: URL_PATTERN is /g, and a shared lastIndex would make this impure.
  return (
    text.match(new RegExp(URL_PATTERN.source, URL_PATTERN.flags))?.length ?? 0
  );
}

/**
 * Phrase matchers, built once. A plain `includes` was the original implementation and it was
 * wrong in both directions:
 *
 * - **End:** `crypto` fired inside `cryptography`, and `سيو` inside `السيولة` (liquidity) — so a
 *   finance enquiry collected a spam signal. Hence a trailing `(?!\p{L})`.
 * - **Start:** `back link` fired inside `feedback link`. Hence a leading guard — but it forbids
 *   only a preceding **Latin** letter or digit, never any letter: Arabic glues its conjunctions
 *   and articles straight onto the word (`وباك لينك`, `الكازينو`), so a strict boundary there
 *   would stop matching Arabic spam almost entirely.
 *
 * The optional `s` is why plurals need no second list entry (and why a second one double-counted).
 *
 * Accepted consequence: the trailing guard also blocks Arabic SUFFIXES, so `كازينوهات` and
 * `باك لينكات` score nothing. That is a miss, not a false alarm — the cheap direction to be wrong
 * in, and the deliberate trade here, where flagging a real enquiry costs far more than missing a bot.
 */
const PHRASE_MATCHERS: readonly RegExp[] = SPAM_PHRASES.map(
  (phrase) =>
    new RegExp(
      `(?<![\\p{Script=Latin}\\p{N}])${phrase.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}s?(?!\\p{L})`,
      'iu',
    ),
);

function countSpamPhrases(text: string): number {
  return PHRASE_MATCHERS.filter((matcher) => matcher.test(text)).length;
}

/**
 * True when the message's letters are mostly from neither script this site serves.
 *
 * Arabic and Latin are BOTH expected — Arabic is the default locale and an Arabic enquiry
 * routinely names a Latin-scripted product. A message with no letters at all (a phone number,
 * digits) is never foreign, which is also what keeps the ratio from dividing by zero.
 */
function isForeignScript(message: string): boolean {
  let expected = 0;
  let letters = 0;
  for (const char of message) {
    if (!ANY_LETTER.test(char)) {
      continue;
    }
    letters += 1;
    if (ARABIC_LETTER.test(char) || LATIN_LETTER.test(char)) {
      expected += 1;
    }
  }
  return letters > 0 && expected / letters < EXPECTED_SCRIPT_MIN_RATIO;
}

/**
 * Shouting, measured only where it can be: over LATIN letters, because Arabic is caseless and a
 * caps ratio computed across it would be a constant zero pretending to be a signal (WEB5's
 * cousin). A run of `!`/`?` counts in either script.
 */
function isShouting(message: string): boolean {
  const latin = [...message].filter((char) => LATIN_LETTER.test(char));
  const shoutedRun = new RegExp(`[!?]{${String(SHOUTING_RUN_MIN)},}`, 'u').test(
    message,
  );
  if (shoutedRun) {
    return true;
  }
  if (latin.length < SHOUTING_MIN_LETTERS) {
    return false;
  }
  const upper = latin.filter((char) => UPPERCASE_LATIN.test(char)).length;
  return upper / latin.length >= SHOUTING_CAPS_RATIO;
}

function hasRepeatedRun(message: string): boolean {
  let run = 1;
  let previous = '';
  for (const char of message) {
    if (!ANY_LETTER.test(char)) {
      run = 1;
      previous = '';
      continue;
    }
    run = char === previous ? run + 1 : 1;
    if (run >= REPEATED_CHARS_RUN_MIN) {
      return true;
    }
    previous = char;
  }
  return false;
}

function signal(id: LeadSpamSignalId, n?: number): LeadSpamSignal {
  const weight = SPAM_WEIGHTS[id] * Math.min(n ?? 1, SPAM_COUNT_CAP);
  return n === undefined ? { id, weight } : { id, weight, n };
}

/**
 * Score a submission for spam (P8.10.B3) — a pure function of the submitted text, so the same
 * payload always scores the same and the whole thing is testable without a database.
 *
 * It only ever RANKS: nothing here rejects a submission, archives a lead, or reaches the visitor.
 * Signals come back sorted by weight so the inbox breakdown leads with the actual reason.
 */
export function scoreLeadForSpam(lead: ScorableLead): LeadSpamAssessment {
  const signals: LeadSpamSignal[] = [];

  const phrases = countSpamPhrases(`${lead.message} ${lead.company ?? ''}`);
  if (phrases > 0) {
    signals.push(signal('keywords', phrases));
  }

  const links = countUrls(lead.message);
  if (links >= LINKS_MIN_COUNT) {
    signals.push(signal('links', links));
  }

  // A client writes their name in the name field. A bot writes its landing page there.
  if (countUrls(`${lead.name} ${lead.company ?? ''}`) > 0) {
    signals.push(signal('contactLinks'));
  }

  if (isForeignScript(lead.message)) {
    signals.push(signal('foreignScript'));
  }

  if (hasRepeatedRun(lead.message)) {
    signals.push(signal('repeatedChars'));
  }

  if (lead.message.trim().length < SHORT_MESSAGE_MAX_CHARS) {
    signals.push(signal('shortMessage'));
  }

  if (isShouting(lead.message)) {
    signals.push(signal('shouting'));
  }

  signals.sort((a, b) => b.weight - a.weight);
  const total = signals.reduce((sum, entry) => sum + entry.weight, 0);
  return { score: Math.min(total, LEAD_SPAM_SCORE_MAX), signals };
}
