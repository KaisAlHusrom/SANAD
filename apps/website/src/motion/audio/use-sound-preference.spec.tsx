import { describe, expect, it, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SOUND_PREF_KEY, useSoundPreference } from './use-sound-preference';

function Probe() {
  const [enabled, setEnabled] = useSoundPreference();
  return (
    <button type="button" onClick={() => setEnabled(!enabled)}>
      {enabled ? 'on' : 'off'}
    </button>
  );
}

describe('useSoundPreference (WEB8 — persisted, default OFF)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to OFF when nothing is stored', () => {
    render(<Probe />);
    expect(screen.getByRole('button')).toHaveTextContent('off');
  });

  it('persists the choice to localStorage', async () => {
    render(<Probe />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('on');
    expect(window.localStorage.getItem(SOUND_PREF_KEY)).toBe('true');
  });

  it('hydrates a stored ON preference on mount', async () => {
    window.localStorage.setItem(SOUND_PREF_KEY, 'true');
    await act(async () => {
      render(<Probe />);
    });
    await waitFor(() =>
      expect(screen.getByRole('button')).toHaveTextContent('on'),
    );
  });
});
