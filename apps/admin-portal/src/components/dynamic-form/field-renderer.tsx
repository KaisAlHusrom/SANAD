import * as Label from '@radix-ui/react-label';
import { useTranslation } from 'react-i18next';
import {
  Controller,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form';
import { ColorInput } from '../ui/color-input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { SelectField } from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import type { FieldConfig, FormMode } from './field.types';
import { SlugField } from './slug-field';

const PASSWORD_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';

/** Generate a strong password using the Web Crypto RNG (never `Math.random`). */
function generatePassword(length = 16): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) {
    out += PASSWORD_CHARS.charAt(byte % PASSWORD_CHARS.length);
  }
  return out;
}

interface FieldRendererProps<TValues extends FieldValues> {
  field: FieldConfig<TValues>;
  /** The RHF path (locale-scoped for translatable fields). */
  name: string;
  form: UseFormReturn<TValues>;
  mode: FormMode;
}

/**
 * Renders one form field by its type, bound to RHF (register for native inputs, Controller
 * for the Radix/token controls). Tokens-only, i18n labels, per-field error display. The
 * `custom` type delegates to the field's render prop (e.g. a `<ServerSelect>`, W5).
 */
export function FieldRenderer<TValues extends FieldValues>({
  field,
  name,
  form,
  mode,
}: FieldRendererProps<TValues>) {
  const { t } = useTranslation('uiKit');
  const path = name as Path<TValues>;
  const values = form.watch();
  const disabled = field.disabledWhen?.(values) ?? false;
  const { error } = form.getFieldState(path, form.formState);
  const options = field.getOptions
    ? field.getOptions(values)
    : (field.options ?? []);

  const labelNode = (
    <Label.Root htmlFor={name} className="text-sm text-dim">
      {field.label}
    </Label.Root>
  );
  const errorNode = error?.message ? (
    <p className="text-sm text-bad" role="alert">
      {error.message}
    </p>
  ) : null;

  if (field.type === 'custom') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        {field.render?.({ form, name: path, mode })}
        {errorNode}
      </div>
    );
  }

  if (field.type === 'slug') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <SlugField
          field={field}
          name={path}
          form={form}
          mode={mode}
          disabled={disabled}
        />
        {errorNode}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <Textarea
          id={name}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          disabled={disabled}
          {...form.register(path)}
        />
        {errorNode}
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <Controller
          control={form.control}
          name={path}
          render={({ field: controlled }) => (
            <SelectField
              id={name}
              aria-label={field.label}
              disabled={disabled}
              placeholder={field.placeholder ?? t('form.selectPlaceholder')}
              value={
                typeof controlled.value === 'string'
                  ? controlled.value
                  : undefined
              }
              onValueChange={controlled.onChange}
              options={options}
            />
          )}
        />
        {errorNode}
      </div>
    );
  }

  if (field.type === 'multi-select') {
    return (
      <Controller
        control={form.control}
        name={path}
        render={({ field: controlled }) => {
          const selected: string[] = Array.isArray(controlled.value)
            ? controlled.value
            : [];
          const toggle = (value: string): void => {
            controlled.onChange(
              selected.includes(value)
                ? selected.filter((entry) => entry !== value)
                : [...selected, value],
            );
          };
          return (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-sm text-dim">{field.label}</legend>
              <div className="flex flex-wrap gap-3">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-text"
                  >
                    <Checkbox
                      checked={selected.includes(option.value)}
                      onCheckedChange={() => toggle(option.value)}
                      disabled={disabled}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errorNode}
            </fieldset>
          );
        }}
      />
    );
  }

  if (field.type === 'checkbox' || field.type === 'toggle') {
    const Control = field.type === 'toggle' ? Switch : Checkbox;
    return (
      <div className="flex items-center gap-2">
        <Controller
          control={form.control}
          name={path}
          render={({ field: controlled }) => (
            <Control
              checked={Boolean(controlled.value)}
              onCheckedChange={(next) => controlled.onChange(next)}
              disabled={disabled}
              aria-label={field.label}
            />
          )}
        />
        {labelNode}
      </div>
    );
  }

  if (field.type === 'color') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <Controller
          control={form.control}
          name={path}
          render={({ field: controlled }) => (
            <ColorInput
              value={
                typeof controlled.value === 'string' ? controlled.value : ''
              }
              onChange={controlled.onChange}
              aria-label={field.label}
            />
          )}
        />
        {errorNode}
      </div>
    );
  }

  if (field.type === 'image') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelNode}
        <Controller
          control={form.control}
          name={path}
          render={({ field: controlled }) => {
            const url =
              typeof controlled.value === 'string' ? controlled.value : '';
            return (
              <div className="flex items-center gap-3">
                {url ? (
                  <img
                    src={url}
                    alt=""
                    className="size-16 rounded-input border border-border-2 object-cover"
                  />
                ) : null}
                <label className="cursor-pointer text-sm text-accent">
                  {url ? t('form.changeImage') : t('form.uploadImage')}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={field.label}
                    disabled={disabled}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (file && field.upload) {
                        controlled.onChange(await field.upload(file));
                      }
                    }}
                  />
                </label>
              </div>
            );
          }}
        />
        {errorNode}
      </div>
    );
  }

  // text / email / number / password
  const inputType =
    field.type === 'email'
      ? 'email'
      : field.type === 'number'
        ? 'number'
        : field.type === 'password'
          ? 'password'
          : 'text';

  return (
    <div className="flex flex-col gap-1.5">
      {labelNode}
      <div className="flex items-center gap-2">
        <Input
          id={name}
          type={inputType}
          placeholder={field.placeholder}
          disabled={disabled}
          autoComplete={field.type === 'password' ? 'new-password' : undefined}
          {...form.register(path)}
        />
        {field.type === 'password' && field.generate ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              form.setValue(
                path,
                generatePassword() as PathValue<TValues, Path<TValues>>,
                { shouldDirty: true, shouldValidate: true },
              )
            }
          >
            {t('form.generate')}
          </Button>
        ) : null}
      </div>
      {errorNode}
    </div>
  );
}
