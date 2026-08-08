'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { countUpValue } from './count-up';
import { prefersReducedMotion } from './reduced-motion';

const DURATION_MS = 1600;

/**
 * The animated stat counter — counts 0→`value` (eased) the first time it scrolls into view, then
 * holds. Reduced-motion renders `value` immediately (no animation, WEB4). `suffix` (e.g. `+`/`%`)
 * is appended verbatim. Western digits throughout (design-spec). Drives `requestAnimationFrame`
 * timestamps only — no `Date.now()` (N3-aligned).
 */
export function CountUpNumber({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const t = Math.min(1, (ts - startTs) / DURATION_MS);
      setDisplay(countUpValue(value, t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}
