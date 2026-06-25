import type { FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';
import type { FieldConfig, FormMode } from './field.types';

export interface DynamicFormProps<TValues extends FieldValues> {
  fields: FieldConfig<TValues>[];
  /** The caller's Zod schema (single source of truth, U16) — drives validation + types. */
  schema: ZodType<TValues>;
  mode: FormMode;
  /** Edit prefill: the record's values (incl. a `translations` map for translatable fields). */
  record?: Record<string, unknown>;
  /** Submit the validated values (e.g. `createMutation(v).unwrap()` / update with id). */
  submit: (values: TValues) => Promise<unknown>;
  /** Toast shown on success. */
  successMessage: string;
  onSuccess?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export interface DynamicFormModalData {
  mode: FormMode;
  record?: Record<string, unknown>;
}
