import { useTranslation } from 'react-i18next';
import { Input } from '../ui/input';
import { SelectField } from '../ui/select';
import type { FilterDef } from './types';

interface DataTableFilterControlProps {
  filter: FilterDef;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

/** The "All / Any" cleared state is a real sentinel option (Radix forbids an empty-string
 * item), mapped back to `undefined` on change. */
const ALL_VALUE = '__all__';

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
        <SelectField
          aria-label={filter.label}
          size="sm"
          value={value ?? ALL_VALUE}
          onValueChange={(next) =>
            onChange(next === ALL_VALUE ? undefined : next)
          }
          options={[
            { value: ALL_VALUE, label: t('filter.all') },
            ...(filter.options ?? []),
          ]}
        />
      </label>
    );
  }

  if (filter.kind === 'boolean') {
    return (
      <label className="flex flex-col gap-1 text-xs text-dim">
        <span>{filter.label}</span>
        <SelectField
          aria-label={filter.label}
          size="sm"
          value={value ?? ALL_VALUE}
          onValueChange={(next) =>
            onChange(next === ALL_VALUE ? undefined : next)
          }
          options={[
            { value: ALL_VALUE, label: t('filter.any') },
            { value: 'true', label: t('filter.yes') },
            { value: 'false', label: t('filter.no') },
          ]}
        />
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
