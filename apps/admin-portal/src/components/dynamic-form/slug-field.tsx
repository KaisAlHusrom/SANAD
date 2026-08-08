import { Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Controller,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { slugify } from '../../lib/slugify';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { FieldConfig, FormMode } from './field.types';

interface SlugFieldProps<TValues extends FieldValues> {
  field: FieldConfig<TValues>;
  name: Path<TValues>;
  form: UseFormReturn<TValues>;
  mode: FormMode;
  disabled: boolean;
}

/**
 * Smart slug control (U21 UX): auto-derives a contract-valid slug from its `slugSource`
 * title field(s) via `slugify` (Arabic→latin, U8) while the user hasn't touched it; the
 * first manual edit stops the sync, and the wand button re-derives on demand. In edit mode
 * it starts "touched" so an existing published slug is never silently rewritten.
 */
export function SlugField<TValues extends FieldValues>({
  field,
  name,
  form,
  mode,
  disabled,
}: SlugFieldProps<TValues>) {
  const { t } = useTranslation('uiKit');
  const [auto, setAuto] = useState(mode === 'create');

  const sources: Path<TValues>[] = field.slugSource
    ? Array.isArray(field.slugSource)
      ? field.slugSource
      : [field.slugSource]
    : [];
  const watched = form.watch(sources);
  const sourceText =
    (watched.find((value) => typeof value === 'string' && value.trim()) as
      | string
      | undefined) ?? '';

  const setSlug = (value: string): void =>
    form.setValue(name, value as PathValue<TValues, Path<TValues>>, {
      shouldDirty: true,
      shouldValidate: true,
    });

  // While auto-syncing, mirror the title into the slug as the user types it.
  useEffect(() => {
    if (auto && sourceText) setSlug(slugify(sourceText));
  }, [auto, sourceText]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Controller
          control={form.control}
          name={name}
          render={({ field: controlled }) => (
            <Input
              id={name}
              value={
                typeof controlled.value === 'string' ? controlled.value : ''
              }
              placeholder={field.placeholder}
              disabled={disabled}
              dir="ltr"
              onChange={(event) => {
                setAuto(false);
                controlled.onChange(event.target.value);
              }}
            />
          )}
        />
        {sources.length ? (
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || !sourceText}
            aria-label={t('form.regenerateSlug')}
            title={t('form.regenerateSlug')}
            onClick={() => {
              setAuto(true);
              setSlug(slugify(sourceText));
            }}
          >
            <Wand2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      {auto && sources.length ? (
        <p className="text-xs text-dim">{t('form.slugAuto')}</p>
      ) : null}
    </div>
  );
}
