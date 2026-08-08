import { TravelLink } from '../motion/universe';
import {
  pickLocalized,
  type BrandingRecord,
  type Locale,
  type MenuTree,
} from '@sanad/contracts';
import type { Dictionary } from '../i18n/get-dictionary';
import { localizeHref } from '../lib/localize-href';
import {
  contactAddress,
  contactEmail,
  contactPhone,
  copyrightLine,
  socialLinks,
  FALLBACK_BRAND_NAME,
} from '../branding/company-info';

/**
 * The site footer (design-spec global chrome): brand + tagline, the admin-controlled footer
 * menu rendered as columns (top-level item = column title, its children = links), the
 * admin-controlled contact + social links, and the copyright. Server component, null-safe to
 * the leaf (F7) so an empty CMS/settings still renders brand + copyright.
 */
export function SiteFooter({
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
  const tagline = branding
    ? pickLocalized(branding.brand.tagline, locale)
    : dict.footer.tagline;
  const columns = menu?.items ?? [];
  const socials = socialLinks(branding);
  const email = contactEmail(branding);
  const phone = contactPhone(branding);
  const address = contactAddress(branding, locale);
  const hasContact = Boolean(email || phone || address);

  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <TravelLink href={`/${locale}`} className="site-brand">
          <span>{brandName}</span>
        </TravelLink>
        <span className="site-footer-tagline">{tagline}</span>
      </div>

      {columns.length > 0 || hasContact ? (
        <div className="site-footer-cols">
          {columns.map((column) => (
            <div key={column.id} className="site-footer-col">
              <span className="site-footer-col-title">
                {pickLocalized(column.label, locale)}
              </span>
              {column.children.map((link) => (
                <TravelLink
                  key={link.id}
                  href={localizeHref(link.url, locale)}
                  className="site-footer-link"
                >
                  {pickLocalized(link.label, locale)}
                </TravelLink>
              ))}
            </div>
          ))}

          {hasContact ? (
            <div className="site-footer-col">
              <span className="site-footer-col-title">
                {dict.footer.contact}
              </span>
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="site-footer-link site-footer-ltr"
                >
                  {email}
                </a>
              ) : null}
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="site-footer-link site-footer-ltr"
                >
                  {phone}
                </a>
              ) : null}
              {address ? (
                <span className="site-footer-address">{address}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {socials.length > 0 ? (
        <nav className="site-footer-social" aria-label={dict.footer.social}>
          {socials.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="site-footer-social-link"
              target="_blank"
              rel="noreferrer noopener"
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="site-footer-copy">
        {copyrightLine(branding, locale, dict.footer.rights, brandName)}
      </div>
    </footer>
  );
}
