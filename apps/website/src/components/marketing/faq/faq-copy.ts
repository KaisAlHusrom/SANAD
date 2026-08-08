import type { FaqCategory, LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the FAQ page (U9/WEB1) — the questions/answers themselves are CMS `faq`
 * entities; this file backs the page chrome (hero, category tag labels, empty state, "still have
 * questions" CTA to contact) so the page is never blank. There is no §faq section in
 * content-defaults.md, so this chrome is authored here (bilingual, ar-first, business voice).
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

/** Human labels for the `faq_category` enum (shown as a tag on each answer). */
export const FAQ_CATEGORY_LABEL: Record<FaqCategory, LocalizedText> = {
  general: t('عام', 'General'),
  pricing: t('الأسعار', 'Pricing'),
  process: t('آلية العمل', 'Process'),
  support: t('الدعم', 'Support'),
};

export const FAQ_COPY = {
  hero: {
    eyebrow: t('الأسئلة الشائعة', 'FAQ'),
    title: t('أسئلةٌ نُسأل عنها كثيرًا', 'Questions we’re often asked'),
    subtitle: t(
      'كل ما تريد معرفته عن كيفية عملنا، التكلفة، والدعم بعد الإطلاق — وإن بقي سؤال، نحن قريبون.',
      'Everything you want to know about how we work, pricing, and support after launch — and if a question remains, we’re close by.',
    ),
    talk: t('تواصل معنا', 'Talk to us'),
  },
  list: {
    eyebrow: t('٠١ · الأسئلة', '01 · QUESTIONS'),
    title: t('إجاباتٌ مباشرة', 'Straight answers'),
    empty: t('الأسئلة الشائعة قيد الإعداد.', 'The FAQ is being prepared.'),
  },
  cta: {
    eyebrow: t('ما زال لديك سؤال؟', 'STILL HAVE A QUESTION?'),
    title: t('لم تجد إجابتك؟', 'Didn’t find your answer?'),
    subtitle: t(
      'اسألنا مباشرة — نردّ بوضوح ودون التزام.',
      'Ask us directly — we answer clearly, with no obligation.',
    ),
    talk: t('اسأل فريقنا', 'Ask our team'),
  },
} as const;
