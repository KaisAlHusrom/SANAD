import type { ReactNode } from 'react';
import { SystemReady } from './system-ready';
import type { SystemId } from '../types';

/**
 * The server-rendered marker every page wraps its content in (P8.D): `data-system` declares
 * which star system the route lives in — the `AccentStyle` `:has()` rules key the page accent
 * off it, and the universe layer (canvas + flight director) reads it to mount the right scene.
 * It also carries the client `SystemReady` leaf, so mounting the page IS the "route ready"
 * signal that releases a flight's arrival gate. `display: contents` (universe.css) keeps it
 * out of layout entirely, so sticky chapters and `overflow-x: clip` roots behave exactly as
 * if unwrapped. The attributes are SSR-stable — no hydration risk.
 */
export function SystemStage({
  system,
  slug = null,
  children,
}: {
  system: SystemId;
  /** The service slug on a `serviceDetail` orbit — seeds that service's own planet. */
  slug?: string | null;
  children?: ReactNode;
}) {
  return (
    <div
      className="system-stage"
      data-system={system}
      data-system-slug={slug ?? undefined}
    >
      <SystemReady system={system} slug={slug} />
      {children}
    </div>
  );
}
