'use client';

import type { Locale } from '@sanad/contracts';
import {
  WorkCard,
  type WorkCardData,
  type WorkCardLabels,
  type WorkCardLink,
  worksFrontIndex,
  worksOrbitTransform,
} from '@sanad/web-ui';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { localizeHref } from '../../lib/localize-href';
import { TravelLink } from '../../motion/universe';
import { chapterItemReveal } from '../../motion/cosmos/math';
import { cardTilt, normalizedInCard } from '../../motion/card-tilt';
import { prefersReducedMotion } from '../../motion/reduced-motion';

/** Build the orbit's case-study link — the comet-flight `TravelLink`, locale-prefixed to
 *  `/portfolio/<slug>`. Owned by this client module (never passed from the server) — RSC-safe. */
function makeCardLink(locale: Locale): WorkCardLink {
  return function OrbitCardLink({ slug, className, children }) {
    return (
      <TravelLink
        href={localizeHref(`/portfolio/${slug}`, locale)}
        className={className}
        prefetch={false}
      >
        {children}
      </TravelLink>
    );
  };
}

/** Orbit radius: a fraction of the viewport, capped — the reference `min(innerWidth*0.34, 460)`. */
function orbitRadius(): number {
  if (typeof window === 'undefined') return 400;
  return Math.min(window.innerWidth * 0.34, 460);
}

/**
 * The website's LIVE works orbit — the injected `Orbit` for the shared `WorksSection`
 * (`mode='live'`). It renders the SAME shared `WorkCard`s (single source, byte-identical to the
 * admin static figure) and layers the WEB10 motion on top, driven by SELECTOR over the rendered
 * cards (`[data-orbit-card]` / `[data-orbit-tilt]`, in document = collection order) so no card DOM
 * is duplicated: while the section is **pinned**, scroll progress (0→1) scrubs the ring one full
 * turn (front card large/sharp/clickable, back cards shrink/blur/recede); a mono `NN / NN` counter
 * names the front card; the heading reveals with the docked planet and exits with it. RTL reverses
 * the spin via `dir` (WEB6). Reduced-motion / no-JS keep the static grid (WEB4).
 */
export function WorksOrbit({
  head,
  cards,
  labels,
  dir,
  locale,
}: {
  head: ReactNode;
  cards: WorkCardData[];
  labels: WorkCardLabels;
  dir: 1 | -1;
  locale: Locale;
}) {
  const CardLink = useMemo(() => makeCardLink(locale), [locale]);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const [orbiting, setOrbiting] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || cards.length === 0) return;
    const track = trackRef.current;
    const stage = stageRef.current;
    const orbit = orbitRef.current;
    const head = headRef.current;
    if (!track || !stage || !orbit) return;

    setOrbiting(true);
    // The `is-orbit` CSS grows the stage to a full 100vh pinned viewport, but that class only lands on
    // the NEXT React render — after this effect creates the pin below. GSAP reads + locks the stage's
    // height at pin time, so it would capture the pre-orbit 72vh clamp and its `overflow:hidden` would
    // slice the ring cards mid-card (their bottoms fall past the short clip box). Lock the intended full
    // viewport height inline NOW so the pin captures it. Reset on cleanup. (bugfix 2026-07-18)
    stage.style.blockSize = '100vh';
    const count = cards.length;
    const cardEls = [
      ...orbit.querySelectorAll<HTMLElement>('[data-orbit-card]'),
    ];
    const headItems = head
      ? [...head.querySelectorAll<HTMLElement>('.lp-flow')]
      : [];
    headItems.forEach((el) => {
      el.style.willChange = 'transform, opacity, filter';
      el.style.backfaceVisibility = 'hidden';
    });
    cardEls.forEach(
      (el) => (el.style.willChange = 'transform, opacity, filter'),
    );

    // the heading reveals with the docked world, ahead of the cards, and fades back out WITH the
    // leaving planet + cards (exit sync, owner fix 2026-07-07 #5)
    const headExit = (p: number) => {
      const t = Math.min(1, Math.max(0, (p - 0.84) / (0.97 - 0.84)));
      return 1 - t * t * (3 - 2 * t);
    };
    const applyHead = (p: number) => {
      const local = Math.min(p / 0.5, 1); // heading is fully in by the time the cards settle
      const stay = headExit(p);
      headItems.forEach((el, i) => {
        const f = chapterItemReveal(i, headItems.length, local);
        el.style.opacity = (f.opacity * stay).toFixed(3);
        el.style.transform = `perspective(1300px) translate3d(${f.tx.toFixed(1)}px,${(
          f.ty -
          (1 - stay) * 60
        ).toFixed(
          1,
        )}px,${f.tz.toFixed(0)}px) rotate(${f.rot.toFixed(2)}deg) scale(${f.scale.toFixed(3)})`;
        el.style.filter =
          f.blur > 0.3 ? `blur(${f.blur.toFixed(1)}px)` : 'none';
      });
    };
    // each card rides the ring; the transform composes with `--dir` centring (WEB6)
    const applyOrbit = (p: number) => {
      const radius = orbitRadius();
      cardEls.forEach((el, i) => {
        const t = worksOrbitTransform(i, count, p, radius, dir);
        el.style.transform = `translate(calc(-50% * var(--dir, 1)), -50%) translate(${t.x.toFixed(
          1,
        )}px, ${(-22 * t.depth).toFixed(1)}px) scale(${t.scale.toFixed(3)})`;
        el.style.opacity = t.opacity.toFixed(3);
        el.style.zIndex = String(t.zIndex);
        el.style.filter =
          t.blur > 0.3 ? `blur(${t.blur.toFixed(1)}px)` : 'none';
        el.style.pointerEvents = t.pointerEvents;
      });
    };
    // the mono NN/NN counter follows the card the ring holds at the front, fading with the cards
    const applyCounter = (p: number) => {
      const counter = counterRef.current;
      if (!counter) return;
      const front = worksFrontIndex(p, count, dir);
      counter.textContent = `${String(front + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
      counter.style.opacity = worksOrbitTransform(
        front,
        count,
        p,
        1,
        dir,
      ).opacity.toFixed(3);
    };

    // pointer tilt on the front (interactive) card — leans the inner wrapper toward the pointer
    const tiltEls = [
      ...orbit.querySelectorAll<HTMLElement>('[data-orbit-tilt]'),
    ];
    const onMove = (e: PointerEvent) => {
      const tilt = e.currentTarget as HTMLElement;
      const { nx, ny } = normalizedInCard(
        e.clientX,
        e.clientY,
        tilt.getBoundingClientRect(),
      );
      const v = cardTilt(nx, ny);
      tilt.style.transform = `perspective(760px) rotateX(${v.rx.toFixed(2)}deg) rotateY(${v.ry.toFixed(2)}deg)`;
    };
    const onLeave = (e: PointerEvent) => {
      (e.currentTarget as HTMLElement).style.transform = '';
    };
    tiltEls.forEach((el) => {
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
    });

    gsap.registerPlugin(ScrollTrigger);
    applyHead(0);
    applyOrbit(0);
    applyCounter(0);
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: `+=${count * 70}%`,
      pin: stage,
      scrub: 1,
      onUpdate: (self) => {
        applyHead(self.progress);
        applyOrbit(self.progress);
        applyCounter(self.progress);
      },
    });
    return () => {
      trigger.kill();
      stage.style.blockSize = '';
      tiltEls.forEach((el) => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
        el.style.transform = '';
      });
      [...headItems, ...cardEls].forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
        el.style.filter = '';
        el.style.willChange = '';
      });
    };
  }, [cards.length, dir]);

  return (
    <div
      ref={trackRef}
      className={`web-works-track${orbiting ? ' is-orbit' : ''}`}
      // runtime scroll span scaled to card count (U6 carve-out — not a design literal)
      style={
        orbiting ? { minBlockSize: `${cards.length * 70 + 100}vh` } : undefined
      }
    >
      <div ref={stageRef} className="web-works-stage">
        <div ref={headRef}>{head}</div>
        <div
          ref={orbitRef}
          className={`web-orbit ${orbiting ? 'web-orbit--live' : 'web-orbit--static'}`}
        >
          {cards.map((card) => (
            <WorkCard
              key={card.id}
              card={card}
              labels={labels}
              CardLink={CardLink}
            />
          ))}
        </div>
        <div
          ref={counterRef}
          className="web-orbit-counter web-ltr"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
