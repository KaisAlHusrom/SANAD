import { TravelLink } from '../../../motion/universe';
import { pickLocalized, type Locale, type ServiceItem } from '@sanad/contracts';
import { RevealOnScroll } from '../reveal-on-scroll';
import {
  copy,
  METHOD_PHASES,
  SERVICE_DETAIL_COPY,
  serviceSystem,
} from './services-copy';

/**
 * A service detail page (`/services/[slug]`) — the CMS `service` supplies title/summary/
 * detailBody + cover (WEB1); the branded chrome (capabilities, phased journey, guarantees,
 * tech, CTA) is coded-default (U9), with per-service capabilities/tech REUSED from the
 * landing systems copy (F9). Derived from design-spec §2. `detailBody` renders as the
 * admin-authored substance when present; the page stands on its own when it's empty.
 */
export function ServiceDetail({
  service,
  related,
  coverUrl,
  locale,
}: {
  service: ServiceItem;
  related: ServiceItem[];
  coverUrl: string;
  locale: Locale;
}) {
  const system = serviceSystem(service.slug);
  const detailBody = pickLocalized(service.detailBody, locale);
  const techPills = system.tech
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);
  const contactHref = `/${locale}/contact`;
  const requestHref = `/${locale}/request-a-project`;

  return (
    <article className="mk-page mk-detail">
      {/* Breadcrumb hero */}
      <section className="lp-section mk-detail-hero">
        <div className="lp-shell">
          <RevealOnScroll trigger="mount">
            <nav className="mk-breadcrumb lp-eyebrow" aria-label="breadcrumb">
              <TravelLink
                href={`/${locale}/services`}
                className="mk-breadcrumb-link"
              >
                {copy(SERVICE_DETAIL_COPY.home, locale)}
              </TravelLink>
              <span aria-hidden="true"> · </span>
              <span className="lp-ltr">{service.slug.toUpperCase()}</span>
            </nav>
          </RevealOnScroll>
          <div className="mk-detail-hero-grid">
            <div className="mk-detail-hero-copy">
              <RevealOnScroll trigger="mount" index={1}>
                <h1 className="mk-hero-title">
                  {pickLocalized(service.title, locale)}
                </h1>
              </RevealOnScroll>
              <RevealOnScroll trigger="mount" index={2}>
                <p className="mk-hero-lead">
                  {pickLocalized(service.summary, locale)}
                </p>
              </RevealOnScroll>
              <RevealOnScroll trigger="mount" index={3}>
                <div className="mk-hero-actions">
                  <TravelLink
                    className="lp-cta lp-cta--primary"
                    href={contactHref}
                  >
                    {copy(SERVICE_DETAIL_COPY.hero.talk, locale)}
                  </TravelLink>
                  <a className="lp-cta lp-cta--ghost" href="#capabilities">
                    {copy(SERVICE_DETAIL_COPY.hero.explore, locale)}
                  </a>
                </div>
              </RevealOnScroll>
            </div>
            {/* the cover renders ONLY when an image exists — with none, the service's own
                planet (the serviceDetail star system behind the page, P8.D) IS the visual */}
            {coverUrl ? (
              <RevealOnScroll trigger="mount" index={2}>
                <div className="mk-detail-cover">
                  <img
                    className="mk-detail-cover-img"
                    src={coverUrl}
                    alt={pickLocalized(service.title, locale)}
                  />
                </div>
              </RevealOnScroll>
            ) : null}
          </div>
        </div>
      </section>

      {/* Admin-authored detail body (WEB1) — rendered only when present. */}
      {detailBody ? (
        <section className="lp-section mk-detail-body-section">
          <div className="lp-shell">
            <RevealOnScroll>
              <p className="mk-detail-body">{detailBody}</p>
            </RevealOnScroll>
          </div>
        </section>
      ) : null}

      {/* Capabilities */}
      <section id="capabilities" className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(SERVICE_DETAIL_COPY.caps.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(SERVICE_DETAIL_COPY.caps.title, locale)}
              </h2>
            </div>
          </RevealOnScroll>
          <div className="mk-grid mk-grid--3">
            {system.caps.map((cap, index) => (
              <RevealOnScroll key={index} index={index} as="article">
                <div className="lp-panel mk-cap">
                  <span className="lp-micro lp-ltr">{`C·${String(index + 1).padStart(2, '0')}`}</span>
                  <p className="mk-cap-text">{copy(cap, locale)}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Build journey — sticky heading + phase steps */}
      <section className="lp-section mk-journey">
        <div className="lp-shell mk-journey-grid">
          <div className="mk-journey-aside">
            <RevealOnScroll>
              <div className="mk-journey-head">
                <p className="lp-eyebrow">
                  {copy(SERVICE_DETAIL_COPY.journey.eyebrow, locale)}
                </p>
                <h2 className="lp-h2">
                  {copy(SERVICE_DETAIL_COPY.journey.title, locale)}
                </h2>
                <p className="lp-section-lead">
                  {copy(SERVICE_DETAIL_COPY.journey.subtitle, locale)}
                </p>
              </div>
            </RevealOnScroll>
          </div>
          <ol className="mk-journey-steps">
            {METHOD_PHASES.map((phase, index) => (
              <RevealOnScroll key={phase.key} index={index} as="li">
                <div className="mk-journey-step">
                  <span className="lp-micro lp-ltr mk-journey-no">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="mk-phase-title">
                      {copy(phase.title, locale)}
                    </h3>
                    <p className="lp-card-body">{copy(phase.desc, locale)}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </section>

      {/* Guarantees */}
      <section className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(SERVICE_DETAIL_COPY.guarantees.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(SERVICE_DETAIL_COPY.guarantees.title, locale)}
              </h2>
            </div>
          </RevealOnScroll>
          <div className="mk-grid mk-grid--3">
            {SERVICE_DETAIL_COPY.guarantees.items.map((item, index) => (
              <RevealOnScroll key={item.key} index={index} as="article">
                <div className="lp-panel mk-cap">
                  <h3 className="lp-card-title">{copy(item.title, locale)}</h3>
                  <p className="lp-card-body">{copy(item.desc, locale)}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Tech pills */}
      <section className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(SERVICE_DETAIL_COPY.tech.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(SERVICE_DETAIL_COPY.tech.title, locale)}
              </h2>
            </div>
          </RevealOnScroll>
          <RevealOnScroll index={1}>
            <ul className="mk-tech lp-ltr">
              {techPills.map((tech) => (
                <li key={tech} className="mk-tech-pill">
                  {tech}
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        </div>
      </section>

      {/* Related services */}
      {related.length > 0 ? (
        <section className="lp-section">
          <div className="lp-shell">
            <RevealOnScroll>
              <div className="lp-section-head">
                <p className="lp-eyebrow">
                  {copy(SERVICE_DETAIL_COPY.related.eyebrow, locale)}
                </p>
                <h2 className="lp-h2">
                  {copy(SERVICE_DETAIL_COPY.related.title, locale)}
                </h2>
              </div>
            </RevealOnScroll>
            <div className="mk-grid mk-grid--3">
              {related.map((item, index) => (
                <RevealOnScroll key={item.id} index={index} as="article">
                  <TravelLink
                    href={`/${locale}/services/${item.slug}`}
                    className="lp-panel mk-service"
                  >
                    <h3 className="lp-card-title">
                      {pickLocalized(item.title, locale)}
                    </h3>
                    <p className="lp-card-body">
                      {pickLocalized(item.summary, locale)}
                    </p>
                    <span className="mk-service-more" aria-hidden="true">
                      {locale === 'ar' ? 'التفاصيل ←' : 'Details →'}
                    </span>
                  </TravelLink>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="lp-section mk-cta">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="mk-cta-panel">
              <h2 className="lp-h2 lp-h2--center">
                {copy(SERVICE_DETAIL_COPY.cta.title, locale)}
              </h2>
              <p className="lp-section-lead lp-section-lead--center">
                {copy(SERVICE_DETAIL_COPY.cta.subtitle, locale)}
              </p>
              <div className="mk-cta-actions">
                <TravelLink
                  className="lp-cta lp-cta--primary"
                  href={requestHref}
                >
                  {copy(SERVICE_DETAIL_COPY.cta.talk, locale)}
                </TravelLink>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </article>
  );
}
