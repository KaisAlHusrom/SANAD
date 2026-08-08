import type { Locale } from '@sanad/contracts';

/**
 * The renderer mode — the seam between the admin content studio and the real website (P8).
 *
 * - `'preview'`: the admin pages-builder, read-only. Empty content shows a neutral placeholder
 *   and unpublished sections are dimmed, so the editor sees structure even mid-edit.
 * - `'edit'`: the admin Content Studio. Behaves like `preview` for placeholders/dimming, and in
 *   addition the `Editable*` primitives light up their in-place editing affordances (hover
 *   outline + corner pencil + double-click) when an `EditProvider` is present. The website never
 *   passes `edit`, so its section content stays pure server HTML (no added hydration).
 * - `'live'`: the public website. Empty content renders nothing; the data layer has already
 *   filtered to published sections. Bespoke sections layer entrance/scroll animation by branching
 *   on this flag inside the leaf components — `mode` is already threaded to every node.
 */
export type RenderMode = 'preview' | 'live' | 'edit';

/** True when the renderer is in an editor surface (admin preview or studio) — not the live site. */
export function isEditorMode(mode: RenderMode): boolean {
  return mode !== 'live';
}

/** Props every renderer node carries: the contract node's active locale + the render mode. */
export interface RenderProps {
  locale: Locale;
  mode: RenderMode;
}
