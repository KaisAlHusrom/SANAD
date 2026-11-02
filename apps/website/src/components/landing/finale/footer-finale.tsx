'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Locale } from '@sanad/contracts';
import { prefersReducedMotion } from '../../../motion/reduced-motion';
import {
  emberSpec,
  footItemReveal,
  footerReveal,
} from '../../../motion/cosmos/math';
import { ConsentPreferencesLink } from '../../../consent/consent-preferences-link';
import type { ConsentPreferencesCopy } from '../../../consent/types';
import { FINALE_COPY, finaleCopy } from './finale-copy';
import { buildFinaleData, type FinaleData } from './finale-data';

/**
 * The footer finale (WEB10) — a fixed full-viewport "landing site" that rises from the crater as you
 * scroll the impact section: a static crater glow with a pulsing molten-heat layer, warm embers
 * drifting up, and the footer content (finale headline + CTA, then a four-column site map, then a
 * bottom bar) cascading in — each `[data-foot-item]` staggered by `footItemReveal` as the whole
 * finale's `footerReveal` opacity climbs. Ported from the reference footer. It reads the window
 * scroll against the `#impact` bounds each frame (runtime values, U6 carve-out). Under reduced-motion
 * it simply fades in with no embers/pulse (WEB4); RTL is handled by logical properties (U7). The
 * root scrolls internally on short viewports; pointer-events engage only once it's revealed.
 */

const EMBER_COUNT = 12;

/** In-page product anchors (glide via the capped scroller) + routed company/contact links. */
const PRODUCT: ReadonlyArray<{ href: string; ar: string; en: string }> = [
  { href: '#services', ar: 'الخدمات', en: 'Services' },
  { href: '#works', ar: 'الأعمال', en: 'Work' },
  { href: '#process', ar: 'آلية العمل', en: 'Process' },
];

export function FooterFinale({
  locale,
  data,
  consentCopy,
}: {
  locale: Locale;
  /** Derived server-side from settings + the footer menu; omitted → coded defaults (F7). */
  data?: FinaleData;
  /**
   * The site dictionary's consent slice, resolved by the page. NOT added to `FINALE_COPY`: the
   * chrome footer already carries this exact string, and a second catalog would drift (U3).
   */
  consentCopy?: ConsentPreferencesCopy;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<Array<HTMLElement | null>>([]);

  const content = useMemo(
    () => data ?? buildFinaleData(null, null, locale),
    [data, locale],
  );

  const embers = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }, (_, i) => ({
        i,
        spec: emberSpec(i, EMBER_COUNT),
      })),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    const impact = document.getElementById('impact');
    if (!root || !impact) return;

    const paint = (reveal: number) => {
      root.style.opacity = String(reveal);
      root.style.pointerEvents = reveal > 0.5 ? 'auto' : 'none';
      itemsRef.current.forEach((item, i) => {
        if (!item) return;
        const { opacity, translateY } = footItemReveal(i, reveal);
        item.style.opacity = String(opacity);
        item.style.transform = `translateY(${translateY}px)`;
      });
    };

    if (prefersReducedMotion()) {
      // simple opacity reveal tied to reaching the impact section, no ember/pulse
      const onScroll = () => {
        const seen =
          window.scrollY + window.innerHeight > impact.offsetTop + 200;
        paint(seen ? 1 : 0);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    let raf = 0;
    const tick = () => {
      paint(
        footerReveal(
          window.scrollY,
          impact.offsetTop,
          impact.offsetHeight,
          window.innerHeight,
        ),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setItem = (i: number) => (el: HTMLElement | null) => {
    itemsRef.current[i] = el;
  };

  return (
    <footer ref={rootRef} className="lp-finale">
      <div className="lp-finale-crater" aria-hidden="true" />
      <div className="lp-finale-heat" aria-hidden="true" />
      <div className="lp-finale-crater-rim" aria-hidden="true" />
      <div className="lp-finale-embers" aria-hidden="true">
        {embers.map(({ i, spec }) => (
          <span
            key={i}
            className={`lp-ember lp-ember--${spec.colorIndex}`}
            style={{
              insetInlineStart: `${((i * 8.3 + 5) % 88) + 6}%`,
              insetBlockEnd: `${spec.bottomPct}%`,
              inlineSize: `${spec.sizePx}px`,
              blockSize: `${spec.sizePx}px`,
              animationDelay: `${spec.delayS}s`,
              animationDuration: `${spec.durationS}s`,
            }}
          />
        ))}
      </div>

      <div className="lp-finale-inner">
        <div className="lp-finale-hero">
          <div
            ref={setItem(0)}
            data-foot-item
            className="lp-finale-mark"
            aria-hidden="true"
          >
            <span className="lp-finale-mark-ring" />
            <span className="lp-finale-mark-gem" />
          </div>
          <h2 ref={setItem(1)} data-foot-item className="lp-finale-title">
            {finaleCopy(FINALE_COPY.titleLead, locale)}
            <span className="lp-finale-title-accent">
              {finaleCopy(FINALE_COPY.titleAccent, locale)}
            </span>
          </h2>
          <p ref={setItem(2)} data-foot-item className="lp-finale-tagline">
            {finaleCopy(FINALE_COPY.tagline, locale)}
          </p>
          <a
            ref={setItem(3)}
            data-foot-item
            href={`/${locale}/request-a-project`}
            className="lp-cta lp-cta--primary lp-cta--lg"
          >
            {finaleCopy(FINALE_COPY.cta, locale)}
          </a>
        </div>

        <div ref={setItem(4)} data-foot-item className="lp-finale-cols">
          <div className="lp-finale-brand">
            <div className="lp-finale-brand-head">
              <span
                className="lp-finale-mark lp-finale-mark--sm"
                aria-hidden="true"
              >
                <span className="lp-finale-mark-ring" />
                <span className="lp-finale-mark-gem" />
              </span>
              <span className="lp-finale-brand-name">{content.brandName}</span>
            </div>
            <p className="lp-finale-blurb">{content.blurb}</p>
          </div>
          <div className="lp-finale-col">
            <div className="lp-finale-col-head">
              {finaleCopy(FINALE_COPY.colProduct, locale)}
            </div>
            <nav className="lp-finale-col-links">
              {PRODUCT.map((item) => (
                <a key={item.href} href={item.href}>
                  {locale === 'ar' ? item.ar : item.en}
                </a>
              ))}
            </nav>
          </div>
          <div className="lp-finale-col">
            <div className="lp-finale-col-head">
              {content.companyColumn.title}
            </div>
            <nav className="lp-finale-col-links">
              {content.companyColumn.links.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="lp-finale-col">
            <div className="lp-finale-col-head">
              {finaleCopy(FINALE_COPY.colContact, locale)}
            </div>
            <div className="lp-finale-col-links">
              {content.email ? (
                <a href={`mailto:${content.email}`} className="lp-finale-ltr">
                  {content.email}
                </a>
              ) : null}
              {content.address ? <span>{content.address}</span> : null}
              {content.socials.length > 0 ? (
                <span className="lp-finale-social">
                  {content.socials.map((link) => (
                    <a
                      key={link.key}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {link.label}
                    </a>
                  ))}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div ref={setItem(5)} data-foot-item className="lp-finale-bar">
          <span>{content.copyright}</span>
          <span className="lp-finale-bar-links">
            <a href={`/${locale}/privacy`}>
              {finaleCopy(FINALE_COPY.privacy, locale)}
            </a>
            <a href={`/${locale}/terms`}>
              {finaleCopy(FINALE_COPY.terms, locale)}
            </a>
            {/* The chrome footer is `display: none` wherever this finale renders, so without this
                the landing page would be the one route with no way to revisit a decision. */}
            {consentCopy ? <ConsentPreferencesLink copy={consentCopy} /> : null}
          </span>
        </div>
      </div>
    </footer>
  );
}
