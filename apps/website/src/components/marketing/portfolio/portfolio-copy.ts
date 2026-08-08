import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the Portfolio pages (U9/WEB1) — the case studies themselves are CMS
 * `portfolio_project` entities (title/summary/challenge/solution/result + cover); this file backs
 * the page chrome (hero, the case-study section labels, meta, CTA) so the page is never blank.
 * The Challenge/Solution/Result labels are transcribed from `.claude/design/content-defaults.md`
 * §work. Business-first wording (never theme narration).
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

export const PORTFOLIO_COPY = {
  hero: {
    eyebrow: t('أعمالنا', 'Selected work'),
    title: t(
      'أنظمةٌ أطلقناها، ونتائجُ نفخر بها',
      'Systems we shipped, outcomes we stand by',
    ),
    subtitle: t(
      'كلُّ مشروعٍ تحدٍّ فهمناه، وحلٌّ بنيناه، ونتيجةٌ قِسناها. اختر عملًا لتقرأ قصّته كاملة.',
      'Each project is a challenge we understood, a solution we built, and a result we measured. Pick one to read its full story.',
    ),
    explore: t('استعرض الأعمال', 'Browse the work'),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
  filter: {
    label: t('تصفية حسب المجال', 'Filter by domain'),
    all: t('الكل', 'All'),
  },
  grid: {
    eyebrow: t('٠١ · دراسات الحالة', '01 · CASE STUDIES'),
    title: t('ما الذي بنيناه', 'What we built'),
    empty: t('دراسات الحالة قيد الإعداد.', 'Case studies are being prepared.'),
  },
  cta: {
    eyebrow: t('لنبدأ', 'LET’S BEGIN'),
    title: t(
      'مشروعك القادم قد يكون قصّتنا التالية',
      'Your next project could be our next story',
    ),
    subtitle: t(
      'احجز مكالمةً قصيرة ونرسم معًا أنسب مسار.',
      'Book a short call and we’ll map the right path together.',
    ),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
} as const;

export const CASE_STUDY_COPY = {
  home: t('أعمالنا', 'Work'),
  /** The three-act case-study narrative labels (content-defaults §work). */
  challenge: t('التحدّي', 'Challenge'),
  solution: t('الحل', 'Solution'),
  result: t('النتيجة', 'Result'),
  meta: {
    client: t('العميل', 'Client'),
    domain: t('المجال', 'Domain'),
    outcome: t('الأثر', 'Outcome'),
    visit: t('زيارة المشروع', 'Visit project'),
  },
  related: {
    eyebrow: t('أعمالٌ ذات صلة', 'Related work'),
    title: t('مشاريعُ أخرى قد تهمّك', 'Other projects you may like'),
  },
  cta: {
    title: t('جاهزٌ لقصّتك القادمة؟', 'Ready for your next story?'),
    subtitle: t(
      'نبدأ بمرحلة اكتشافٍ قصيرة نرسم فيها النطاق والخريطة الزمنية.',
      'We start with a short discovery phase to map scope and timeline.',
    ),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
} as const;
