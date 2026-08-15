/**
 * Per-section "chapter" heights (vh) — how tall each sticky docking stage is, giving the reference's
 * travel feel (WEB10). Taller = the section lingers longer as the flight passes its world. Keyed by
 * section id; values tuned from `docs/design/source/Sanad Landing.dc.html` (U18).
 */
export const CHAPTER_HEIGHTS = {
  trust: 260, // the constellation traces across the dock — give the figure room to draw
  services: 250, // four capability panels arc in — a beat more travel than plain cards
  process: 250,
  works: 320,
  stats: 180,
  testimonials: 190,
  blog: 210,
  cta: 200, // the launch pad adds the next-steps sequence below the CTA
} as const;

export type ChapterKey = keyof typeof CHAPTER_HEIGHTS;
