'use client';

import {
  pickLocalized,
  type Locale,
  type PortfolioCategoryItem,
  type PortfolioProjectItem,
} from '@sanad/contracts';
import { TravelLink } from '../../../motion/universe';
import { RevealOnScroll } from '../reveal-on-scroll';
import { copy } from '../services/services-copy';
import { CASE_STUDY_COPY, PORTFOLIO_COPY } from './portfolio-copy';
import { ALL_CATEGORY, usePortfolioFilter } from './use-portfolio-filter';

/**
 * The Portfolio index BODY (`/portfolio`, Phase-5 hybrid) — 100% DB-driven (WEB1/WEB2): the
 * published CMS `portfolio_project` entities feed the case-study grid + a no-reload domain filter
 * (U5 hook). The page's editable hero + closing-CTA bands are seeded `richtext` CMS sections
 * rendered around this body by the route (`FALLBACK_PORTFOLIO_SECTIONS` / `getPage('portfolio')`).
 * Reuses the landing `.lp-*` primitives + the `.mk-*` classes (F9); motion via `RevealOnScroll`
 * (WEB3/WEB4); tokens + logical properties + full RTL (U6/U7). The works "Galaxy" system lights it.
 */
export function PortfolioIndex({
  projects,
  categories,
  locale,
}: {
  projects: PortfolioProjectItem[];
  categories: PortfolioCategoryItem[];
  locale: Locale;
}) {
  const { active, setActive, visible } = usePortfolioFilter(projects);
  // only offer chips for categories that actually have published projects (never a dead filter)
  const chips = categories.filter((category) =>
    projects.some((project) => project.category?.slug === category.slug),
  );

  return (
    <div className="mk-page">
      {/* Case-study grid + domain filter */}
      <section id="work" className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(PORTFOLIO_COPY.grid.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(PORTFOLIO_COPY.grid.title, locale)}
              </h2>
            </div>
          </RevealOnScroll>

          {projects.length > 0 ? (
            <>
              {chips.length > 0 ? (
                <RevealOnScroll>
                  <div
                    className="mk-filter"
                    role="group"
                    aria-label={copy(PORTFOLIO_COPY.filter.label, locale)}
                  >
                    <button
                      type="button"
                      className="mk-filter-chip"
                      aria-pressed={active === ALL_CATEGORY}
                      onClick={() => setActive(ALL_CATEGORY)}
                    >
                      {copy(PORTFOLIO_COPY.filter.all, locale)}
                    </button>
                    {chips.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className="mk-filter-chip"
                        aria-pressed={active === category.slug}
                        onClick={() => setActive(category.slug)}
                      >
                        {pickLocalized(category.name, locale)}
                      </button>
                    ))}
                  </div>
                </RevealOnScroll>
              ) : null}

              <div className="mk-grid mk-grid--3">
                {visible.map((project, index) => (
                  <RevealOnScroll key={project.id} index={index} as="article">
                    <TravelLink
                      href={`/${locale}/portfolio/${project.slug}`}
                      className="lp-panel mk-work"
                    >
                      <span className="lp-micro lp-ltr mk-work-client">
                        {project.clientName ?? 'SANAD'}
                      </span>
                      <h3 className="lp-card-title">
                        {pickLocalized(project.title, locale)}
                      </h3>
                      <p className="lp-card-body">
                        {pickLocalized(project.summary, locale)}
                      </p>
                      <span className="mk-work-result">
                        <span className="lp-micro mk-work-result-label">
                          {copy(CASE_STUDY_COPY.result, locale)}
                        </span>
                        <span className="mk-work-result-value">
                          {pickLocalized(project.result, locale)}
                        </span>
                      </span>
                      <span className="mk-service-more" aria-hidden="true">
                        {locale === 'ar' ? 'اقرأ القصّة ←' : 'Read the story →'}
                      </span>
                    </TravelLink>
                  </RevealOnScroll>
                ))}
              </div>
            </>
          ) : (
            <p className="lp-empty">
              {copy(PORTFOLIO_COPY.grid.empty, locale)}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
