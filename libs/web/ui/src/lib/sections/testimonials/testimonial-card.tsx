import type { TestimonialCardData } from './derive-testimonials.js';

/** Static hand-authored signal trace (viewBox units) — an instrument ornament, not data. */
const SIGNAL_POINTS =
  '0,7 14,7 18,3 22,11 26,7 44,7 48,5 52,9 56,7 74,7 78,2 82,12 86,7 100,7';

/**
 * ONE received-transmission card — the card DOM defined ONCE (the `WorkCard` precedent) so the live
 * website and the admin preview render byte-identical markup (preview===live). A bracket-framed
 * panel with a mono `TRX·NN` designation + the stored rating as diamond marks, a static signal-trace
 * ornament, the quote, and the author footer. The avatar is the server-resolved `card.avatarUrl`
 * (a real `<img>`), falling back to the gradient initial disc when the author has no photo.
 * Tokens-only `.web-*`, logical properties (RTL, U6/U7).
 */
export function TestimonialCard({
  card,
  designation,
}: {
  card: TestimonialCardData;
  /** the mono channel designation (`TRX·01`) — derived from the card's position in the wall. */
  designation: string;
}) {
  const role = [card.role, card.company].filter(Boolean).join(' · ');
  return (
    <blockquote className="web-panel web-quote">
      <div className="web-trx-head">
        <span className="web-micro web-ltr">{designation}</span>
        {card.rating > 0 ? (
          <span className="web-trx-rating" aria-hidden="true">
            {Array.from({ length: card.rating }, (_, i) => (
              <span key={i} className="web-trx-rating-mark" />
            ))}
          </span>
        ) : null}
      </div>
      <svg
        className="web-trx-signal"
        viewBox="0 0 100 14"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* pathLength=1 normalizes the dash math so CSS can redraw the trace on hover */}
        <polyline points={SIGNAL_POINTS} pathLength={1} />
      </svg>
      <p className="web-quote-text">{card.quote}</p>
      <footer className="web-quote-author">
        {card.avatarUrl ? (
          // resolved CDN avatar — a genuine runtime src (the media resolver), not a token
          <img
            className="web-avatar web-avatar-img"
            src={card.avatarUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className="web-avatar" aria-hidden="true" />
        )}
        <span>
          <span className="web-quote-name">{card.authorName}</span>
          {role ? <span className="web-quote-role">{role}</span> : null}
        </span>
      </footer>
    </blockquote>
  );
}
