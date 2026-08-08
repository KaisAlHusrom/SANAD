import { useTranslation } from 'react-i18next';
import {
  EXPLORER_MIN_HEIGHT,
  MediaExplorer,
} from '../../../components/media-explorer';
import { cn } from '../../../lib/cn';

/**
 * The media library page. Its whole body is the shared `MediaExplorer` (F9) — the SAME component
 * the picker modal opens from inside any form, so organizing files works identically wherever
 * the user meets the library. The page contributes only its own title (F10).
 */
export function MediaPage() {
  const { t } = useTranslation('media');

  return (
    <section className={cn('flex flex-1 flex-col gap-6', EXPLORER_MIN_HEIGHT)}>
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-dim">{t('subtitle')}</p>
      </header>

      <MediaExplorer mode="page" />
    </section>
  );
}
