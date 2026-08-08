import {
  pickLocalized,
  type Locale,
  type LocalizedText,
  type PortfolioProjectItem,
} from '@sanad/contracts';
import { TravelLink } from '../../../motion/universe';
import { RevealOnScroll } from '../reveal-on-scroll';
import { copy } from '../services/services-copy';
import { CASE_STUDY_COPY } from './portfolio-copy';

/**
 * A case-study detail page (`/portfolio/[slug]`) — the CMS `portfolio_project` supplies
 * title/summary/challenge/solution/result + cover (WEB1); the branded chrome (breadcrumb, section
 * labels, meta strip, related, CTA) is coded-default (U9). Split hero with the cover on the
 * inline-start; the three-act Challenge → Solution → Result narrative is the substance. With no
 * cover the works "Galaxy" planet behind the page IS the visual (P8.E). Derived from the Services
 * detail pattern (F9); tokens + logical properties + full RTL (U6/U7).
 */
export function CaseStudy({
  project,
  related,
  coverUrl,
  locale,
}: {
  project: PortfolioProjectItem;
  related: PortfolioProjectItem[];
  coverUrl: string;
  locale: Locale;
}) {
  const requestHref = `/${locale}/request-a-project`;
  const narrative: {
    key: string;
    label: LocalizedText;
    body: LocalizedText;
  }[] = [
    {
      key: 'challenge',
      label: CASE_STUDY_COPY.challenge,
      body: project.challenge,
    },
    {
      key: 'solution',
      label: CASE_STUDY_COPY.solution,
      body: project.solution,
    },
    { key: 'result', label: CASE_STUDY_COPY.result, body: project.result },
  ];

  return (
    <article className="mk-page mk-detail mk-case">
      {/* Breadcrumb split hero */}
      <section className="lp-section mk-detail-hero">
        <div className="lp-shell">
          <RevealOnScroll trigger="mount">
            <nav className="mk-breadcrumb lp-eyebrow" aria-label="breadcrumb">
              <TravelLink
                href={`/${locale}/portfolio`}
                className="mk-breadcrumb-link"
              >
                {copy(CASE_STUDY_COPY.home, locale)}
              </TravelLink>
              <span aria-hidden="true"> · </span>
              <span className="lp-ltr">{project.slug.toUpperCase()}</span>
            </nav>
          </RevealOnScroll>
          <div className="mk-detail-hero-grid">
            <div className="mk-detail-hero-copy">
              {project.category ? (
                <RevealOnScroll trigger="mount" index={1}>
                  <p className="lp-eyebrow mk-case-domain">
                    {pickLocalized(project.category.name, locale)}
                  </p>
                </RevealOnScroll>
              ) : null}
              <RevealOnScroll trigger="mount" index={1}>
                <h1 className="mk-hero-title">
                  {pickLocalized(project.title, locale)}
                </h1>
              </RevealOnScroll>
              <RevealOnScroll trigger="mount" index={2}>
                <p className="mk-hero-lead">
                  {pickLocalized(project.summary, locale)}
                </p>
              </RevealOnScroll>
              <RevealOnScroll trigger="mount" index={3}>
                <div className="mk-hero-actions">
                  <TravelLink
                    className="lp-cta lp-cta--primary"
                    href={requestHref}
                  >
                    {copy(CASE_STUDY_COPY.cta.talk, locale)}
                  </TravelLink>
                  {project.projectUrl ? (
                    <a
                      className="lp-cta lp-cta--ghost"
                      href={project.projectUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {copy(CASE_STUDY_COPY.meta.visit, locale)}
                    </a>
                  ) : null}
                </div>
              </RevealOnScroll>
            </div>
            {/* the cover renders ONLY when an image exists — with none, the works planet behind
                the page (the works star system, P8.E) IS the visual */}
            {coverUrl ? (
              <RevealOnScroll trigger="mount" index={2}>
                <div className="mk-detail-cover">
                  <img
                    className="mk-detail-cover-img"
                    src={coverUrl}
                    alt={pickLocalized(project.title, locale)}
                  />
                </div>
              </RevealOnScroll>
            ) : null}
          </div>
        </div>
      </section>

      {/* Meta strip: client · domain · outcome */}
      <section className="lp-section mk-case-meta-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <dl className="mk-case-meta">
              <div className="mk-case-meta-item">
                <dt className="lp-micro">
                  {copy(CASE_STUDY_COPY.meta.client, locale)}
                </dt>
                <dd className="mk-case-meta-value">
                  {project.clientName ?? '—'}
                </dd>
              </div>
              {project.category ? (
                <div className="mk-case-meta-item">
                  <dt className="lp-micro">
                    {copy(CASE_STUDY_COPY.meta.domain, locale)}
                  </dt>
                  <dd className="mk-case-meta-value">
                    {pickLocalized(project.category.name, locale)}
                  </dd>
                </div>
              ) : null}
              <div className="mk-case-meta-item">
                <dt className="lp-micro">
                  {copy(CASE_STUDY_COPY.meta.outcome, locale)}
                </dt>
                <dd className="mk-case-meta-value">
                  {pickLocalized(project.result, locale)}
                </dd>
              </div>
            </dl>
          </RevealOnScroll>
        </div>
      </section>

      {/* The three-act narrative: Challenge → Solution → Result */}
      <section className="lp-section mk-case-story">
        <div className="lp-shell">
          <ol className="mk-case-steps">
            {narrative.map((part, index) => (
              <RevealOnScroll key={part.key} index={index} as="li">
                <div className="mk-case-step">
                  <span className="lp-micro lp-ltr mk-case-step-no">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="mk-case-step-body">
                    <h2 className="mk-case-step-title">
                      {copy(part.label, locale)}
                    </h2>
                    <p className="mk-detail-body">
                      {pickLocalized(part.body, locale)}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </section>

      {/* Related work */}
      {related.length > 0 ? (
        <section className="lp-section">
          <div className="lp-shell">
            <RevealOnScroll>
              <div className="lp-section-head">
                <p className="lp-eyebrow">
                  {copy(CASE_STUDY_COPY.related.eyebrow, locale)}
                </p>
                <h2 className="lp-h2">
                  {copy(CASE_STUDY_COPY.related.title, locale)}
                </h2>
              </div>
            </RevealOnScroll>
            <div className="mk-grid mk-grid--3">
              {related.map((item, index) => (
                <RevealOnScroll key={item.id} index={index} as="article">
                  <TravelLink
                    href={`/${locale}/portfolio/${item.slug}`}
                    className="lp-panel mk-work"
                  >
                    <span className="lp-micro lp-ltr mk-work-client">
                      {item.clientName ?? 'SANAD'}
                    </span>
                    <h3 className="lp-card-title">
                      {pickLocalized(item.title, locale)}
                    </h3>
                    <p className="lp-card-body">
                      {pickLocalized(item.summary, locale)}
                    </p>
                    <span className="mk-service-more" aria-hidden="true">
                      {locale === 'ar' ? 'اقرأ القصّة ←' : 'Read the story →'}
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
                {copy(CASE_STUDY_COPY.cta.title, locale)}
              </h2>
              <p className="lp-section-lead lp-section-lead--center">
                {copy(CASE_STUDY_COPY.cta.subtitle, locale)}
              </p>
              <div className="mk-cta-actions">
                <TravelLink
                  className="lp-cta lp-cta--primary"
                  href={requestHref}
                >
                  {copy(CASE_STUDY_COPY.cta.talk, locale)}
                </TravelLink>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </article>
  );
}
