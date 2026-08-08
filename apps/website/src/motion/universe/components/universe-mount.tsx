'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useCosmosScrollStore } from '../../scroll';
import { isTouchDevice, prefersReducedMotion } from '../../reduced-motion';
import { useFlightDirector } from '../hooks/use-flight-director';

/**
 * THE persistent universe layer (P8.D — supersedes the landing-only `CosmosMount`): a fixed
 * full-viewport layer behind every page, mounted once in the locale layout so the WebGL
 * renderer + starfield + bloom SURVIVE route changes — that persistence is what makes the
 * comet flight between systems seamless. Renders the static token-coloured glow fallback on
 * the server + first client paint (no hydration mismatch; `.cosmos-fallback` tints itself
 * from the route-driven `--web-accent`), then upgrades to the lazy WebGL canvas after mount
 * ONLY on a desktop, fine-pointer, motion-allowing viewport (WEB4/WEB10). Never captures
 * pointer events — pages scroll natively over it.
 */
const UniverseCanvas = dynamic(() => import('./universe-canvas'), {
  ssr: false,
});

export function UniverseMount({ dir = 1 }: { dir?: 1 | -1 }) {
  const store = useCosmosScrollStore();
  const director = useFlightDirector();
  const [canvas, setCanvas] = useState(false);
  // GPU context lost (driver reset, tab pressure): fall back to the static layer for good —
  // flights keep working through the CSS TravelVeil, which runs off the same director state
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const small = window.matchMedia('(max-width: 768px)').matches;
    if (!prefersReducedMotion() && !isTouchDevice() && !small) setCanvas(true);
  }, []);

  return (
    <div className="cosmos-layer" aria-hidden="true">
      {canvas && !contextLost && store && director ? (
        <UniverseCanvas
          store={store}
          director={director}
          dir={dir}
          onContextLost={() => setContextLost(true)}
        />
      ) : (
        <div className="cosmos-fallback" />
      )}
    </div>
  );
}
