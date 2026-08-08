import { pageAccents, universeSystems } from '@sanad/config';
import type { ColorTriplet } from '../../cosmos/types';
import { hexToTriplet } from '../../cosmos/worlds';
import type { SystemId } from '../types';

function mapSystems(
  pick: (key: SystemId) => string,
): Record<SystemId, ColorTriplet> {
  const entries = (Object.keys(universeSystems) as SystemId[]).map(
    (key) => [key, hexToTriplet(pick(key))] as const,
  );
  return Object.fromEntries(entries) as Record<SystemId, ColorTriplet>;
}

/**
 * Per-system deep-space fog + accent light as raw-linear triplets (WEB11 pipeline inputs),
 * derived once from the token single source (U3/U6). The flight rig crossfades between the
 * from/to entries; the traveler comet tints with the accents.
 */
export const SYSTEM_FOGS: Record<SystemId, ColorTriplet> = mapSystems(
  (key) => universeSystems[key].fog,
);

export const SYSTEM_ACCENTS: Record<SystemId, ColorTriplet> = mapSystems(
  (key) => pageAccents[universeSystems[key].accent].accent,
);
