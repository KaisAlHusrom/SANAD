import { ImageIcon } from 'lucide-react';
import type { WorkCardData } from './derive-work-cards.js';
import type { WorkCardLabels, WorkCardLink } from './work-card.types.js';

/** The default case-study link — a plain `<a>` (the admin static figure). The website injects its
 *  comet-flight `TravelLink` for `mode='live'`. Both localize to the same `/portfolio/<slug>`. */
function DefaultCardLink({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a className={className} href={`/portfolio/${slug}`}>
      {children}
    </a>
  );
}

/**
 * ONE orbiting case-study card — the card DOM defined ONCE (the `ConstellationFigure` precedent), so
 * the live animated orbit and the admin static figure render byte-identical markup (preview===live).
 * A cover image on top (the server-resolved `card.coverUrl`, else a placeholder frame — the
 * `image`-block precedent), then the instrument readout: a mono client header + category tag, the
 * title, the challenge line, and a metric-led result. The whole card links to its case study via the
 * injected `CardLink` (default plain `<a>`; the live orbit injects its comet-flight `TravelLink`).
 * `data-orbit-card`/`-tilt` mark the elements the website's `Orbit` wrapper drives by selector.
 */
export function WorkCard({
  card,
  labels,
  CardLink = DefaultCardLink,
}: {
  card: WorkCardData;
  labels: WorkCardLabels;
  CardLink?: WorkCardLink;
}) {
  const coverUrl = card.coverUrl;

  return (
    <article className="web-panel web-orbit-card" data-orbit-card>
      <div className="web-orbit-tilt" data-orbit-tilt>
        <CardLink slug={card.slug} className="web-orbit-link">
          <div className="web-orbit-cover">
            {coverUrl ? (
              // resolved CDN cover — a genuine runtime src (the media resolver), not a token
              <img
                className="web-orbit-cover-img"
                src={coverUrl}
                alt=""
                loading="lazy"
              />
            ) : (
              <div className="web-orbit-cover-frame" aria-hidden="true">
                <ImageIcon size={24} aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="web-orbit-top">
            <span className="web-orbit-client">{card.client}</span>
            {card.tag ? (
              <span className="web-orbit-tag">{card.tag}</span>
            ) : null}
          </div>
          <div className="web-orbit-body">
            <div className="web-orbit-head">
              <span className="web-orbit-title">{card.title}</span>
            </div>
            {card.challenge ? (
              <p className="web-card-body">
                <span className="web-orbit-challenge">{labels.challenge}</span>
                {card.challenge}
              </p>
            ) : null}
            {card.resultValue || card.resultLabel ? (
              <div className="web-orbit-result">
                {card.resultValue ? (
                  <span className="web-orbit-result-value web-ltr">
                    {card.resultValue}
                  </span>
                ) : null}
                {card.resultLabel ? (
                  <span className="web-orbit-result-label">
                    {card.resultLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardLink>
      </div>
    </article>
  );
}
