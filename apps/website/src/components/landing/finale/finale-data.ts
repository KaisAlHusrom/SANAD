import {
  pickLocalized,
  type BrandingRecord,
  type Locale,
  type MenuTree,
} from '@sanad/contracts';
import {
  contactAddress,
  contactEmail,
  copyrightLine,
  socialLinks,
  type SocialLink,
} from '../../../branding/company-info';
import { localizeHref } from '../../../lib/localize-href';
import { FINALE_COPY, finaleCopy } from './finale-copy';

export interface FinaleLink {
  href: string;
  label: string;
}

export interface FinaleColumn {
  title: string;
  links: FinaleLink[];
}

/** Everything the (client) finale renders, derived server-side so it stays a plain-prop island. */
export interface FinaleData {
  brandName: string;
  blurb: string;
  copyright: string;
  email: string | null;
  address: string | null;
  /** The routed "company" column — from the admin footer menu, else the coded fallback. */
  companyColumn: FinaleColumn;
  socials: SocialLink[];
}

/** The coded company links, used only when the admin footer menu is empty/absent (F7). */
const FALLBACK_COMPANY: ReadonlyArray<{
  path: string;
  ar: string;
  en: string;
}> = [
  { path: '/about', ar: 'من نحن', en: 'About' },
  { path: '/blog', ar: 'المدوّنة', en: 'Blog' },
  { path: '/faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
  { path: '/careers', ar: 'الوظائف', en: 'Careers' },
  { path: '/contact', ar: 'تواصل معنا', en: 'Contact' },
];

/**
 * Builds the landing finale's content from the SAME sources the global chrome footer uses — the
 * branding settings + the admin-controlled footer menu — so the two footers can no longer
 * contradict each other. The finale previously hardcoded its own brand name, blurb, email, city
 * and copyright, and even spelled the company differently (`سند` vs `سَنَد`).
 *
 * The finale's in-page PRODUCT anchors (`#services`/`#works`/`#process`) stay coded — they address
 * sections of this very page, so they are cinematic design, not company config. Only the routed
 * "company" column is menu-driven (the footer menu's first column). Every field degrades to the
 * coded `FINALE_COPY` when settings/menu are absent (F7).
 */
export function buildFinaleData(
  branding: BrandingRecord | null,
  menu: MenuTree | null,
  locale: Locale,
): FinaleData {
  const fallbackBrand = finaleCopy(FINALE_COPY.brand, locale);
  const brandName = branding
    ? pickLocalized(branding.brand.name, locale)
    : fallbackBrand;
  const tagline = branding ? pickLocalized(branding.brand.tagline, locale) : '';

  const firstColumn = menu?.items?.[0];
  const companyColumn: FinaleColumn = firstColumn
    ? {
        title: pickLocalized(firstColumn.label, locale),
        links: firstColumn.children.map((child) => ({
          href: localizeHref(child.url, locale),
          label: pickLocalized(child.label, locale),
        })),
      }
    : {
        title: finaleCopy(FINALE_COPY.colCompany, locale),
        links: FALLBACK_COMPANY.map((item) => ({
          href: `/${locale}${item.path}`,
          label: locale === 'ar' ? item.ar : item.en,
        })),
      };

  return {
    brandName,
    blurb: tagline || finaleCopy(FINALE_COPY.blurb, locale),
    copyright: copyrightLine(
      branding,
      locale,
      finaleCopy(FINALE_COPY.rights, locale),
      fallbackBrand,
    ),
    email: contactEmail(branding) ?? FINALE_COPY.email.en,
    address:
      contactAddress(branding, locale) ??
      finaleCopy(FINALE_COPY.location, locale),
    companyColumn,
    socials: socialLinks(branding),
  };
}
