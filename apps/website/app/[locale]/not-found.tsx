import { getDictionary } from '../../src/i18n';
import { SystemStage, TravelLink } from '../../src/motion/universe';

/**
 * Localized 404 (F2/F3). A not-found boundary has no route params, so it falls back to the
 * default locale (ar) — enough to point the visitor home.
 */
export default function NotFound() {
  const dict = getDictionary('ar');
  return (
    <SystemStage system="ambient">
      <div className="site-content">
        <div className="site-state">
          <h2 className="site-page-title">{dict.states.notFound}</h2>
          <TravelLink href="/ar" className="site-ghost">
            {dict.nav.home}
          </TravelLink>
        </div>
      </div>
    </SystemStage>
  );
}
