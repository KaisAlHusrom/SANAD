import '@sanad/web-ui/web-ui.css';
import '../../src/styles/site-chrome.css';
import '../../src/styles/landing.css';
import '../../src/styles/marketing.css';
import '../../src/styles/universe.css';
import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { LOCALES, pickLocalized, type Locale } from '@sanad/contracts';
import { WebsiteShell } from '@sanad/web-ui';
import { dirForLocale, isLocale } from '../../src/i18n/locale-route';
import { getDictionary } from '../../src/i18n';
import { getBranding } from '../../src/data/branding';
import { getMenu } from '../../src/data/menus';
import { brandingToCssVars } from '../../src/branding/branding-to-css-vars';
import {
  shareImageUrl,
  siteUrl,
  twitterHandle,
  FALLBACK_BRAND_NAME,
} from '../../src/branding/company-info';
import { OrganizationJsonLd } from '../../src/branding/organization-json-ld';
import { TopNav } from '../../src/components/top-nav';
import { SiteFooter } from '../../src/components/site-footer';
import { ScrollProgress } from '../../src/components/scroll-progress';
import { MotionProvider } from '../../src/motion/motion-provider';
import { InkCursor } from '../../src/motion/ink-cursor';
import {
  AccentStyle,
  PageStage,
  TravelVeil,
  UniverseMount,
  UniverseNavigator,
  UniverseProvider,
} from '../../src/motion/universe';

// Self-hosted variable fonts (WEB perf): Arabic display/text + Latin mono. Next subsets +
// `display: swap` automatically. The generated family names feed the `--web-*` font vars.
const plexSans = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export function generateStaticParams(): Array<{ locale: Locale }> {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const branding = await getBranding().catch(() => null);
  const name = branding
    ? pickLocalized(branding.brand.name, locale as Locale)
    : FALLBACK_BRAND_NAME[locale as Locale];
  const tagline = branding
    ? pickLocalized(branding.brand.tagline, locale as Locale)
    : '';

  // Site-wide SEO from the admin settings; each PAGE still overrides title/description from its
  // own CMS `metaTitle`/`metaDescription` (the pages builder). Every leg is optional — an unset
  // site url simply omits canonical/OG-absolute handling rather than emitting a broken tag (F7).
  const origin = siteUrl(branding);
  const share = shareImageUrl(branding);
  const handle = twitterHandle(branding);
  const localePath = `/${locale}`;

  return {
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    title: { default: name, template: `%s — ${name}` },
    description: tagline,
    ...(origin ? { alternates: { canonical: localePath } } : {}),
    openGraph: {
      type: 'website',
      siteName: name,
      title: name,
      description: tagline,
      locale,
      ...(origin ? { url: localePath } : {}),
      ...(share ? { images: [{ url: share }] } : {}),
    },
    twitter: {
      card: share ? 'summary_large_image' : 'summary',
      title: name,
      description: tagline,
      ...(handle ? { site: handle, creator: handle } : {}),
      ...(share ? { images: [share] } : {}),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  // Degrade gracefully (F7) — coded defaults render the chrome even if the gateway is down.
  const [branding, primaryMenu, footerMenu] = await Promise.all([
    getBranding().catch(() => null),
    getMenu('primary').catch(() => null),
    getMenu('footer').catch(() => null),
  ]);

  const themeVars = {
    ...brandingToCssVars(branding),
    '--web-sans': plexSans.style.fontFamily,
    '--web-mono': plexMono.style.fontFamily,
  } as CSSProperties;
  // RTL flips the sign of the universe orbit + sway (WEB6): ltr = +1, rtl (ar) = −1
  const dir: 1 | -1 = locale === 'ar' ? -1 : 1;

  return (
    <html lang={locale} dir={dirForLocale(locale)}>
      <body>
        {/* P8.D one-universe: the accent is per-route — resolved by AccentStyle's
            :has([data-system]) rules off each page's SystemStage marker, so the shell
            must NOT inline an accent (inline would beat the route rules by cascade). */}
        <WebsiteShell
          locale={locale}
          pageAccent="route"
          className="site-shell"
          style={themeVars}
        >
          <AccentStyle />
          <OrganizationJsonLd branding={branding} locale={locale} />
          {/* MotionProvider wires Lenis ↔ GSAP + MotionConfig (WEB3/WEB4); it passes server
              children through untouched, so the pages stay server-rendered (WEB2). */}
          {/* The WEB8 AudioProvider is UNMOUNTED (owner decision 2026-07-07): the site ships
              silent and sound is not user-enableable. The audio layer stays in src/motion/audio
              for a future re-enable. */}
          <MotionProvider>
            {/* P8.D one-universe: THE persistent WebGL layer + flight director live at the
                layout so they survive route changes — every page idles in its own star
                system and navigation is a comet flight between them. */}
            <UniverseProvider>
              <UniverseMount dir={dir} />
              <TravelVeil />
              <UniverseNavigator />
              <ScrollProgress />
              <InkCursor />
              <TopNav
                locale={locale}
                dict={dict}
                branding={branding}
                menu={primaryMenu}
              />
              <main className="site-main">
                <PageStage>{children}</PageStage>
              </main>
              <SiteFooter
                locale={locale}
                dict={dict}
                branding={branding}
                menu={footerMenu}
              />
            </UniverseProvider>
          </MotionProvider>
        </WebsiteShell>
      </body>
    </html>
  );
}
