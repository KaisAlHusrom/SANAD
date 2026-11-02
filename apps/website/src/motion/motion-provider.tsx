'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, isTouchDevice } from './reduced-motion';
import {
  CosmosScrollContext,
  createCosmosScrollStore,
  clampScrollTarget,
  keyScrollDelta,
  normalizeWheelDelta,
  scrollLead,
  scrollLock,
  shouldDriveScroll,
  stepCappedScroll,
  MAX_SCROLL_SPEED,
} from './scroll';

/** Largest per-frame dt we trust for the scroll stepper (reference cap — a stalled tab shouldn't leap). */
const MAX_FRAME_DT = 0.05;
/** A move larger than this between our own writes means something external scrolled us — re-sync. */
const EXTERNAL_SCROLL_EPSILON = 2;

/**
 * The website's motion root (WEB3/WEB4). Drives a **speed-capped smooth scroll** (WS4 —
 * "constant-speed catch-up", ported from the reference) off the **GSAP** ticker so ScrollTrigger
 * pins/scrubs stay in sync, wraps the tree in `<MotionConfig reducedMotion="user">` so every Framer
 * Motion reveal honors the OS setting automatically, and owns the one **`CosmosScrollStore`** —
 * feeding it global scroll progress + cursor parallax, which the R3F cosmos reads per-frame and the
 * DOM overlays subscribe to. The capped scroller advances the **real** `window.scrollY` toward a
 * wheel/keyboard/anchor-fed target at a hard px/second ceiling, so a violent flick can never skip a
 * planet (the scene glides through every world) — and because the real scroll stays the single time
 * base, DOM + WebGL never desync. Desktop only; **gated behind `prefers-reduced-motion`** (touch +
 * reduce-motion keep native scroll) — under reduce-motion a native `scroll` listener still feeds
 * progress (static cosmos fallback) while velocity/warp/cursor stay 0. Mounted once at the shell.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef(createCosmosScrollStore());

  useEffect(() => {
    const store = storeRef.current;
    const reduced = prefersReducedMotion();
    store.setReducedMotion(reduced);

    const pageProgress = (): number => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      return scrollable > 0 ? window.scrollY / scrollable : 0;
    };

    // capped smooth scroll is desktop-only: touch devices (coarse pointer) keep their native
    // momentum scrolling, and reduce-motion keeps native scroll (WEB4)
    const touch = isTouchDevice();
    const capped = !reduced && !touch;

    if (!capped) {
      // native scroll (reduced-motion or touch); progress still drives the cosmos / static fallback
      const onScroll = () => store.setProgress(pageProgress());
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }

    gsap.registerPlugin(ScrollTrigger);

    const maxY = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const lead = scrollLead(MAX_SCROLL_SPEED);
    let cur = window.scrollY;
    let target = cur;
    let lastSetY = cur;
    let lastTime = 0;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // leave pinch-zoom alone
      // BEFORE preventDefault, deliberately: handing the wheel back to the browser is what lets an
      // open overlay's own body scroll natively while `overflow: hidden` freezes the page behind it.
      if (scrollLock.isLocked()) return;
      e.preventDefault();
      const d = normalizeWheelDelta(e.deltaY, e.deltaMode, window.innerHeight);
      target = clampScrollTarget(target + d, cur, lead, maxY());
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (scrollLock.isLocked()) return;
      // Not a tag check: the control that must keep Space is a <button>, and Space is one of the
      // keys this scroller drives — so a bare tag exemption silently broke every button on the site.
      if (!shouldDriveScroll(e.key, e.target as Element | null)) return;
      if (e.key === 'Home') {
        e.preventDefault();
        target = 0;
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        target = maxY();
        return;
      }
      const d = keyScrollDelta(e.key, window.innerHeight);
      if (d === null) return;
      e.preventDefault();
      target = clampScrollTarget(target + d, cur, lead, maxY());
    };

    // nav / in-page anchors glide there at the same capped pace
    const onAnchorClick = (e: MouseEvent) => {
      if (scrollLock.isLocked()) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      );
      if (!anchor) return;
      const id = anchor.getAttribute('href')?.slice(1);
      const dest = id ? document.getElementById(id) : null;
      if (!dest) return;
      e.preventDefault();
      target = Math.min(
        Math.max(dest.getBoundingClientRect().top + cur, 0),
        maxY(),
      );
    };

    // if the page moved by something other than our capped stepper (scrollbar drag, browser
    // find, hash restore), adopt it so we don't fight it; always feed progress + ScrollTrigger
    const onScroll = () => {
      if (Math.abs(window.scrollY - lastSetY) > EXTERNAL_SCROLL_EPSILON) {
        cur = target = lastSetY = window.scrollY;
      }
      ScrollTrigger.update();
      store.setProgress(pageProgress());
    };

    const onTick = (time: number) => {
      const dt = lastTime ? Math.min(MAX_FRAME_DT, time - lastTime) : 0.016;
      lastTime = time;
      const next = stepCappedScroll(cur, target, dt, MAX_SCROLL_SPEED);
      if (next !== cur) {
        cur = next;
        lastSetY = cur;
        window.scrollTo(0, cur);
      }
    };

    // While an overlay held the lock the page could still move under it (a scrollbar drag, browser
    // find). `onScroll`'s epsilon adoption would only catch that on the next scroll event, so the
    // first wheel tick after closing would jump from a stale target — resync the moment it releases.
    const offScrollLock = scrollLock.subscribe(() => {
      if (!scrollLock.isLocked()) cur = target = lastSetY = window.scrollY;
    });

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onAnchorClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    store.setProgress(pageProgress());

    // cursor parallax (desktop, fine pointer only) — normalized to −1..1
    const onPointerMove = (e: PointerEvent) => {
      store.setCursor(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      offScrollLock();
      gsap.ticker.remove(onTick);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onAnchorClick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <CosmosScrollContext.Provider value={storeRef.current}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </CosmosScrollContext.Provider>
  );
}
