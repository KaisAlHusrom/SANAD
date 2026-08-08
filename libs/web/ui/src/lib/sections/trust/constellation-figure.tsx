import {
  CONSTELLATION_VIEW,
  constellationLayout,
} from './constellation-geometry.js';
import type { TrustDomain } from './trust-domains.js';

/**
 * The trust chapter's **domain constellation** figure — the DB-driven project categories as named
 * stars joined by hairline links. A pure presentational component (no hooks, server-safe) so the
 * DOM is defined ONCE: the shared `TrustSection` renders it directly (static — SSR/no-JS/reduced-
 * motion/admin preview), and the website's client `TrustConstellation` wrapper renders the SAME
 * figure and drives the tracing/star-pop by selector (`[data-const-line]`/`[data-const-star]`/
 * `[data-const-label]`, in document = domain order) — so live and static are byte-identical.
 * Geometry mirrors under RTL via CSS `scaleX(var(--dir))` on the SVG while the HTML labels anchor
 * with logical insets so they land back on their mirrored stars and are never themselves mirrored
 * (WEB6). Numbers in the count chips are mono LTR instrument readouts.
 */
export function ConstellationFigure({ domains }: { domains: TrustDomain[] }) {
  const layout = constellationLayout(domains.length);
  const n = layout.stars.length;
  if (n === 0) return null;

  return (
    <div className="web-constellation" data-web-constellation>
      <svg
        className="web-const-svg"
        viewBox={`0 0 ${CONSTELLATION_VIEW.width} ${CONSTELLATION_VIEW.height}`}
        aria-hidden="true"
      >
        {layout.links.map(([a, b]) => {
          const from = layout.stars[a];
          const to = layout.stars[b];
          if (!from || !to) return null;
          return (
            <line
              key={`${a}-${b}`}
              className="web-const-line"
              data-const-line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={0}
            />
          );
        })}
        {layout.stars.map((star, i) => {
          const domain = domains[i];
          if (!domain) return null;
          return (
            <g key={domain.id} data-const-star>
              <circle
                className="web-const-halo"
                cx={star.x}
                cy={star.y}
                r={star.r * 3.1}
              />
              <circle
                className="web-const-core"
                cx={star.x}
                cy={star.y}
                r={star.r}
              />
            </g>
          );
        })}
      </svg>
      {layout.stars.map((star, i) => {
        const domain = domains[i];
        if (!domain) return null;
        // 1-decimal — full-precision floats in SSR'd inline styles hydration-mismatch
        const yPct = ((star.y / CONSTELLATION_VIEW.height) * 100).toFixed(1);
        return (
          <div
            key={domain.id}
            data-const-label
            className={`web-const-label web-const-label--${star.labelSide}`}
            // star anchor in % of the field — logical inset so RTL re-flips onto the mirrored star
            style={{
              insetInlineStart: `${star.x}%`,
              insetBlockStart: `${yPct}%`,
            }}
          >
            <span className="web-const-name">{domain.name}</span>
            {domain.count > 0 ? (
              <span className="web-const-count web-ltr">{`× ${String(domain.count).padStart(2, '0')}`}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
