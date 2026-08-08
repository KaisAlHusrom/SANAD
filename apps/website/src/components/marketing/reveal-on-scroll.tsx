'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealOnScrollProps {
  children: ReactNode;
  /** Stagger index → a small per-item delay (60–80ms cadence, capped). */
  index?: number;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'p';
  /**
   * `inview` (default) reveals when scrolled ~20% into view — right for below-the-fold
   * sections. `mount` reveals immediately on mount (no IntersectionObserver) — right for
   * ABOVE-the-fold hero content, which must never wait on a scroll signal to become visible.
   */
  trigger?: 'inview' | 'mount';
}

/**
 * The marketing-page reveal (WEB3/WEB4): a fade-up ≤24px, staggered by index. Standalone
 * marketing pages have no cosmos to scroll-link to, so this is a self-contained Framer motion.
 * `MotionConfig reducedMotion="user"` (from the layout's MotionProvider) makes Framer skip the
 * transform under `prefers-reduced-motion` → content is simply present (WEB4). Hero content uses
 * `trigger="mount"` so it animates in on load rather than depending on an in-view signal (which
 * a fast/headless load can miss, leaving above-the-fold content hidden). Transform/opacity only.
 */
export function RevealOnScroll({
  children,
  index = 0,
  className,
  as = 'div',
  trigger = 'inview',
}: RevealOnScrollProps) {
  const Tag = motion[as];
  const transition = {
    duration: 0.5,
    delay: Math.min(index * 0.07, 0.42),
    ease: [0.22, 1, 0.36, 1],
  };
  const target = { opacity: 1, y: 0 };
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      {...(trigger === 'mount'
        ? { animate: target }
        : { whileInView: target, viewport: { once: true, amount: 0.2 } })}
      transition={transition}
    >
      {children}
    </Tag>
  );
}
