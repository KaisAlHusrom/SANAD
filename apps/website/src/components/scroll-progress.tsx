'use client';

import { useEffect, useState } from 'react';

/**
 * The restrained 2px top scroll-progress bar (design-spec global chrome). Scroll-LINKED,
 * never scroll-jacked (WEB10): it only reads scroll position and sets its own width. Honors
 * reduced motion via CSS (the bar still tracks; only its transition is removed). RTL-correct
 * — it grows from `inset-inline-start` (right under RTL) via the stylesheet.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, ratio)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      className="scroll-progress"
      // runtime scroll value — a genuine data-driven width, not a design literal (U6 carve-out)
      style={{ inlineSize: `${progress * 100}%` }}
      aria-hidden="true"
    />
  );
}
