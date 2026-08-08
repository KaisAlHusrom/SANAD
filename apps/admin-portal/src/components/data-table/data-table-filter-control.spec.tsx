import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { selectOption } from '../../test/select-option';
import { DataTableFilterControl } from './data-table-filter-control';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('DataTableFilterControl', () => {
  it('select emits the chosen value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DataTableFilterControl
        filter={{
          key: 'status',
          kind: 'select',
          label: 'Status',
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
          ],
        }}
        value={undefined}
        onChange={onChange}
      />,
    );
    await selectOption(user, 'Status', 'Published');
    expect(onChange).toHaveBeenCalledWith('published');
  });

  it('boolean renders Any / Yes / No', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DataTableFilterControl
        filter={{ key: 'featured', kind: 'boolean', label: 'Featured' }}
        value={undefined}
        onChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('combobox', { name: 'Featured' }));
    expect(
      await screen.findByRole('option', { name: 'Any' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'No' })).toBeInTheDocument();
  });

  it('range combines two inputs into a from:to value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DataTableFilterControl
        filter={{ key: 'price', kind: 'range', label: 'Price' }}
        value={undefined}
        onChange={onChange}
      />,
    );
    // The parent here doesn't echo `value` back, so assert the single-keystroke encoding.
    await user.type(screen.getByLabelText('Price From'), '5');
    expect(onChange).toHaveBeenLastCalledWith('5:');
  });
});
