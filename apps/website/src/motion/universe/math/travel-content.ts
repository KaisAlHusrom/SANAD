import { smoothstep } from '../../cosmos/math';
import type { FlightPhase } from '../types';

/** What the DOM content should be doing right now (driven onto CSS vars by `PageStage`). */
export interface TravelContentPose {
  /** 0→1 exit progress of the outgoing page's content. */
  out: number;
  /** 0→1 enter progress of the incoming page's content. */
  in: number;
  /** Hard-hidden (the cruise) — the streamed-in new page must never flash early. */
  hidden: boolean;
}

/** The content exit/enter progress per phase — eased here so CSS stays linear in the var. */
export function travelContent(
  phase: FlightPhase,
  t: number,
): TravelContentPose {
  if (phase === 'departure') {
    return { out: smoothstep(0, 1, t), in: 0, hidden: false };
  }
  if (phase === 'cruise') return { out: 1, in: 0, hidden: true };
  if (phase === 'arrival') {
    return { out: 1, in: smoothstep(0, 1, t), hidden: false };
  }
  return { out: 0, in: 1, hidden: false };
}
