import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { toast } from '../../data/toast';
import type { ApiError } from '../../data/types/api-error.types';
import { i18n } from '../../i18n';
import type { FieldConfig } from './field.types';
import { useDynamicForm } from './use-dynamic-form';

const schema = z
  .object({
    title: z.string().min(1),
    country: z.string().optional(),
    city: z.string().optional(),
    premium: z.boolean().optional(),
  })
  .strict();
type Values = z.infer<typeof schema>;

function wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const baseFields: FieldConfig<Values>[] = [
  { name: 'title', type: 'text', label: 'Title' },
];

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDynamicForm', () => {
  it('submits create values, toasts success, and calls onSuccess', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const success = vi.spyOn(toast, 'success').mockReturnValue('id');
    const { result } = renderHook(
      () =>
        useDynamicForm<Values>({
          fields: baseFields,
          schema,
          mode: 'create',
          submit,
          successMessage: 'Saved',
          onSuccess,
        }),
      { wrapper },
    );
    act(() => result.current.form.setValue('title', 'Hello'));
    await act(async () => {
      await result.current.onSubmit();
    });
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Hello' }),
    );
    expect(success).toHaveBeenCalledWith('Saved');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('prefills from a record on edit', () => {
    const { result } = renderHook(
      () =>
        useDynamicForm<Values>({
          fields: baseFields,
          schema,
          mode: 'edit',
          record: { title: 'Existing' },
          submit: vi.fn(),
          successMessage: 'Saved',
        }),
      { wrapper },
    );
    expect(result.current.form.getValues('title')).toBe('Existing');
  });

  it('maps an ApiError.fields rejection to per-field errors', async () => {
    const error: ApiError = {
      status: 422,
      message: 'Invalid',
      fields: { title: 'Already taken' },
    };
    const submit = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(
      () =>
        useDynamicForm<Values>({
          fields: baseFields,
          schema,
          mode: 'create',
          submit,
          successMessage: 'Saved',
        }),
      { wrapper },
    );
    act(() => result.current.form.setValue('title', 'Dup'));
    await act(async () => {
      await result.current.onSubmit();
    });
    await waitFor(() =>
      expect(result.current.form.formState.errors.title?.message).toBe(
        'Already taken',
      ),
    );
  });

  it('maps a fieldless error to a root error + toast', async () => {
    const error: ApiError = { status: 500, message: 'Server boom' };
    const submit = vi.fn().mockRejectedValue(error);
    const toastError = vi.spyOn(toast, 'error').mockReturnValue('id');
    const { result } = renderHook(
      () =>
        useDynamicForm<Values>({
          fields: baseFields,
          schema,
          mode: 'create',
          submit,
          successMessage: 'Saved',
        }),
      { wrapper },
    );
    act(() => result.current.form.setValue('title', 'X'));
    await act(async () => {
      await result.current.onSubmit();
    });
    await waitFor(() =>
      expect(result.current.form.formState.errors.root?.message).toBe(
        'Server boom',
      ),
    );
    expect(toastError).toHaveBeenCalledWith('Server boom');
  });

  it('resets a dependent field when its parent changes (cascading)', async () => {
    const fields: FieldConfig<Values>[] = [
      { name: 'country', type: 'select', label: 'Country' },
      { name: 'city', type: 'select', label: 'City', dependsOn: 'country' },
    ];
    const { result } = renderHook(
      () =>
        useDynamicForm<Values>({
          fields,
          schema,
          mode: 'create',
          submit: vi.fn(),
          successMessage: 'Saved',
        }),
      { wrapper },
    );
    act(() => result.current.form.setValue('city', 'Paris'));
    expect(result.current.form.getValues('city')).toBe('Paris');
    act(() => result.current.form.setValue('country', 'France'));
    await waitFor(() => expect(result.current.form.getValues('city')).toBe(''));
  });

  it('filters fields by mode and visibleWhen', () => {
    const fields: FieldConfig<Values>[] = [
      { name: 'title', type: 'text', label: 'Title' },
      {
        name: 'country',
        type: 'select',
        label: 'Country',
        showInCreate: false,
      },
      {
        name: 'city',
        type: 'select',
        label: 'City',
        visibleWhen: (values) => values.premium === true,
      },
    ];
    const { result } = renderHook(
      () =>
        useDynamicForm<Values>({
          fields,
          schema,
          mode: 'create',
          submit: vi.fn(),
          successMessage: 'Saved',
        }),
      { wrapper },
    );
    const names = result.current.visibleFields.map((field) => field.name);
    expect(names).toContain('title');
    expect(names).not.toContain('country');
    expect(names).not.toContain('city');
  });
});
