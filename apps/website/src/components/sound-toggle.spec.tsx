import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SoundToggle } from './sound-toggle';
import { SoundContext, type SoundContextValue } from '../motion/audio';
import { ar } from '../i18n/dictionaries/ar';

function renderToggle(overrides: Partial<SoundContextValue>) {
  const value: SoundContextValue = {
    engine: null,
    enabled: false,
    available: true,
    toggle: vi.fn(),
    ...overrides,
  };
  render(
    <SoundContext.Provider value={value}>
      <SoundToggle dict={ar} />
    </SoundContext.Provider>,
  );
  return value;
}

describe('SoundToggle (WEB8)', () => {
  it('defaults to the OFF label and aria-pressed=false', () => {
    renderToggle({ enabled: false });
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveTextContent(ar.audio.off);
  });

  it('shows the ON label + aria-pressed when enabled', () => {
    renderToggle({ enabled: true });
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveTextContent(ar.audio.on);
  });

  it('calls toggle on click when available', async () => {
    const { toggle } = renderToggle({ available: true });
    await userEvent.click(screen.getByRole('button'));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('is disabled and inert under calm mode (available=false)', async () => {
    const { toggle } = renderToggle({ available: false });
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn).catch(() => undefined);
    expect(toggle).not.toHaveBeenCalled();
  });
});
