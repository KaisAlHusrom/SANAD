import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhoneLink } from './phone-link';

describe('PhoneLink', () => {
  it('renders a stored E.164 number readable, and dials it', () => {
    render(<PhoneLink value="+966501234567" fallback="—" />);
    const link = screen.getByRole('link', { name: '+966 50 123 4567' });
    expect(link).toHaveAttribute('href', 'tel:+966501234567');
    expect(link).toHaveAttribute('dir', 'ltr');
  });

  it('falls back to plain text when there is no number', () => {
    render(<PhoneLink value={null} fallback="—" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders an unparseable stored value as itself rather than nothing (U23)', () => {
    render(<PhoneLink value="12345" fallback="—" />);
    expect(screen.getByRole('link', { name: '12345' })).toHaveAttribute(
      'href',
      'tel:12345',
    );
  });
});
