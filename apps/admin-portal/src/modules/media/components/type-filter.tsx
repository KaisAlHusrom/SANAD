import { useTranslation } from 'react-i18next';
import { MEDIA_TYPE_OPTIONS } from '../constants/media-type-options';

interface TypeFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

/** A fixed MIME-prefix filter (plain select — fixed coded enum, W5). */
export function TypeFilter({ value, onChange }: TypeFilterProps) {
  const { t } = useTranslation('media');
  return (
    <select
      aria-label={t('filters.type')}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || undefined)}
      className="h-10 rounded-input border border-border-2 bg-surface px-3 text-sm text-text focus-visible:border-accent-line focus-visible:outline-none"
    >
      {MEDIA_TYPE_OPTIONS.map((option) => (
        <option key={option.labelKey} value={option.value ?? ''}>
          {t(option.labelKey)}
        </option>
      ))}
    </select>
  );
}
