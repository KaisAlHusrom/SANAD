'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../../motion/reduced-motion';
import {
  chapterItemReveal,
  chapterVeilOpacity,
} from '../../../motion/cosmos/math';

/**
 * A sticky "chapter" (WEB10) — wraps a section in a tall docking stage so it pins at the viewport
 * while the flight passes its world, and its content items **arc out of the docked planet, staggered,
 * revealed only after the world docks** (the reference `chapterReveal`, driven by one GSAP
 * ScrollTrigger). This is a SINGLE scroll-linked reveal — the section no longer wraps content in an
 * in-view Framer fade (that raced this transform and caused content to flash in early, vanish, then
 * reappear). Each `.lp-flow` item inside the stage is driven by the pure `chapterItemReveal`; the
 * process/works sections drive their own bespoke systems (moons / orbit) and mark only their heading
 * `.lp-flow`. Under reduced-motion / SSR the items stay visible (no JS runs). Every chapter `exit`s
 * by default — content draws back up into the world's light IN SYNC with the planet's departure
 * (presence exit window 0.84→1; reveal exit 0.82→0.985) so a section never lingers after its world
 * has gone (owner fix 2026-07-07 #5). Transform/opacity/filter only, 60fps; scroll-linked, never
 * jacked.
 */
export function ChapterStage({
  children,
  minHeightVh,
  id,
  exit = true,
}: {
  children: ReactNode;
  minHeightVh: number;
  id?: string;
  exit?: boolean;
}) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const chapter = chapterRef.current;
    const stage = stageRef.current;
    if (!chapter || !stage) return;

    chapter.style.minBlockSize = `${minHeightVh}vh`;
    const items = Array.from(stage.querySelectorAll<HTMLElement>('.lp-flow'));
    // ambient dressing (scrims/glows/rings) that must live ONLY while the content does — a static
    // full-opacity scrim inside a tall chapter otherwise shows before the section and lingers after
    // it (owner fix 2026-07-07, CTA veil)
    const veils = Array.from(
      stage.querySelectorAll<HTMLElement>('[data-chapter-veil]'),
    );
    if (items.length === 0) return; // section drives its own reveal (process moons / works orbit)
    const n = items.length;
    items.forEach((el) => {
      el.style.willChange = 'transform, opacity, filter';
      el.style.backfaceVisibility = 'hidden';
    });
    veils.forEach((el) => {
      el.style.willChange = 'opacity';
    });

    gsap.registerPlugin(ScrollTrigger);
    const apply = (local: number) => {
      items.forEach((el, i) => {
        const f = chapterItemReveal(i, n, local, exit);
        el.style.opacity = f.opacity.toFixed(3);
        el.style.transform = `perspective(1300px) translate3d(${f.tx.toFixed(1)}px,${f.ty.toFixed(
          1,
        )}px,${f.tz.toFixed(0)}px) rotate(${f.rot.toFixed(2)}deg) scale(${f.scale.toFixed(3)})`;
        el.style.filter =
          f.blur > 0.3 ? `blur(${f.blur.toFixed(1)}px)` : 'none';
      });
      const veil = chapterVeilOpacity(local).toFixed(3);
      veils.forEach((el) => {
        el.style.opacity = veil;
      });
    };
    apply(0); // start hidden (below the dock gate) — no pre-show flash

    const trigger = ScrollTrigger.create({
      trigger: chapter,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => apply(self.progress),
    });

    // Sync to the ACTUAL scroll position immediately. `scrub`'s `onUpdate` only fires while scrolling,
    // so on load — or after a restored / non-top scroll — the items would otherwise sit at `apply(0)`
    // no matter where the chapter actually is.
    apply(trigger.progress);

    // Safety: if the scrubbed reveal ever stalls, RE-SYNC to the trigger's real progress. This used to
    // force every on-screen HIDDEN item to opacity 1 — but a chapter's content is *legitimately*
    // hidden while it is on screen yet its world has not docked (the reveal gate is `local ≥ 0.30`).
    // So the blind force flashed the content in early, the scroll reveal then hid it, and the dock
    // re-revealed it — the "appears before the planet, disappears, reappears" bug. Re-applying the
    // trigger's real progress shows content only where it should be, and still rescues a true stall.
    const safety = window.setTimeout(() => apply(trigger.progress), 2800);

    return () => {
      window.clearTimeout(safety);
      trigger.kill();
      chapter.style.minBlockSize = '';
      for (const el of items) {
        el.style.opacity = '';
        el.style.transform = '';
        el.style.filter = '';
        el.style.willChange = '';
        el.style.transition = '';
      }
      for (const el of veils) {
        el.style.opacity = '';
        el.style.willChange = '';
      }
    };
  }, [minHeightVh, exit]);

  return (
    <div ref={chapterRef} id={id} className="lp-chapter" data-chapter={id}>
      <div ref={stageRef} className="lp-stage">
        <div className="lp-stage-flow">{children}</div>
      </div>
    </div>
  );
}
