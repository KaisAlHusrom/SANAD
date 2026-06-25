import type { ReactNode } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

/**
 * The field kinds the DynamicForm renders natively. `server-select` / rich-text / any
 * bespoke control is wired through a `custom` field (so the strict typing holds and the
 * kit stays decoupled — the caller drops in `<ServerSelect>` with its own W5 hooks).
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'checkbox'
  | 'toggle'
  | 'date'
  | 'color'
  | 'image'
  | 'custom'
  | 'hidden';

export type FormMode = 'create' | 'edit';

export interface SelectOption {
  value: string;
  label: string;
}

/** Args passed to a `custom` field's render prop (server-select, rich-text, …). */
export interface FieldRenderArgs<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  name: Path<TValues>;
  mode: FormMode;
}

export interface FieldConfig<TValues extends FieldValues> {
  name: Path<TValues>;
  type: FieldType;
  label: string;
  placeholder?: string;
  /** Grid span 1–4 (the form is a 4-column grid; default 4 = full row). */
  colSpan?: 1 | 2 | 3 | 4;
  /** Rendered once per locale inside LocaleTabs (W6), bound to `translations.<locale>.<name>`. */
  translatable?: boolean;
  /** Default true — set false to omit the field in that mode. */
  showInCreate?: boolean;
  showInEdit?: boolean;
  visibleWhen?: (values: TValues) => boolean;
  disabledWhen?: (values: TValues) => boolean;
  /** When this parent field changes, the dependent resets to its default (cascading). */
  dependsOn?: Path<TValues>;
  options?: SelectOption[];
  /** Cascading options computed from the current form values. */
  getOptions?: (values: TValues) => SelectOption[];
  rows?: number;
  /** Password fields: show a "generate" button. */
  generate?: boolean;
  /** `custom` fields: render any control bound to the form (e.g. `<ServerSelect>`). */
  render?: (args: FieldRenderArgs<TValues>) => ReactNode;
  /** `image` fields: upload a File → its URL (presigned R2 via the caller's media flow). */
  upload?: (file: File) => Promise<string>;
  defaultValue?: unknown;
}
