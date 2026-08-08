import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the Blog pages (U9/WEB1) — the posts themselves are CMS `blog_post`
 * entities (title/excerpt/body + category/author/tags); this file backs the page chrome (hero,
 * list labels, filter, article meta labels, related, CTA) so the pages are never blank. Seeded
 * from `.claude/design/content-defaults.md` §blog (eyebrow/title/readMore) with the remaining
 * chrome authored here. Business-first wording (never theme narration).
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

export const BLOG_COPY = {
  hero: {
    eyebrow: t('المدوّنة', 'Writing'),
    title: t('أفكارٌ من ورشة العمل', 'Notes from the workshop'),
    subtitle: t(
      'نكتب عمّا نتعلّمه ونحن نبني: كيف نُسلّم على مراحل، كيف نصنع القرارات، وكيف نبقى معك بعد الإطلاق.',
      'We write about what we learn as we build: how we deliver in phases, how we make decisions, and how we stay with you after launch.',
    ),
    explore: t('اقرأ المقالات', 'Read the writing'),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
  filter: {
    label: t('تصفية حسب التصنيف', 'Filter by category'),
    all: t('الكل', 'All'),
  },
  list: {
    eyebrow: t('٠١ · المقالات', '01 · ARTICLES'),
    title: t('أحدث ما كتبنا', 'Latest writing'),
    empty: t(
      'أولى التدوينات قيد الكتابة — عُد قريبًا.',
      'The first entries are being written — check back soon.',
    ),
    readMore: t('اقرأ المزيد', 'Read more'),
  },
  cta: {
    eyebrow: t('لنبدأ', 'LET’S BEGIN'),
    title: t('عندك فكرةٌ تستحق أن تُبنى؟', 'Have an idea worth building?'),
    subtitle: t(
      'احجز مكالمةً قصيرة ونرسم معًا أنسب مسار.',
      'Book a short call and we’ll map the right path together.',
    ),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
} as const;

export const POST_COPY = {
  home: t('المدوّنة', 'Blog'),
  /** The minutes-to-read suffix beside the read-time number (Western digits, WEB6). */
  readUnit: t('دقائق قراءة', 'min read'),
  meta: {
    author: t('الكاتب', 'Author'),
    published: t('تاريخ النشر', 'Published'),
    category: t('التصنيف', 'Category'),
    readTime: t('وقت القراءة', 'Reading time'),
  },
  tags: t('الوسوم', 'Tags'),
  related: {
    eyebrow: t('مقالاتٌ ذات صلة', 'Related writing'),
    title: t('تدويناتٌ أخرى قد تهمّك', 'Other notes you may like'),
  },
  cta: {
    title: t('جاهزٌ لتبني مشروعك؟', 'Ready to build your project?'),
    subtitle: t(
      'نبدأ بمرحلة اكتشافٍ قصيرة نرسم فيها النطاق والخريطة الزمنية.',
      'We start with a short discovery phase to map scope and timeline.',
    ),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
} as const;
