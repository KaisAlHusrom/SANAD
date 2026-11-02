'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Locale } from '@sanad/contracts';
import { localizeHref } from '../../lib/localize-href';
import type { ConsentCopy } from '../types/consent-copy.types';
import { useConsent } from '../use-consent/use-consent';
import { useConsentUi } from '../use-consent-ui/use-consent-ui';

interface ConsentBarProps {
  copy: ConsentCopy;
  locale: Locale;
}

/**
 * The ask. A **non-blocking** bottom bar, never a modal gate (owner directive): nothing loads
 * before consent, so covering the page buys no protection and costs the first impression.
 *
 * Accept and reject are the SAME control with different words — same element, same class, same
 * size. Making accept a filled pill and reject a quiet link is the standard consent dark pattern,
 * and the spec asserts the class equality so a restyle cannot reintroduce it.
 *
 * Rises with the page; `MotionConfig reducedMotion="user"` at the motion root reduces the rise to
 * a fade on its own, so there is no `prefersReducedMotion()` branch here (WEB4). Vertical motion
 * also means there is no RTL sign to get wrong (WEB6).
 */
export function ConsentBar({ copy, locale }: ConsentBarProps) {
  const { status, policy, decide } = useConsent();
  const { openDialog } = useConsentUi();
  const barRef = useRef<HTMLElement>(null);

  // A fixed bottom bar sits ON TOP of whatever the page ends with — here, the footer's copyright
  // row, which became visible-but-unreachable. The height is measured rather than guessed because
  // it changes with the viewport, the locale, and whether the policy links render (U6's runtime-
  // data carve-out); `consent.css` spends it as bottom padding on the page's last band.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const root = document.documentElement;
    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize?.[0]?.blockSize ?? bar.offsetHeight;
      root.style.setProperty('--consent-bar-height', `${Math.ceil(height)}px`);
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--consent-bar-height');
    };
  }, [status]);

  if (status !== 'pending') return null;

  const privacy = policy.privacyPolicyPath;
  const cookies = policy.cookiePolicyPath;
  const hasLinks = Boolean(privacy) || Boolean(cookies);

  return (
    <motion.section
      ref={barRef}
      role="region"
      aria-label={copy.bar.label}
      className="consent-bar"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
    >
      <div className="consent-bar-inner">
        <div className="consent-bar-copy">
          <p className="consent-bar-title">{copy.bar.title}</p>
          <p className="consent-bar-body">{copy.bar.body}</p>
          {hasLinks ? (
            <p className="consent-bar-links">
              {privacy ? (
                <a href={localizeHref(privacy, locale)}>{copy.links.privacy}</a>
              ) : null}
              {cookies ? (
                <a href={localizeHref(cookies, locale)}>{copy.links.cookies}</a>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="consent-bar-actions">
          <button
            type="button"
            className="consent-action"
            onClick={() => decide({ analytics: true, marketing: true })}
          >
            {copy.bar.acceptAll}
          </button>
          <button
            type="button"
            className="consent-action"
            onClick={() => decide({ analytics: false, marketing: false })}
          >
            {copy.bar.rejectAll}
          </button>
          <button
            type="button"
            className="consent-tertiary"
            onClick={openDialog}
          >
            {copy.bar.customize}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
