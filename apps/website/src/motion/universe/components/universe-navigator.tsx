'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { resolveSystem } from '../math/resolve-system';
import { useFlightDirector } from '../hooks/use-flight-director';

/**
 * The single place flights and the Next.js router meet (P8.D). Mounted once in the layout:
 *
 * - **Push at cruise entry** — the old page departs fully intact, the RSC fetch/stream hides
 *   inside the tunnel, and a retargeted flight pushes its new href exactly once too.
 * - **popstate recovery** — back/forward swaps the DOM before we hear about it, so an idle
 *   pathname change plays a RECOVERY flight (no departure, token cruise, real arrival); a
 *   mid-flight external pathname change retargets the same way.
 * - **Scroll reset at arrival entry** — the push happens while the stage is hidden, so
 *   Next's own scroll-to-top can be skipped/raced (the smooth scroller adopts whatever
 *   survives) and the new system would open mid-page. The content is still at opacity 0
 *   when arrival begins, so a hard `scrollTo(0, 0)` here is invisible and deterministic:
 *   every destination starts from its beginning (owner report 2026-07-09). Recovery
 *   flights are exempt — back/forward keeps the browser's own scroll restoration.
 * - **Skip** — Escape or any click during a flight fast-forwards it (capture phase, so a
 *   click on another TravelLink still retargets right after).
 */
export function UniverseNavigator() {
  const director = useFlightDirector();
  const router = useRouter();
  const pathname = usePathname();
  const lastPushed = useRef<string | null>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (!director) return undefined;
    const offCruise = director.onPhase('cruise', (state) => {
      const href = state.pendingHref;
      if (href && lastPushed.current !== href) {
        lastPushed.current = href;
        router.push(href);
      }
    });
    const offArrival = director.onPhase('arrival', (state) => {
      if (state.plan?.kind !== 'recovery') window.scrollTo(0, 0);
    });
    const offIdle = director.onPhase('idle', () => {
      lastPushed.current = null;
    });
    return () => {
      offCruise();
      offArrival();
      offIdle();
    };
  }, [director, router]);

  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;
    if (!director || !pathname || pathname === prev) return;
    const state = director.getState();
    if (state.phase !== 'idle') {
      // our own cruise push lands here with pathname === pendingHref — nothing to do;
      // anything else is a browser-driven swap mid-flight → retarget as recovery
      if (state.pendingHref && pathname !== state.pendingHref) {
        director.depart({
          href: pathname,
          to: resolveSystem(pathname),
          recovery: true,
        });
      }
      return;
    }
    const to = resolveSystem(pathname);
    if (to.system === state.currentSystem && to.slug === state.currentSlug)
      return;
    director.depart({ href: pathname, to, recovery: true });
  }, [pathname, director]);

  useEffect(() => {
    if (!director) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && director.getState().phase !== 'idle') {
        director.skip();
      }
    };
    const onClick = () => {
      if (director.getState().phase !== 'idle') director.skip();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick, true);
    };
  }, [director]);

  return null;
}
