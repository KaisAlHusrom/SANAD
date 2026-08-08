import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders a multiline textbox on the canon field shell', () => {
    render(<Textarea aria-label="Bio" />);
    const el = screen.getByRole('textbox', { name: 'Bio' });
    expect(el.tagName).toBe('TEXTAREA');
    expect(el).toHaveClass('bg-surface', 'border-border-2', 'rounded-input');
  });

  it('associates a label by id and forwards rows/placeholder/disabled', () => {
    render(
      <>
        <label htmlFor="bio">Bio</label>
        <Textarea id="bio" rows={6} placeholder="Tell us" disabled />
      </>,
    );
    const el = screen.getByLabelText('Bio');
    expect(el).toHaveAttribute('rows', '6');
    expect(el).toHaveAttribute('placeholder', 'Tell us');
    expect(el).toBeDisabled();
  });

  it('merges a caller className over the base (twMerge)', () => {
    render(<Textarea aria-label="Bio" className="border-bad" />);
    const el = screen.getByRole('textbox', { name: 'Bio' });
    expect(el).toHaveClass('border-bad');
    expect(el).not.toHaveClass('border-border-2');
  });

  it('works as an RHF-registered field (ref + change spread)', async () => {
    const user = userEvent.setup();
    function Harness() {
      const { register } = useForm<{ bio: string }>({
        defaultValues: { bio: '' },
      });
      return <Textarea aria-label="Bio" {...register('bio')} />;
    }
    render(<Harness />);
    const el = screen.getByRole('textbox', { name: 'Bio' });
    await user.type(el, 'hello');
    expect(el).toHaveValue('hello');
  });
});
