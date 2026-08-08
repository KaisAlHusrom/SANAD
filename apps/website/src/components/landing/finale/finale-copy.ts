import type { Locale } from '@sanad/contracts';

/**
 * Coded-default copy for the footer finale (U9 — marketing copy, not chrome i18n). The cinematic
 * (descent, impact, crater) speaks for itself — the WORDS talk business: what the company does for
 * the client's next project (owner directive 2026-07-07 #1: never narrate the theme in titles).
 * Bilingual, ar-first.
 */
export const FINALE_COPY = {
  // the headline is split so only the final word carries the gradient accent (reference)
  titleLead: { ar: 'مشروعُك القادم يستحق ', en: 'Your next project deserves ' },
  titleAccent: { ar: 'سَنَدًا', en: 'real backing' },
  tagline: {
    ar: 'فريقٌ واحد يفهم عملك، يبنيه على مراحل واضحة، ويبقى معك بعد الإطلاق.',
    en: 'One team that understands your business, builds it in clear phases, and stays with you after launch.',
  },
  cta: { ar: 'ابدأ مشروعك', en: 'Start your project' },
  brand: { ar: 'سَنَد التقنية', en: 'Sanad Tech' },
  blurb: {
    ar: 'بيت برمجياتٍ عربيّ يبني منتجاتٍ تدوم — من الفكرة إلى الإطلاق وما بعده.',
    en: 'An Arabic-first software house building products that last — from idea to launch and beyond.',
  },
  colProduct: { ar: 'المنتج', en: 'Product' },
  colCompany: { ar: 'الشركة', en: 'Company' },
  colContact: { ar: 'تواصل', en: 'Contact' },
  email: { ar: 'hello@sanad.tech', en: 'hello@sanad.tech' },
  location: { ar: 'الرياض، السعودية', en: 'Riyadh, Saudi Arabia' },
  rights: {
    ar: '© سند التقنية. جميع الحقوق محفوظة.',
    en: '© Sanad Tech. All rights reserved.',
  },
  privacy: { ar: 'الخصوصية', en: 'Privacy' },
  terms: { ar: 'الشروط', en: 'Terms' },
} as const;

export function finaleCopy(
  entry: { ar: string; en: string },
  locale: Locale,
): string {
  return entry[locale] ?? entry.ar;
}
