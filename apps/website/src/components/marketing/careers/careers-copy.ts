import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the Careers page (U9/WEB1). Careers is a fully-coded page — there is no
 * jobs entity yet (a structured openings model is deferred to the HR service, P12), so the whole
 * page is authored here (bilingual, ar-first, business voice). It presents the culture + values
 * and, since there are no open roles, invites talented people to reach out (→ the contact page).
 * There is no §careers section in content-defaults.md, so this copy is authored from scratch.
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

export const CAREERS_COPY = {
  hero: {
    eyebrow: t('انضم إلينا', 'Join us'),
    title: t('ابنِ معنا ما يدوم', 'Build things that last, with us'),
    subtitle: t(
      'نحن فريقٌ صغير يهتمّ بالحِرفة والأثر — نبني منتجاتٍ حقيقية لعملاء حقيقيين، ونتعلّم في كل مرحلة.',
      'We’re a small team that cares about craft and impact — we build real products for real clients, and learn at every phase.',
    ),
    talk: t('تعرّف علينا', 'Get to know us'),
  },
  culture: {
    eyebrow: t('ثقافتنا', 'Our culture'),
    title: t('كيف نعمل معًا', 'How we work together'),
    items: [
      {
        key: 'craft',
        title: t('حِرفةٌ قبل السرعة', 'Craft before speed'),
        desc: t(
          'نكتب كودًا نظيفًا ونختبر قبل كل تسليم — لأن ما نبنيه يجب أن يُعمَّر، لا أن يُرمَّم.',
          'We write clean code and test before every delivery — what we build should last, not be patched.',
        ),
      },
      {
        key: 'ownership',
        title: t('مسؤوليةٌ كاملة', 'Full ownership'),
        desc: t(
          'كلٌّ منّا يملك عمله من الفكرة إلى الإطلاق، ويتحدّث بلغة العميل لا بلغة التقنية وحدها.',
          'Each of us owns their work from idea to launch, and speaks the client’s language, not only tech.',
        ),
      },
      {
        key: 'growth',
        title: t('تعلّمٌ مستمر', 'Continuous learning'),
        desc: t(
          'نراجع، نتشارك ما نتعلّمه، ونمنح بعضنا الوقت لنُتقن — النموّ جزءٌ من العمل، لا إضافةٌ عليه.',
          'We review, share what we learn, and give each other room to master the craft — growth is part of the work, not extra to it.',
        ),
      },
    ],
  },
  openings: {
    eyebrow: t('الشواغر', 'Open roles'),
    title: t('لا توجد شواغر معلنة حاليًا', 'No open roles right now'),
    body: t(
      'لكننا نسعد دائمًا بالتعرّف على أشخاصٍ موهوبين. إن رأيت نفسك معنا — مطوّرًا، مصمّمًا، أو مديرَ مشاريع — أرسل لنا أعمالك وسنبقى على تواصل حين يفتح دورٌ يناسبك.',
      'But we’re always glad to meet talented people. If you see yourself with us — as a developer, designer, or project manager — send us your work and we’ll stay in touch when a fitting role opens.',
    ),
    talk: t('أرسل أعمالك', 'Send us your work'),
  },
  cta: {
    title: t('مستعدٌّ للحديث؟', 'Ready to talk?'),
    subtitle: t(
      'تواصل معنا وأخبرنا بما تحبّ أن تبنيه.',
      'Reach out and tell us what you’d love to build.',
    ),
    talk: t('تواصل معنا', 'Get in touch'),
  },
} as const;
