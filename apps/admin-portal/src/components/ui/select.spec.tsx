import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { selectOption } from '../../test/select-option';
import { SelectField } from './select';

const OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

describe('SelectField', () => {
  it('exposes a combobox named by aria-label and shows the placeholder when unset', () => {
    render(
      <SelectField
        aria-label="Status"
        placeholder="Pick one"
        options={OPTIONS}
        value={undefined}
        onValueChange={vi.fn()}
      />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Status' });
    expect(trigger).toHaveTextContent('Pick one');
  });

  it('keeps options out of the DOM until opened, then exposes them as options', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        aria-label="Status"
        options={OPTIONS}
        value={undefined}
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole('option', { name: 'Draft' })).toBeNull();
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    expect(
      await screen.findByRole('option', { name: 'Published' }),
    ).toBeInTheDocument();
  });

  it('emits the chosen value', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectField
        aria-label="Status"
        options={OPTIONS}
        value={undefined}
        onValueChange={onValueChange}
      />,
    );
    await selectOption(user, 'Status', 'Published');
    expect(onValueChange).toHaveBeenCalledWith('published');
  });

  it('reflects the controlled value as the trigger label', () => {
    render(
      <SelectField
        aria-label="Status"
        options={OPTIONS}
        value="draft"
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent(
      'Draft',
    );
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        aria-label="Status"
        options={OPTIONS}
        value={undefined}
        onValueChange={vi.fn()}
        disabled
      />,
    );
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    expect(screen.queryByRole('option', { name: 'Draft' })).toBeNull();
  });

  it('applies the size variant to the trigger', () => {
    render(
      <SelectField
        aria-label="Rows"
        size="xs"
        options={[{ value: '10', label: '10' }]}
        value="10"
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Rows' })).toHaveClass('h-8');
  });

  it('drives a controlled caller (selection round-trips through state)', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState<string | undefined>(undefined);
      return (
        <SelectField
          aria-label="Status"
          placeholder="Pick one"
          options={OPTIONS}
          value={value}
          onValueChange={setValue}
        />
      );
    }
    render(<Harness />);
    await selectOption(user, 'Status', 'Draft');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent(
      'Draft',
    );
  });
});
