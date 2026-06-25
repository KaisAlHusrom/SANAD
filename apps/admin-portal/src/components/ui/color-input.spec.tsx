import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorInput } from './color-input';
import { expandHex, isHexColor } from './hex-color';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hex-color helpers', () => {
  it('accepts 3- and 6-digit hex, rejects everything else', () => {
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('#22d3ee')).toBe(true);
    expect(isHexColor('22d3ee')).toBe(false);
    expect(isHexColor('#xyz')).toBe(false);
    expect(isHexColor('#1234')).toBe(false);
    expect(isHexColor('')).toBe(false);
  });

  it('expands shorthand hex to 6 digits', () => {
    expect(expandHex('#abc')).toBe('#aabbcc');
    expect(expandHex('#22d3ee')).toBe('#22d3ee');
    expect(expandHex('not-hex')).toBe('not-hex');
  });
});

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return <ColorInput value={value} onChange={setValue} aria-label="Primary" />;
}

describe('ColorInput', () => {
  it('keeps the native swatch in sync with the hex text (expanding shorthand)', () => {
    render(<Harness initial="#abc" />);
    const swatch = screen.getByLabelText('Primary swatch') as HTMLInputElement;
    expect(swatch.value).toBe('#aabbcc');
  });

  it('reports the typed value through onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ColorInput value="" onChange={onChange} aria-label="Primary" />);

    await user.type(screen.getByLabelText('Primary'), '#');

    expect(onChange).toHaveBeenCalledWith('#');
  });

  it('flags an invalid hex as aria-invalid and falls the swatch back', () => {
    render(<ColorInput value="nope" onChange={vi.fn()} aria-label="Primary" />);
    expect(screen.getByLabelText('Primary')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(
      (screen.getByLabelText('Primary swatch') as HTMLInputElement).value,
    ).toBe('#000000');
  });
});
