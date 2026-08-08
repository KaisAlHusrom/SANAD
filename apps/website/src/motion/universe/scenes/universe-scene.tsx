'use client';

import { useRef, useSyncExternalStore, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCosmosScrollStore } from '../../scroll';
import {
  CosmosScene,
  Starfield,
  WarpStreaks,
  CosmosBloom,
} from '../../cosmos/scene';
import type { BloomHandle } from '../../cosmos/finale';
import { activeSystem } from '../math/active-system';
import { useFlightDirector } from '../hooks/use-flight-director';
import type { SystemId } from '../types';
import { AboutSystem } from './about-system';
import { BlogSystem } from './blog-system';
import { ContactSystem } from './contact-system';
import { DeepSpaceIdle } from './deep-space-idle';
import { FlightComet } from './flight-comet';
import { FlightRig } from './flight-rig';
import { ProcessSystem } from './process-system';
import { RequestSystem } from './request-system';
import { ServiceDetailSystem } from './service-detail-system';
import { ServicesSystem } from './services-system';
import { SystemVisibilityGroup } from './system-visibility';
import { WorksSystem } from './works-system';

function SystemScene({
  system,
  slug,
  dir,
  bloomRef,
}: {
  system: SystemId;
  slug: string | null;
  dir: 1 | -1;
  bloomRef: RefObject<BloomHandle | null>;
}) {
  switch (system) {
    case 'landing':
      return <CosmosScene dir={dir} bloomRef={bloomRef} />;
    case 'services':
      return <ServicesSystem dir={dir} />;
    case 'serviceDetail':
      return <ServiceDetailSystem slug={slug} dir={dir} />;
    case 'works':
      return <WorksSystem dir={dir} />;
    case 'contact':
      return <ContactSystem />;
    case 'about':
      return <AboutSystem />;
    case 'process':
      return <ProcessSystem />;
    case 'blog':
      return <BlogSystem />;
    case 'request':
      return <RequestSystem />;
    default:
      return <DeepSpaceIdle system="ambient" />;
  }
}

const noopSubscribe = () => () => undefined;

/**
 * The root inside the one persistent canvas (P8.D). Owns what EVERY system shares — the
 * scroll tick (priority −1, before all scene reads), the starfield the camera streams
 * through (visual continuity across a flight), the warp streaks, the traveler comet, the
 * flight rig and the single bloom composer — and mounts the active system's own scene
 * around them. The landing branch is the untouched `CosmosScene` content (WEB11 regression
 * guard). Scene swaps are rare React re-renders via `useSyncExternalStore` (idle system
 * changes + the departure→cruise handover); per-frame flight values never re-render React.
 */
export function UniverseScene({ dir }: { dir: 1 | -1 }) {
  const director = useFlightDirector();
  const store = useCosmosScrollStore();
  const bloomRef = useRef<BloomHandle | null>(null);

  const snapshot = useSyncExternalStore(
    director ? director.subscribe : noopSubscribe,
    () => {
      if (!director) return 'landing|';
      const active = activeSystem(director.getState());
      return `${active.system}|${active.slug ?? ''}`;
    },
    () => 'landing|',
  );
  const [system, slug] = snapshot.split('|') as [SystemId, string];

  // ONE tick per frame for the whole universe, before every reader (was CosmosScene's job)
  useFrame(() => {
    store?.tick();
  }, -1);

  return (
    <>
      <Starfield />
      <WarpStreaks />
      <FlightRig dir={dir} bloomRef={bloomRef} />
      <FlightComet dir={dir} />
      <SystemVisibilityGroup>
        <SystemScene
          system={system}
          slug={slug || null}
          dir={dir}
          bloomRef={bloomRef}
        />
      </SystemVisibilityGroup>
      <CosmosBloom bloomRef={bloomRef} />
    </>
  );
}
