import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the request-a-project page (`/request-a-project`) — the flagship
 * conversion surface (U9/WEB1). Self-paired `t(ar, en)`. The shared field labels + validation +
 * status strings are reused from `dict.contact.*` (the form only adds its multi-step chrome here).
 * Business-forward voice (sell the phased method, not the cinematic) per the owner copy principle.
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

export const REQUEST_COPY = {
  hero: {
    eyebrow: t('ابدأ مشروعك', 'Start a project'),
    title: t(
      'لِنَبنِ مشروعك القادم، مرحلةً مرحلة',
      "Let's build your next project, phase by phase",
    ),
    subtitle: t(
      'ثلاث خطوات قصيرة تُعرِّفنا بمشروعك، ونعود إليك بخريطة مراحل واضحة وخطوةٍ أولى.',
      'Three short steps to tell us about your project — we come back with a clear phase map and a first step.',
    ),
  },
  stepsAria: t('خطوات طلب المشروع', 'Project request steps'),
  steps: [
    {
      key: 'project',
      title: t('مشروعك', 'Your project'),
      caption: t('النوع والميزانية', 'Type & budget'),
    },
    {
      key: 'brief',
      title: t('الفكرة', 'The brief'),
      caption: t('احكِ لنا عنها', 'Tell us about it'),
    },
    {
      key: 'you',
      title: t('بياناتك', 'About you'),
      caption: t('كيف نصل إليك', 'How we reach you'),
    },
  ],
  project: {
    typeHeading: t('ما الذي نبنيه؟', 'What are we building?'),
    typeHint: t('اختر الأقرب لفكرتك', 'Pick the closest to your idea'),
    budgetHeading: t('الميزانية التقديرية', 'Estimated budget'),
    budgetHint: t(
      'تساعدنا على اقتراح النطاق المناسب',
      'Helps us propose the right scope',
    ),
    pleaseSelect: t(
      'اختر نوع المشروع للمتابعة',
      'Choose a project type to continue',
    ),
  },
  brief: {
    heading: t('احكِ لنا عن مشروعك', 'Tell us about your project'),
    hint: t(
      'ما المشكلة التي تحلّها؟ ومن مستخدموك؟ وما أهمّ ما يجب أن ننجزه أولًا؟',
      'What problem does it solve? Who are your users? What matters most to ship first?',
    ),
  },
  you: {
    heading: t('كيف نصل إليك؟', 'How do we reach you?'),
    reviewHeading: t('مراجعة طلبك', 'Review your request'),
  },
  review: {
    type: t('نوع المشروع', 'Project type'),
    budget: t('الميزانية', 'Budget'),
    none: t('لم يُحدَّد', 'Not specified'),
  },
  nav: {
    back: t('السابق', 'Back'),
    next: t('التالي', 'Next'),
  },
  success: {
    title: t('وصلَنا طلبك', "We've received your request"),
    body: t(
      'شكرًا لك. سيتواصل معك فريقنا خلال يوم عمل واحد لنرسم معًا خريطة المراحل ونحدّد الخطوة الأولى.',
      'Thank you. Our team will reach out within one business day to map the phases with you and define the first step.',
    ),
    back: t('العودة للرئيسية', 'Back to home'),
  },
} as const;
