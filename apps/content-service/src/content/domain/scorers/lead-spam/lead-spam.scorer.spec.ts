import { LEAD_SPAM_SCORE_MAX, spamVerdictOf } from '@sanad/contracts';
import type { LeadSpamSignalId } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { SPAM_PHRASES } from './lead-spam.constants.js';
import { scoreLeadForSpam, type ScorableLead } from './lead-spam.scorer.js';

/** A real enquiry: Arabic, specific, polite, no links. The baseline every signal must not touch. */
const genuine: ScorableLead = {
  name: 'ريما القحطاني',
  company: 'مجموعة الواحة',
  message:
    'السلام عليكم، نبحث عن شريك تقني لبناء منصة حجوزات لفروعنا الخمسة في الرياض وجدة. هل يمكننا ترتيب اجتماع الأسبوع القادم لمناقشة النطاق والميزانية؟',
};

function idsOf(lead: ScorableLead): LeadSpamSignalId[] {
  return scoreLeadForSpam(lead).signals.map((signal) => signal.id);
}

describe('scoreLeadForSpam (P8.10.B3)', () => {
  describe('the baseline it must never break', () => {
    it('scores a genuine Arabic enquiry as clean, with no signal at all', () => {
      const result = scoreLeadForSpam(genuine);
      expect(result.signals).toEqual([]);
      expect(result.score).toBe(0);
      expect(spamVerdictOf(result.score)).toBe('clean');
    });

    it('keeps a genuine enquiry clean when it links to one portfolio piece', () => {
      const result = scoreLeadForSpam({
        ...genuine,
        message: `${genuine.message} هذا مثال لما نريده: https://example.com/case-study`,
      });
      expect(spamVerdictOf(result.score)).toBe('clean');
    });

    it('keeps "a new website plus ongoing SEO services" clean — that is our inbound, not spam', () => {
      // Regression: `'seo service'` and `'seo services'` both used to be listed, so ONE phrase
      // matched twice and scored 30 (suspicious) while telling the team it had seen two.
      const result = scoreLeadForSpam({
        name: 'Sarah Whitfield',
        company: 'Northwind Retail',
        message:
          'Hello, we need a new corporate website and ongoing SEO services for our retail brand. Can we book a call?',
      });
      const keywords = result.signals.find((s) => s.id === 'keywords');
      expect(keywords?.n).toBe(1);
      expect(spamVerdictOf(result.score)).toBe('clean');
    });

    it('does not find a spam phrase hiding inside an ordinary word', () => {
      // `سيو` used to fire inside `السيولة` (liquidity), and `crypto` inside `cryptography`.
      expect(
        idsOf({
          name: 'Faisal',
          company: null,
          message:
            'نحتاج نظامًا ماليًا يعرض السيولة النقدية والتدفقات لفروعنا الستة.',
        }),
      ).not.toContain('keywords');
      expect(
        idsOf({
          name: 'Sarah',
          company: 'Northwind',
          message:
            'We need a document vault with proper cryptography and a feedback link on every page.',
        }),
      ).not.toContain('keywords');
    });

    it('does not flag a fintech client for naming the industry they work in', () => {
      // A Gulf client asking us to BUILD a trading app is a customer, not a bot. Bare industry
      // nouns are excluded from the list precisely so two of them cannot stack into `suspicious`.
      const result = scoreLeadForSpam({
        name: 'Nasser Al-Otaibi',
        company: 'Tadawul Capital',
        message:
          'We are building a crypto and forex trading platform for retail investors and need a technical partner for the mobile app.',
      });
      expect(result.signals.map((s) => s.id)).not.toContain('keywords');
      expect(spamVerdictOf(result.score)).toBe('clean');
    });

    it('scores a genuine English enquiry as clean', () => {
      const result = scoreLeadForSpam({
        name: 'Sarah Whitfield',
        company: 'Northwind Retail',
        message:
          'Hello, we are looking for a partner to rebuild our internal inventory dashboard. Could we book a call next week to walk through the scope?',
      });
      expect(result.signals).toEqual([]);
      expect(result.score).toBe(0);
    });
  });

  describe('the phrase list itself', () => {
    it('never lets one phrase contain another — that is how a single match counts twice', () => {
      const offenders = SPAM_PHRASES.flatMap((phrase) =>
        SPAM_PHRASES.filter(
          (other) => other !== phrase && other.includes(phrase),
        ).map((other) => `${phrase} ⊂ ${other}`),
      );
      expect(offenders).toEqual([]);
    });

    it('matches a plural without a second entry for it', () => {
      expect(
        idsOf({
          name: 'Alex',
          company: null,
          message: 'We sell backlinks and guest posts at scale.',
        }),
      ).toContain('keywords');
    });
  });

  describe('keywords', () => {
    it('fires on English SEO spam and counts the phrases', () => {
      const result = scoreLeadForSpam({
        name: 'Alex',
        company: null,
        message:
          'We offer cheap SEO services and high quality backlinks for your website, plus guest post placements.',
      });
      const keywords = result.signals.find((s) => s.id === 'keywords');
      expect(keywords).toBeDefined();
      expect(keywords?.n).toBeGreaterThanOrEqual(2);
    });

    it('fires on Arabic spam phrases too — the site is Arabic-first', () => {
      expect(
        idsOf({
          name: 'محمد',
          company: null,
          message: 'نقدم خدمات تحسين محركات البحث وباك لينك بأسعار رخيصة جدا',
        }),
      ).toContain('keywords');
    });

    it('does not fire on an enquiry that merely mentions its own industry', () => {
      expect(
        idsOf({
          name: 'Omar',
          company: 'Gulf Logistics',
          message:
            'We need a booking platform for our fleet. Our current site is slow and hard to manage.',
        }),
      ).not.toContain('keywords');
    });
  });

  describe('links', () => {
    it('does not fire on a single link', () => {
      expect(
        idsOf({
          ...genuine,
          message: `${genuine.message} https://example.com`,
        }),
      ).not.toContain('links');
    });

    it('fires once a message carries several links, and counts them', () => {
      const result = scoreLeadForSpam({
        name: 'Alex',
        company: null,
        message:
          'Visit https://a.example http://b.example and www.c.example for details.',
      });
      const links = result.signals.find((s) => s.id === 'links');
      expect(links?.n).toBe(3);
    });
  });

  describe('contactLinks', () => {
    it('fires on a URL where a name should be', () => {
      expect(
        idsOf({ ...genuine, name: 'buy-now https://cheap.example' }),
      ).toContain('contactLinks');
    });

    it('fires on a URL where a company should be', () => {
      expect(idsOf({ ...genuine, company: 'https://cheap.example' })).toContain(
        'contactLinks',
      );
    });

    it('does not fire on an ordinary company name', () => {
      expect(idsOf({ ...genuine, company: 'Al-Waha Group' })).not.toContain(
        'contactLinks',
      );
    });
  });

  describe('foreignScript', () => {
    it('fires on a message written in a script the site does not serve', () => {
      expect(
        idsOf({
          name: 'Ivan',
          company: null,
          message:
            'Здравствуйте, предлагаем услуги продвижения сайтов и размещение ссылок на выгодных условиях.',
        }),
      ).toContain('foreignScript');
    });

    it('NEVER fires on Arabic — the default locale of this site', () => {
      expect(idsOf(genuine)).not.toContain('foreignScript');
    });

    it('never fires on Latin, or on Arabic mixed with Latin brand names', () => {
      expect(
        idsOf({
          ...genuine,
          message: 'نريد ربط النظام مع Salesforce و Google Analytics من فضلكم.',
        }),
      ).not.toContain('foreignScript');
    });

    it('does not fire on a message with no letters at all (no division by zero)', () => {
      const result = scoreLeadForSpam({
        name: 'Test',
        company: null,
        message: '+966 50 123 4567 — 12345',
      });
      expect(result.signals.map((s) => s.id)).not.toContain('foreignScript');
      expect(Number.isFinite(result.score)).toBe(true);
    });
  });

  describe('shortMessage', () => {
    it('fires on a message too short to be an enquiry', () => {
      expect(
        idsOf({ name: 'أحمد', company: null, message: 'مرحبا' }),
      ).toContain('shortMessage');
    });

    it('leaves a short greeting CLEAN on its own — one weak signal is not spam', () => {
      const result = scoreLeadForSpam({
        name: 'أحمد',
        company: null,
        message: 'مرحبا',
      });
      expect(spamVerdictOf(result.score)).toBe('clean');
    });
  });

  describe('shouting', () => {
    it('fires on Latin text that is nearly all capitals', () => {
      expect(
        idsOf({
          name: 'Alex',
          company: null,
          message: 'URGENT REPLY NEEDED RIGHT NOW ABOUT YOUR WEBSITE OFFER',
        }),
      ).toContain('shouting');
    });

    it('fires on a run of exclamation marks', () => {
      expect(
        idsOf({ ...genuine, message: `${genuine.message}!!!!!` }),
      ).toContain('shouting');
    });

    it('never fires on Arabic, which has no letter case', () => {
      expect(idsOf(genuine)).not.toContain('shouting');
    });

    it('does not fire on an ordinary short acronym in a normal sentence', () => {
      expect(
        idsOf({
          name: 'Sarah',
          company: 'Northwind',
          message:
            'We need an ERP and a CRM integrated with our existing POS system, ideally before Q4.',
        }),
      ).not.toContain('shouting');
    });
  });

  describe('repeatedChars', () => {
    it('fires on a long run of one character', () => {
      expect(
        idsOf({ ...genuine, message: 'حياااااااااااااكم الله يا اخوان' }),
      ).toContain('repeatedChars');
    });

    it('does not fire on ordinary doubled letters', () => {
      expect(
        idsOf({
          name: 'Sarah',
          company: 'Northwind',
          message:
            'We need a committee-approved assessment of the current address book before we commit.',
        }),
      ).not.toContain('repeatedChars');
    });
  });

  describe('the score itself', () => {
    it('adds up to exactly the weights of the signals it reports', () => {
      const result = scoreLeadForSpam({
        name: 'buy https://a.example',
        company: null,
        message: 'CHEAP SEO BACKLINKS!!!! https://a.example https://b.example',
      });
      const sum = result.signals.reduce((total, s) => total + s.weight, 0);
      expect(result.score).toBe(Math.min(sum, LEAD_SPAM_SCORE_MAX));
    });

    it('reads a loud, linked, keyword-stuffed blast as likely spam', () => {
      const result = scoreLeadForSpam({
        name: 'seo-master https://cheap.example',
        company: null,
        message:
          'CHEAP SEO BACKLINKS AND GUEST POST!!!! BUY NOW https://a.example https://b.example https://c.example',
      });
      expect(spamVerdictOf(result.score)).toBe('likelySpam');
    });

    it('clamps at the maximum instead of running past it', () => {
      const result = scoreLeadForSpam({
        name: 'https://a.example',
        company: 'https://b.example',
        message:
          'SEO BACKLINK CRYPTO CASINO LOAN!!!! ааааааааааааа https://a.example https://b.example https://c.example https://d.example',
      });
      expect(result.score).toBeLessThanOrEqual(LEAD_SPAM_SCORE_MAX);
      expect(result.score).toBe(LEAD_SPAM_SCORE_MAX);
    });

    it('reports its signals in descending weight — the breakdown leads with the reason', () => {
      const result = scoreLeadForSpam({
        name: 'Alex',
        company: null,
        message:
          'SEO BACKLINKS GUEST POST CHEAP!!!! https://a.example https://b.example',
      });
      const weights = result.signals.map((s) => s.weight);
      expect([...weights].sort((a, b) => b - a)).toEqual(weights);
    });
  });
});
