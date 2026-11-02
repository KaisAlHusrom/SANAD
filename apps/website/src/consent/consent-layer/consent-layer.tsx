'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Locale } from '@sanad/contracts';
import { ConsentBar } from '../consent-bar/consent-bar';
import { ConsentDialog } from '../consent-dialog/consent-dialog';
import type { ConsentCopy } from '../types/consent-copy.types';
import { useConsentUi } from '../use-consent-ui/use-consent-ui';

interface ConsentLayerProps {
  copy: ConsentCopy;
  locale: Locale;
}

/**
 * The one thing the layout mounts for consent, and the one owner of the overlay.
 *
 * It is a direct child of the shell rather than of the page: inside `.site-main`/`.page-stage` the
 * bar would go `visibility: hidden` during every comet flight, and inside `.lp-content` it would
 * be trapped in that element's z-10 stacking context.
 */
export function ConsentLayer({ copy, locale }: ConsentLayerProps) {
  const pathname = usePathname();
  const { closeDialog } = useConsentUi();

  // A policy link inside the dialog navigates the site. Leaving the dialog open over the page it
  // just sent the visitor to would hide the very notice they went to read.
  useEffect(() => {
    closeDialog();
  }, [pathname, closeDialog]);

  return (
    <>
      <ConsentBar copy={copy} locale={locale} />
      <ConsentDialog copy={copy} locale={locale} />
    </>
  );
}
