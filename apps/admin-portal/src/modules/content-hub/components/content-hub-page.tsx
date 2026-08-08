import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CONTENT_AREAS } from '../constants/content-areas';

/**
 * The content hub at `/content` (W1): a card grid linking to each content-management domain.
 * Keeps a single sidebar entry while scaling to many domains; each card routes to its own
 * `content.read`-gated page. Tokens-only, RTL via logical properties (the arrow flips).
 */
export function ContentHubPage() {
  const { t } = useTranslation('contentHub');

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-dim">{t('subtitle')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENT_AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <Link
              key={area.to}
              to={area.to}
              className="group flex flex-col gap-3 rounded-card border border-border-2 bg-surface p-5 shadow-portal transition-colors hover:border-accent-line hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-input bg-accent-soft text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <ArrowUpRight
                  className="size-4 text-faint transition-colors group-hover:text-accent rtl:-scale-x-100"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-text">
                  {t(`areas.${area.key}.title`)}
                </h2>
                <p className="text-sm text-dim">
                  {t(`areas.${area.key}.desc`)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
