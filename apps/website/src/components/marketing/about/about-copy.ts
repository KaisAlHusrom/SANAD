import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the About page (U9/WEB1) — transcribed verbatim from
 * `docs/design/content-defaults.md` §about. The CMS `team_member` entities supply the
 * team grid (name/role/bio/avatar, WEB1); this file backs the rest of the page (hero, story,
 * values, section chrome, CTA) so the page is never blank.
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

export const ABOUT_COPY = {
  hero: {
    eyebrow: t('من نحن', 'About us'),
    title: t(
      'نَسنِدُ الفِرَقَ التي تبني الغد',
      'We back the teams building tomorrow',
    ),
    subtitle: t(
      '«سَنَد» تعني الدعم والإسناد. وُجِدنا لنكون الكتف الذي تتّكئ عليه الفِرَق وهي تُطلق منتجاتها — ونُكمل معها الطريق بعد الإطلاق.',
      '"Sanad" means backing. We exist to be the shoulder teams lean on as they ship — and to keep walking the road with them after launch.',
    ),
    talk: t('تواصل معنا', 'Get in touch'),
  },
  story: {
    eyebrow: t('الحكاية', 'Our story'),
    title: t(
      'بدأنا من سؤال: لماذا يُسلَّم البرنامج ثم يُترَك؟',
      'We started from one question: why is software handed over, then abandoned?',
    ),
    body1: t(
      'رأينا فِرَقًا تدفع الكثير مقابل نظامٍ يصلها ناقصًا، بلا متابعةٍ بعد الإطلاق. فاخترنا طريقةً مختلفة: مراحل واضحة، تسليمٌ يُراجَع ويُعتمَد، واجتماعٌ أسبوعيٌّ يُبقي الجميع على المسار نفسه.',
      'We watched teams pay dearly for systems that arrived incomplete, with no follow-through after launch. So we chose a different way: clear phases, deliverables you review and approve, and a weekly meeting that keeps everyone on the same track.',
    ),
    body2: t(
      'اليوم نُسنِدُ فِرَقًا في المنطقة — من الشركات الناشئة إلى المؤسسات — ونبقى معها حتى بعد أن يُضيء المنتج.',
      'Today we back teams across the region — from startups to enterprises — and stay with them long after the product goes live.',
    ),
  },
  values: {
    eyebrow: t('ما يقودنا', 'What drives us'),
    title: t(
      'ثلاثُ قِيَمٍ نَزِنُ بها كلَّ قرار',
      'Three values behind every decision',
    ),
    items: [
      {
        key: 'trust',
        title: t('الثِّقة', 'Trust'),
        desc: t(
          'شفافيةٌ كاملة في كل مرحلة: تعرف أين وصل مشروعك، وما القادم، ومن يعمل عليه — بلا مفاجآت.',
          'Full transparency at every phase: you know where your project stands, what’s next, and who’s on it — no surprises.',
        ),
      },
      {
        key: 'mastery',
        title: t('الإتقان', 'Mastery'),
        desc: t(
          'كودٌ نظيف، بنيةٌ قابلة للتوسّع، واختبارٌ قبل كل تسليم. نبني لِيُعمَّر، لا لِيُرمَّم.',
          'Clean code, scalable architecture, tested before every delivery. We build to last, not to patch.',
        ),
      },
      {
        key: 'craft',
        title: t('الحِرفة', 'Craft'),
        desc: t(
          'نهتمّ بالتفصيل الصغير: حركةٌ سلسة، واجهةٌ تحترم لغتك، وتجربةٌ تُشعِر مستخدميك أنهم في أيدٍ أمينة.',
          'We sweat the details: fluid motion, an interface that respects your language, an experience that tells users they’re in safe hands.',
        ),
      },
    ],
  },
  team: {
    eyebrow: t('الفريق', 'The team'),
    title: t('عقولٌ تعمل في اتّجاهٍ واحد', 'Minds pulling in one direction'),
    empty: t('الفريق قيد التحديث.', 'The team page is being updated.'),
  },
  cta: {
    title: t(
      'هل نَبني نظامك التالي معًا؟',
      'Shall we build your next system together?',
    ),
    subtitle: t(
      'ابدأ بمكالمةٍ قصيرة، ودَعنا نرسم لك خريطة المراحل.',
      'Start with a short call and let us map the phases for you.',
    ),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
} as const;
