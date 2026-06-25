import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { toastStore } from '../../data/toast';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { DynamicForm } from './dynamic-form';
import type { FieldConfig } from './field.types';

const schema = z
  .object({
    title: z.string().min(1),
    status: z.string().optional(),
    featured: z.boolean().optional(),
    password: z.string().optional(),
    custom: z.string().optional(),
    translations: z
      .record(z.string(), z.record(z.string(), z.string()))
      .optional(),
  })
  .strict();
type Values = z.infer<typeof schema>;

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  toastStore.reset();
});

describe('DynamicForm', () => {
  it('renders inputs by type', () => {
    const fields: FieldConfig<Values>[] = [
      { name: 'title', type: 'text', label: 'Title' },
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [{ value: 'draft', label: 'Draft' }],
      },
      { name: 'featured', type: 'toggle', label: 'Featured' },
    ];
    renderWithProviders(
      <DynamicForm
        fields={fields}
        schema={schema}
        mode="create"
        submit={vi.fn()}
        successMessage="Saved"
      />,
    );
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Featured' }),
    ).toBeInTheDocument();
  });

  it('fills a password field via the generate button', async () => {
    const fields: FieldConfig<Values>[] = [
      { name: 'password', type: 'password', label: 'Password', generate: true },
    ];
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicForm
        fields={fields}
        schema={schema}
        mode="create"
        submit={vi.fn()}
        successMessage="Saved"
      />,
    );
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    await user.click(screen.getByRole('button', { name: 'Generate' }));
    expect(input.value.length).toBeGreaterThan(0);
  });

  it('groups translatable fields under locale tabs (W6)', () => {
    const fields: FieldConfig<Values>[] = [
      { name: 'title', type: 'text', label: 'Title', translatable: true },
    ];
    renderWithProviders(
      <DynamicForm
        fields={fields}
        schema={schema}
        mode="create"
        submit={vi.fn()}
        successMessage="Saved"
      />,
    );
    expect(screen.getByRole('tab', { name: 'العربية' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'English' })).toBeInTheDocument();
  });

  it('renders a custom field via its render prop', () => {
    const fields: FieldConfig<Values>[] = [
      {
        name: 'custom',
        type: 'custom',
        label: 'Custom',
        render: () => <div data-testid="custom-control">picker</div>,
      },
    ];
    renderWithProviders(
      <DynamicForm
        fields={fields}
        schema={schema}
        mode="create"
        submit={vi.fn()}
        successMessage="Saved"
      />,
    );
    expect(screen.getByTestId('custom-control')).toBeInTheDocument();
  });

  it('blocks an invalid submit and lets a valid one through', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const fields: FieldConfig<Values>[] = [
      { name: 'title', type: 'text', label: 'Title' },
    ];
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicForm
        fields={fields}
        schema={schema}
        mode="create"
        submit={submit}
        successMessage="Saved"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(submit).not.toHaveBeenCalled());
    await user.type(screen.getByLabelText('Title'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
  });
});
