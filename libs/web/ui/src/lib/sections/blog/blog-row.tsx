import type { BlogRowData } from './derive-blog-posts.js';
import type { BlogRowLink } from './blog-row.types.js';

/** The default log-row link — a plain `<a>` (the admin preview). The website injects its comet-flight
 *  `TravelLink` for `mode='live'`. Both resolve to the same `/blog/<slug>`. */
function DefaultRowLink({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a className={className} href={`/blog/${slug}`}>
      {children}
    </a>
  );
}

/**
 * ONE ship's-log row — the row DOM defined ONCE (the `WorkCard` precedent) so the live website and
 * the admin preview render byte-identical markup (preview===live). A hairline-grid row: an optional
 * cover thumbnail (the server-resolved `row.coverUrl`), the mono date stamp, the category, the
 * title + excerpt, and a direction-aware arrow. The whole row links to its article via the injected
 * `RowLink` (default plain `<a>`; the live teaser injects its comet-flight `TravelLink`).
 * Tokens-only `.web-*`, logical properties (RTL, U6/U7).
 */
export function BlogRow({
  row,
  arrow,
  RowLink = DefaultRowLink,
}: {
  row: BlogRowData;
  /** the direction-aware trailing glyph (`←` RTL / `→` LTR) — computed once by the section. */
  arrow: string;
  RowLink?: BlogRowLink;
}) {
  return (
    <RowLink slug={row.slug} className="web-log-row">
      {row.coverUrl ? (
        <span className="web-log-cover">
          {/* resolved CDN cover — a genuine runtime src (the media resolver), not a token */}
          <img
            className="web-log-cover-img"
            src={row.coverUrl}
            alt=""
            loading="lazy"
          />
        </span>
      ) : null}
      <span className="web-log-date web-ltr">{row.dateStamp}</span>
      <span className="web-log-cat">{row.category}</span>
      <span className="web-log-main">
        <h3 className="web-log-title">{row.title}</h3>
        <p className="web-log-excerpt">{row.excerpt}</p>
      </span>
      <span className="web-log-arrow" aria-hidden="true">
        {arrow}
      </span>
    </RowLink>
  );
}
