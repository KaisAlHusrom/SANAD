import type { Locale } from '@sanad/contracts';
import { RevealOnScroll } from '../reveal-on-scroll';
import { copy } from '../services/services-copy';
import { PROCESS_COPY, PROCESS_PHASES } from './process-copy';

/**
 * The Process page BODY (`/process`, Phase-5 hybrid) — the phased-delivery treatment (the 4-phase
 * timeline with duration + deliverables, a weekly-meeting band, a post-launch-support band). The
 * page's editable hero + closing-CTA bands are seeded `richtext` CMS sections rendered around this
 * body by the route (`FALLBACK_PROCESS_SECTIONS` / `getPage('process')`); this component holds only
 * the coded method body (no CMS entity for it). Reuses the phase titles from `METHOD_PHASES` (F9)
 * + the landing `.lp-*` primitives; motion via `RevealOnScroll` (WEB3/WEB4); tokens + logical
 * properties + full RTL (U6/U7). Idles in the process "Waypoints" star system (WEB12).
 */
export function ProcessIndex({ locale }: { locale: Locale }) {
  return (
    <div className="mk-page">
      {/* The 4 phases — richer timeline (number, title, desc, duration, deliverables) */}
      <section className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(PROCESS_COPY.phases.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(PROCESS_COPY.phases.title, locale)}
              </h2>
            </div>
          </RevealOnScroll>
          <ol className="mk-process-timeline">
            {PROCESS_PHASES.map((phase, index) => (
              <RevealOnScroll key={phase.key} index={index} as="li">
                <div className="mk-process-phase">
                  <span className="lp-micro lp-ltr mk-phase-no">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mk-phase-title">
                    {copy(phase.title, locale)}
                  </h3>
                  <p className="lp-card-body">{copy(phase.desc, locale)}</p>
                  <span className="lp-micro lp-ltr mk-process-duration">
                    {copy(phase.duration, locale)}
                  </span>
                  <div className="mk-process-give">
                    <span className="lp-micro">
                      {copy(PROCESS_COPY.phases.give, locale)}
                    </span>
                    <ul className="mk-process-give-list">
                      {phase.deliverables.map((item) => (
                        <li key={copy(item, locale)}>{copy(item, locale)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </section>

      {/* Weekly meeting */}
      <section className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="mk-process-meeting">
              <p className="lp-eyebrow">
                {copy(PROCESS_COPY.meeting.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(PROCESS_COPY.meeting.title, locale)}
              </h2>
              <p className="lp-card-body">
                {copy(PROCESS_COPY.meeting.body, locale)}
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Post-launch support */}
      <section className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="mk-process-support">
              <p className="lp-eyebrow">
                {copy(PROCESS_COPY.support.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">
                {copy(PROCESS_COPY.support.title, locale)}
              </h2>
              <p className="lp-card-body">
                {copy(PROCESS_COPY.support.body, locale)}
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
