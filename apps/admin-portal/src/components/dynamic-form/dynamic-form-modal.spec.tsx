import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { toastStore } from '../../data/toast';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { DynamicFormModal } from './dynamic-form-modal';
import type { FieldConfig } from './field.types';

const schema = z.object({ title: z.string().min(1) }).strict();
type Values = z.infer<typeof schema>;
const fields: FieldConfig<Values>[] = [
  { name: 'title', type: 'text', label: 'Title' },
];

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  toastStore.reset();
});

describe('DynamicFormModal', () => {
  it('renders the form in a dialog and closes on cancel', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicFormModal
        open
        onClose={onClose}
        title="New post"
        fields={fields}
        schema={schema}
        mode="create"
        submit={vi.fn()}
        successMessage="Saved"
      />,
    );
    expect(screen.getByText('New post')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes after a successful submit', async () => {
    const onClose = vi.fn();
    const submit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicFormModal
        open
        onClose={onClose}
        title="New post"
        fields={fields}
        schema={schema}
        mode="create"
        submit={submit}
        successMessage="Saved"
      />,
    );
    await user.type(screen.getByLabelText('Title'), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
