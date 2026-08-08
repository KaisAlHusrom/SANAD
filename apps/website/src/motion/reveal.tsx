import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Kept for call-site compatibility; stagger is now index-driven by the chapter reveal. */
  delayMs?: number;
  className?: string;
}

/**
 * A **scroll-reveal marker** (`.lp-flow`). It no longer runs its own in-view Framer fade — that raced
 * the chapter's scrubbed transform and made content flash in early, vanish, then reappear. Inside a
 * `ChapterStage` these items are driven as one scroll-linked system (the reference `chapterReveal`):
 * hidden until the world docks, then arced in staggered. Outside a chapter (the hero) the item is
 * simply visible (above the fold); `WordReveal` carries the hero's motion. Server-rendered (WEB2) —
 * a plain element, no client runtime here.
 */
export function Reveal({ children, className }: RevealProps) {
  return (
    <div className={className ? `lp-flow ${className}` : 'lp-flow'}>
      {children}
    </div>
  );
}
