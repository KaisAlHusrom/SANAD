import { Controller, useFormContext, type FieldPath } from 'react-hook-form';
import { ColorInput } from '../../../components/ui/color-input';
import type { BrandingFormValues } from '../validation/branding-form.zod.types';

interface ColorFieldProps {
  name: FieldPath<BrandingFormValues>;
  label: string;
}

/** A labelled color swatch+hex field bound to a form path (presentational; ColorInput
 *  owns its sync logic, U5). Used for every brand color. */
export function ColorField({ name, label }: ColorFieldProps) {
  const { control } = useFormContext<BrandingFormValues>();
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-dim">{label}</label>
      <div className="w-56">
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <ColorInput
              value={field.value as string}
              onChange={field.onChange}
              aria-label={label}
            />
          )}
        />
      </div>
    </div>
  );
}
