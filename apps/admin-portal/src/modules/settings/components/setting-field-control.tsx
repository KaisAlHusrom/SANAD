import * as Label from '@radix-ui/react-label';
import type { SettingField } from '@sanad/contracts';
import type { ReactNode } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MediaPickerField } from '../../../components/media-picker';
import { ColorInput } from '../../../components/ui/color-input';
import { Input } from '../../../components/ui/input';
import { LocaleTabs } from '../../../components/ui/locale-tabs';
import { SelectField } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { fieldId, type SectionFormValues } from '../lib/setting-form';

interface SettingFieldControlProps {
  field: SettingField;
  form: UseFormReturn<SectionFormValues>;
}

/**
 * Renders one setting by its descriptor `type`, bound to RHF — the real typed control per
 * kind (U21: never a raw control): color → ColorInput, boolean → Switch, select → SelectField,
 * image → MediaPickerField (W5 library picker), localized_text → per-locale inputs under
 * LocaleTabs (W6), else a token Input. The label comes from i18n keyed by the setting key.
 */
export function SettingFieldControl({ field, form }: SettingFieldControlProps) {
  const { t } = useTranslation('settings');
  const id = fieldId(field.key);
  const label = t(`field.${field.key}`);

  if (field.type === 'localized_text') {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-dim">{label}</span>
        <LocaleTabs>
          {(locale) => (
            <Input
              aria-label={`${label} (${locale})`}
              {...form.register(`${id}.${locale}`)}
            />
          )}
        </LocaleTabs>
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <Controller
          control={form.control}
          name={id}
          render={({ field: control }) => (
            <Switch
              checked={control.value === true}
              onCheckedChange={control.onChange}
              aria-label={label}
            />
          )}
        />
        <Label.Root htmlFor={id} className="text-sm text-dim">
          {label}
        </Label.Root>
      </div>
    );
  }

  const labelled = (control: ReactNode): ReactNode => (
    <div className="flex flex-col gap-1.5">
      <Label.Root htmlFor={id} className="text-sm text-dim">
        {label}
      </Label.Root>
      {control}
    </div>
  );

  if (field.type === 'color') {
    return labelled(
      <Controller
        control={form.control}
        name={id}
        render={({ field: control }) => (
          <ColorInput
            value={typeof control.value === 'string' ? control.value : ''}
            onChange={control.onChange}
            aria-label={label}
          />
        )}
      />,
    );
  }

  if (field.type === 'select') {
    return labelled(
      <Controller
        control={form.control}
        name={id}
        render={({ field: control }) => (
          <SelectField
            id={id}
            aria-label={label}
            value={
              typeof control.value === 'string' ? control.value : undefined
            }
            onValueChange={control.onChange}
            options={(field.options ?? []).map((option) => ({
              value: option,
              label: option,
            }))}
          />
        )}
      />,
    );
  }

  if (field.type === 'image') {
    return labelled(
      <Controller
        control={form.control}
        name={id}
        render={({ field: control }) => (
          <MediaPickerField
            id={id}
            value={typeof control.value === 'string' ? control.value : ''}
            onChange={control.onChange}
            placeholder={t('placeholder.url')}
          />
        )}
      />,
    );
  }

  // text / url / number
  const inputType =
    field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text';
  return labelled(
    <Input
      id={id}
      type={inputType}
      // A descriptor-declared range: the backend rejects out-of-range with a named message, so
      // the control shows the same bounds rather than letting the admin discover them on Save.
      min={field.type === 'number' ? field.min : undefined}
      max={field.type === 'number' ? field.max : undefined}
      placeholder={field.type === 'url' ? t('placeholder.url') : undefined}
      {...form.register(
        id,
        field.type === 'number' ? { valueAsNumber: true } : {},
      )}
    />,
  );
}
