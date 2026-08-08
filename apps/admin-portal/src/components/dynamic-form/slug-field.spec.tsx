import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { DynamicForm } from './dynamic-form';
import type { FieldConfig } from './field.types';

const schema = z
  .object({ title: z.string().optional(), slug: z.string().optional() })
  .strict();
type Values = z.infer<typeof schema>;

const fields: FieldConfig<Values>[] = [
  { name: 'title', type: 'text', label: 'Title' },
  { name: 'slug', type: 'slug', label: 'Slug', slugSource: ['title'] },
];

function renderForm(mode: 'create' | 'edit', record?: Record<string, unknown>) {
  renderWithProviders(
    <DynamicForm
      fields={fields}
      schema={schema}
      mode={mode}
      record={record}
      submit={vi.fn()}
      successMessage="Saved"
    />,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('SlugField', () => {
  it('auto-derives the slug from the title in create mode', async () => {
    const user = userEvent.setup();
    renderForm('create');
    await user.type(screen.getByLabelText('Title'), 'Hello World');
    expect(screen.getByLabelText('Slug')).toHaveValue('hello-world');
  });

  it('transliterates an Arabic title to a latin slug', async () => {
    const user = userEvent.setup();
    renderForm('create');
    await user.type(screen.getByLabelText('Title'), 'سند');
    expect((screen.getByLabelText('Slug') as HTMLInputElement).value).toMatch(
      /^[a-z0-9-]+$/,
    );
  });

  it('stops auto-syncing once the slug is edited manually', async () => {
    const user = userEvent.setup();
    renderForm('create');
    const slug = screen.getByLabelText('Slug');
    await user.type(screen.getByLabelText('Title'), 'First');
    expect(slug).toHaveValue('first');
    await user.clear(slug);
    await user.type(slug, 'custom-slug');
    await user.type(screen.getByLabelText('Title'), ' Second');
    expect(slug).toHaveValue('custom-slug');
  });

  it('regenerates from the title via the wand button', async () => {
    const user = userEvent.setup();
    renderForm('create');
    const slug = screen.getByLabelText('Slug');
    await user.type(screen.getByLabelText('Title'), 'My Post');
    await user.clear(slug);
    await user.type(slug, 'override');
    await user.click(screen.getByRole('button', { name: /regenerate/i }));
    expect(slug).toHaveValue('my-post');
  });

  it('does not clobber an existing slug in edit mode', async () => {
    const user = userEvent.setup();
    renderForm('edit', { title: 'Some Title', slug: 'existing-slug' });
    const slug = screen.getByLabelText('Slug');
    expect(slug).toHaveValue('existing-slug');
    await user.type(screen.getByLabelText('Title'), ' Changed');
    expect(slug).toHaveValue('existing-slug');
  });
});
