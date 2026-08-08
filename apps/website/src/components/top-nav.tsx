import { TravelLink } from '../motion/universe';
import {
  pickLocalized,
  type BrandingRecord,
  type Locale,
  type MenuTree,
} from '@sanad/contracts';
import type { Dictionary } from '../i18n/get-dictionary';
import { localizeHref } from '../lib/localize-href';
import { FALLBACK_BRAND_NAME } from '../branding/company-info';
import { LocaleSwitch } from './locale-switch';

/**
 * The fixed top nav (design-spec global chrome): the brand logo (settings `logoUrl` override →
 * the bundled `/brand/logo.png` wordmark, same asset family as the admin shell — rendered as an
 * image like the dashboard, owner decision 2026-07-07), the admin-controlled primary menu links,
 * the locale switch, and the accent CTA pill → contact. Server component (WEB2) — no
 * interactivity beyond the client locale switch. Defined once at the shell level (F10);
 * branding/menu are null-safe (F7). The sound toggle was REMOVED and the audio layer unmounted
 * (owner decision 2026-07-07 — sound off, not user-enableable).
 */
export function TopNav({
  locale,
  dict,
  branding,
  menu,
}: {
  locale: Locale;
  dict: Dictionary;
  branding: BrandingRecord | null;
  menu: MenuTree | null;
}) {
  const brandName = branding
    ? pickLocalized(branding.brand.name, locale)
    : FALLBACK_BRAND_NAME[locale];
  // settings logo wins when set (WEB1); the bundled wordmark is the coded default (F7/U9)
  const logoSrc = branding?.logoUrl ?? '/brand/logo.png';
  const items = menu?.items ?? [];
  // Coded-default primary links (F7), shown when the CMS menu is empty so the nav is never
  // link-less. `nav.*` order from content-defaults.md §brand/global. `خدماتنا`/`من نحن`/`أعمالنا`/
  // `آلية العمل`/`المدوّنة` all route to their real pages (8.C/8.E/8.E-2/8.E-3) as flight links.
  const defaultLinks: { href: string; label: string }[] = [
    {
      href: `/${locale}/services`,
      label: locale === 'ar' ? 'خدماتنا' : 'Services',
    },
    { href: `/${locale}/about`, label: locale === 'ar' ? 'من نحن' : 'About' },
    {
      href: `/${locale}/portfolio`,
      label: locale === 'ar' ? 'أعمالنا' : 'Work',
    },
    {
      href: `/${locale}/process`,
      label: locale === 'ar' ? 'آلية العمل' : 'Process',
    },
    { href: `/${locale}/blog`, label: locale === 'ar' ? 'المدوّنة' : 'Blog' },
    {
      href: `/${locale}/faq`,
      label: locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ',
    },
  ];
  return (
    <nav className="site-nav" aria-label={brandName}>
      {/* the logo image IS the brand (like the admin shell) — the name rides in alt/aria */}
      <TravelLink href={`/${locale}`} className="site-brand">
        <img className="site-brand-mark" src={logoSrc} alt={brandName} />
      </TravelLink>

      {items.length > 0 ? (
        <div className="site-nav-links">
          {items.map((item) => (
            <TravelLink
              key={item.id}
              href={localizeHref(item.url, locale)}
              className="site-nav-link"
            >
              {pickLocalized(item.label, locale)}
            </TravelLink>
          ))}
        </div>
      ) : (
        <div className="site-nav-links">
          {defaultLinks.map((link) =>
            link.href.startsWith('#') ? (
              <a key={link.href} href={link.href} className="site-nav-link">
                {link.label}
              </a>
            ) : (
              <TravelLink
                key={link.href}
                href={link.href}
                className="site-nav-link"
              >
                {link.label}
              </TravelLink>
            ),
          )}
        </div>
      )}

      <div className="site-nav-actions">
        <LocaleSwitch locale={locale} label={dict.language.switch} />
        <TravelLink href={`/${locale}/request-a-project`} className="site-cta">
          {dict.cta.startProject}
        </TravelLink>
      </div>
    </nav>
  );
}
