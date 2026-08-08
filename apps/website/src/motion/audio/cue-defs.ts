import { landingWorldOrder } from '@sanad/config';

/**
 * The website's audible signature (WEB8/WEB9) — the single source of the sound layer's musical +
 * mix constants, the audio analog of `@sanad/config`'s `landingWorlds` colour source. Everything
 * is a plain number (Hz / linear gain / seconds) so both the pure `audio-graph` math and the
 * imperative `audio-engine` read one definition. Deliberately **low-volume**: the master ceiling and
 * every cue gain are quiet by design — sound is a garnish, never a wall (WEB8 "low volume").
 */

/** The nine worlds the journey travels — the chime scale has exactly one note per world. */
export const WORLD_COUNT = landingWorldOrder.length;

/** Root of the brand scale (A3, a warm mid register that reads on laptop speakers). */
export const ROOT_HZ = 220;

/**
 * A **minor-pentatonic** run, ascending one note per world (9 notes = root + pentatonic over ~1.5
 * octaves). Pentatonic never clashes, so an arrival chime is always consonant with the ambient bed
 * regardless of which section you land on. Semitone offsets from the root.
 */
export const PENTATONIC_SEMITONES = [0, 3, 5, 7, 10, 12, 15, 17, 19] as const;

/** The primary-CTA activation tone — a perfect fifth above the root (bright, affirmative). */
export const CTA_SEMITONE = 7;

/** Master output ceiling — the whole layer never exceeds this linear gain (quiet). */
export const MASTER_CEILING = 0.5;

/** Ambient bed: quiet at rest, rising a little with scroll velocity, hard-capped low. */
export const AMBIENT_BASE_GAIN = 0.05;
export const AMBIENT_WARP_GAIN = 0.12;
export const AMBIENT_MAX_GAIN = 0.18;
/** Drone root + its fifth partial give the bed a hollow, spacious pad. */
export const AMBIENT_ROOT_HZ = ROOT_HZ / 2;
export const AMBIENT_FIFTH_HZ = (ROOT_HZ / 2) * 1.5;
/** Bed fade in/out on enable/disable (seconds). */
export const AMBIENT_FADE_S = 1.2;

/** Discrete cue gains + envelope shape (seconds). */
export const CHIME_GAIN = 0.16;
export const CTA_GAIN = 0.22;
export const CUE_ATTACK_S = 0.012;
export const CHIME_DECAY_S = 0.9;
export const CTA_DECAY_S = 0.55;
