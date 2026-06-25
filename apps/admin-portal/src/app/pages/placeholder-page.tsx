import { useTranslation } from 'react-i18next';

/**
 * A foundation placeholder for the not-yet-built admin modules (P7.B/C/D fill these).
 * Title resolves in the `common` namespace.
 */
export function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation('common');
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold text-text">{t(titleKey)}</h2>
      <p className="text-dim">{t('states.empty')}</p>
    </section>
  );
}
