'use client';

import { usePathname } from 'next/navigation';
import { getDictionary } from '../../src/i18n';
import { isLocale } from '../../src/i18n/locale-route';
import { SystemStage } from '../../src/motion/universe/components/system-stage';

/**
 * Route-level error boundary (F2/F3). Reads the locale from the path so the message + retry
 * are localized; `reset` re-renders the segment.
 */
export default function RouteError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const segment = (usePathname() || '/ar').split('/')[1] ?? 'ar';
  const dict = getDictionary(isLocale(segment) ? segment : 'ar');

  return (
    <SystemStage system="ambient">
      <div className="site-content">
        <div className="site-state" role="alert">
          <h2 className="site-page-title">{dict.states.error}</h2>
          <button type="button" className="site-ghost" onClick={() => reset()}>
            {dict.states.retry}
          </button>
        </div>
      </div>
    </SystemStage>
  );
}
