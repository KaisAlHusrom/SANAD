import { useTranslation } from 'react-i18next';
import { ADVANCED_COLOR_GROUPS } from '../constants/branding-color-groups';
import { ColorField } from './color-field';

/** Primary/secondary always; the 20 deeper tokens behind an "Advanced color system" disclosure. */
export function BrandingColorsSection() {
  const { t } = useTranslation('settings');

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">
        {t('sections.colors')}
      </h2>

      <div className="flex flex-col gap-3">
        <ColorField name="colors.primary" label={t('colors.primary')} />
        <ColorField name="colors.secondary" label={t('colors.secondary')} />
      </div>

      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium text-dim">
          {t('colors.advanced')}
        </summary>
        <div className="mt-4 flex flex-col gap-6">
          {ADVANCED_COLOR_GROUPS.map((group) => (
            <div key={group.titleKey} className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-text">
                {t(group.titleKey)}
              </h3>
              {group.fields.map((field) => (
                <ColorField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                />
              ))}
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
