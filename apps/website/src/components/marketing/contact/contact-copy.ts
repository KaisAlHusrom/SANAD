import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the Contact page hero band (U9/WEB1/F7). `/contact` is a CMS-chrome page:
 * a single editable `richtext` hero above the KEPT bespoke `LeadForm`. This is the single source for
 * BOTH the seeded hero band (byte-transcribed into the content-service seed) and the coded
 * `FALLBACK_CONTACT_SECTIONS`. Transcribed from the i18n `dict.contact` (`nav.contact` → eyebrow,
 * `contact.title`/`contact.lead` → title/subtitle) so the hero copy stays consistent with the form's
 * field labels (which remain in `dict.contact.*`). Self-paired `t(ar, en)`, Arabic-first.
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

export const CONTACT_COPY = {
  hero: {
    eyebrow: t('تواصل معنا', 'Contact'),
    title: t('لنبدأ الحديث', 'Let’s talk'),
    subtitle: t(
      'احكِ لنا عن مشروعك وسنعاود التواصل معك.',
      'Tell us about your project and we will get back to you.',
    ),
  },
} as const;
