import { useTranslation } from 'react-i18next';
import { Input } from '../ui/input';
import type { FilterDef } from './types';

interface DataTableFilterControlProps {
  filter: FilterDef;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const selectClass =
  'h-9 rounded-input border border-border-2 bg-surface px-2 text-sm text-text focus-visible:border-accent-line focus-visible:outline-none';

/**
 * One whitelisted filter control (N7), rendered by kind: select / boolean (plain selects —
 * fixed coded enums, W5), free-text search, and range / date-range (two inputs combined
 * into a single `from:to` param). Caller-translated labels (U8).
 */
export function DataTableFilterControl({
  filter,
  value,
  onChange,
}: DataTableFilterControlProps) {
  const { t } = useTranslation('uiKit');

  if (filter.kind === 'select') {
    return (
      <label className="flex flex-col gap-1 text-xs text-dim">
        <span>{filter.label}</span>
        <select
          aria-label={filter.label}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value || undefined)}
          className={selectClass}
        >
          <option value="">{t('filter.all')}</option>
          {(filter.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (filter.kind === 'boolean') {
    return (
      <label className="flex flex-col gap-1 text-xs text-dim">
        <span>{filter.label}</span>
        <select
          aria-label={filter.label}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value || undefined)}
          className={selectClass}
        >
          <option value="">{t('filter.any')}</option>
          <option value="true">{t('filter.yes')}</option>
          <option value="false">{t('filter.no')}</option>
        </select>
      </label>
    );
  }

  if (filter.kind === 'search') {
    return (
      <label className="flex flex-col gap-1 text-xs text-dim">
        <span>{filter.label}</span>
        <Input
          aria-label={filter.label}
          value={value ?? ''}
          placeholder={filter.label}
          onChange={(event) => onChange(event.target.value || undefined)}
          className="h-9"
        />
      </label>
    );
  }

  // range / date-range — two bounds combined into one `from:to` param.
  const [from = '', to = ''] = (value ?? '').split(':');
  const inputType = filter.kind === 'date-range' ? 'date' : 'number';
  const emit = (nextFrom: string, nextTo: string): void => {
    onChange(nextFrom || nextTo ? `${nextFrom}:${nextTo}` : undefined);
  };

  return (
    <fieldset className="flex flex-col gap-1 text-xs text-dim">
      <legend>{filter.label}</legend>
      <div className="flex items-center gap-1">
        <Input
          type={inputType}
          aria-label={`${filter.label} ${t('filter.from')}`}
          value={from}
          onChange={(event) => emit(event.target.value, to)}
          className="h-9"
        />
        <Input
          type={inputType}
          aria-label={`${filter.label} ${t('filter.to')}`}
          value={to}
          onChange={(event) => emit(from, event.target.value)}
          className="h-9"
        />
      </div>
    </fieldset>
  );
}
