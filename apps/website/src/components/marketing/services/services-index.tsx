import { TravelLink } from '../../../motion/universe';
import { pickLocalized, type Locale, type ServiceItem } from '@sanad/contracts';
import { RevealOnScroll } from '../reveal-on-scroll';
import {
  copy,
  METHOD_PHASES,
  SERVICES_COPY,
  TECH_STACK,
} from './services-copy';

/**
 * The Services index BODY (`/services`, Phase-5 hybrid) — 100% DB-driven (WEB1/WEB2): the CMS
 * `service` entities feed the core grid; the supporting capabilities / phased method / tech strip
 * are coded defaults (U9). The page's editable hero + closing-CTA bands are seeded `richtext` CMS
 * sections rendered around this body by the route (`FALLBACK_SERVICES_SECTIONS` /
 * `getPage('services')`). Derived from design-spec §2 in the shell's fixed dark theme, reusing the
 * landing `.lp-*` primitives (F9); motion via `RevealOnScroll` (WEB3/WEB4); tokens + logical
 * properties + full RTL (U6/U7).
 */
export function ServicesIndex({
  services,
  locale,
}: {
  services: ServiceItem[];
  locale: Locale;
}) {
  const core = services.filter((service) => service.category === 'core');

  return (
    <div className="mk-page">
      {/* Core services 2×2 */}
      <section id="core" className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(SERVICES_COPY.core.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(SERVICES_COPY.core.title, locale)}
              </h2>
            </div>
          </RevealOnScroll>
          {core.length > 0 ? (
            <div className="mk-grid mk-grid--2">
              {core.map((service, index) => (
                <RevealOnScroll key={service.id} index={index} as="article">
                  <TravelLink
                    href={`/${locale}/services/${service.slug}`}
                    className="lp-panel mk-service"
                  >
                    <span className="lp-micro lp-ltr mk-service-tag">
                      {`SYS·${String(index + 1).padStart(2, '0')} / ${service.slug.toUpperCase()}`}
                    </span>
                    <h3 className="lp-card-title">
                      {pickLocalized(service.title, locale)}
                    </h3>
                    <p className="lp-card-body">
                      {pickLocalized(service.summary, locale)}
                    </p>
                    <span className="mk-service-more" aria-hidden="true">
                      {locale === 'ar' ? 'التفاصيل ←' : 'Details →'}
                    </span>
                  </TravelLink>
                </RevealOnScroll>
              ))}
            </div>
          ) : (
            <p className="lp-empty">
              {locale === 'ar'
                ? 'الخدمات قيد الإعداد.'
                : 'Services are being prepared.'}
            </p>
          )}
        </div>
      </section>

      {/* Supporting capabilities 4-up */}
      <section className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(SERVICES_COPY.support.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(SERVICES_COPY.support.title, locale)}
              </h2>
            </div>
          </RevealOnScroll>
          <div className="mk-grid mk-grid--4">
            {SERVICES_COPY.support.items.map((item, index) => (
              <RevealOnScroll key={item.key} index={index} as="article">
                <div className="lp-panel mk-support">
                  <span
                    className={`mk-mark mk-mark--${index % 4}`}
                    aria-hidden="true"
                  />
                  <h3 className="lp-card-title">{copy(item.title, locale)}</h3>
                  <p className="lp-card-body">{copy(item.desc, locale)}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Method — 4-phase row */}
      <section className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head lp-section-head--center">
              <p className="lp-eyebrow lp-eyebrow--center">
                {copy(SERVICES_COPY.method.eyebrow, locale)}
              </p>
              <h2 className="lp-h2 lp-h2--center">
                {copy(SERVICES_COPY.method.title, locale)}
              </h2>
              <p className="lp-section-lead lp-section-lead--center">
                {copy(SERVICES_COPY.method.subtitle, locale)}
              </p>
            </div>
          </RevealOnScroll>
          <ol className="mk-phases">
            {METHOD_PHASES.map((phase, index) => (
              <RevealOnScroll key={phase.key} index={index} as="li">
                <div className="mk-phase">
                  <span className="lp-micro lp-ltr mk-phase-no">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mk-phase-title">
                    {copy(phase.title, locale)}
                  </h3>
                  <p className="lp-card-body">{copy(phase.desc, locale)}</p>
                </div>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </section>

      {/* Tech-stack strip (LTR mono, never mirrored — WEB6) */}
      <section className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(SERVICES_COPY.tech.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(SERVICES_COPY.tech.title, locale)}
              </h2>
            </div>
          </RevealOnScroll>
          <RevealOnScroll index={1}>
            <ul className="mk-tech lp-ltr">
              {TECH_STACK.map((tech) => (
                <li key={tech} className="mk-tech-pill">
                  {tech}
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
