import { smoothstep } from './smoothstep';

/**
 * The opacity of a chapter's AMBIENT dressing — scrims/glows/rings marked `data-chapter-veil`
 * (the CTA launch veil + rings) — synced to the same chapter-local scroll the content rides
 * (owner fix 2026-07-07: the dark scrim used to sit at full opacity across the whole tall chapter,
 * appearing well before the section and lingering after it). It rises **slightly ahead** of the
 * first content item (gate 0.30) so the scrim is in place when the words arrive, holds through the
 * dock plateau, and draws back inside the same exit window as the content (0.84→0.97) so nothing
 * outlives the section. The rise window (0.30→0.50) hugs the first items' own ramp — the scrim
 * darkens exactly as the words condense, never floating alone over empty space. Pure/testable;
 * `ChapterStage` applies it as a plain opacity.
 */
export function chapterVeilOpacity(local: number): number {
  return smoothstep(0.3, 0.5, local) * (1 - smoothstep(0.84, 0.97, local));
}
