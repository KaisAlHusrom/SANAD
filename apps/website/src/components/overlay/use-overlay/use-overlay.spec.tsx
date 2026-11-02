import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { scrollLock } from '../../../motion/scroll';
import { OVERLAY_HOST_SELECTOR } from '../overlay.constants';
import { useOverlay } from './use-overlay';

afterEach(() => {
  cleanup();
  // The hosts are appended by hand, so RTL's cleanup does not remove them — and a leftover
  // `.sanad-web` would make the next test's `querySelector` resolve to a stale node.
  for (const host of document.querySelectorAll(OVERLAY_HOST_SELECTOR)) {
    host.remove();
  }
});

/** The layout's `.sanad-web` token scope, which the portal must resolve to. */
function renderInHost(ui: React.ReactElement) {
  const host = document.createElement('div');
  host.className = OVERLAY_HOST_SELECTOR.slice(1);
  document.body.append(host);
  return render(ui, { container: host });
}

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  const { portalTarget, dialogRef } = useOverlay({ open, onClose: close });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <button type="button">outside</button>
      {open && portalTarget ? (
        <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1}>
          <button type="button">first</button>
          <button type="button">last</button>
        </div>
      ) : null}
    </>
  );
}

describe('useOverlay', () => {
  it('resolves the portal target to the token scope, never to document.body', () => {
    let seen: Element | null = null;
    function Probe() {
      const { portalTarget } = useOverlay({
        open: true,
        onClose: () => undefined,
      });
      seen = portalTarget;
      return null;
    }
    const { container } = renderInHost(<Probe />);
    expect(seen).toBe(container);
    expect(seen).not.toBe(document.body);
  });

  // The portal target resolves in an effect, so a dialog that is open on its FIRST render has no
  // node yet when the trap effect first runs. Keyed on `open` alone it never re-ran — the dialog
  // rendered, but nothing was focused, Escape did nothing, and the page kept scrolling.
  it('traps an overlay that was already open on its first render', () => {
    function AlwaysOpen() {
      const { portalTarget, dialogRef } = useOverlay({
        open: true,
        onClose: () => undefined,
      });
      if (!portalTarget) return null;
      return (
        <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1}>
          <button type="button">inside</button>
        </div>
      );
    }
    renderInHost(<AlwaysOpen />);

    expect(screen.getByRole('dialog')).toHaveFocus();
    expect(scrollLock.isLocked()).toBe(true);
  });

  it('moves focus into the dialog and returns it to the trigger on close', async () => {
    const user = userEvent.setup();
    renderInHost(<Harness />);
    const trigger = screen.getByRole('button', { name: 'open' });

    await user.click(trigger);
    expect(screen.getByRole('dialog')).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  // UniverseNavigator's flight-skip and MotionProvider's scroll keys are both bubble-phase
  // listeners on `window`. Escape belongs to the topmost surface, so it must never reach them.
  it('stops Escape from reaching the window listeners behind it', async () => {
    const user = userEvent.setup();
    const onWindowKey = vi.fn();
    window.addEventListener('keydown', onWindowKey);

    renderInHost(<Harness />);
    await user.click(screen.getByRole('button', { name: 'open' }));
    onWindowKey.mockClear();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onWindowKey).not.toHaveBeenCalled();
    window.removeEventListener('keydown', onWindowKey);
  });

  it('cycles Tab inside the dialog in both directions', async () => {
    const user = userEvent.setup();
    renderInHost(<Harness />);
    await user.click(screen.getByRole('button', { name: 'open' }));

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'last' });

    await user.tab();
    expect(first).toHaveFocus();
    await user.tab();
    expect(last).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();

    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  // The belt a Tab handler alone cannot provide — focus arriving from browser chrome, or a
  // `.focus()` call from another component's effect.
  it('pulls focus back when something outside steals it', async () => {
    const user = userEvent.setup();
    renderInHost(<Harness />);
    await user.click(screen.getByRole('button', { name: 'open' }));

    screen.getByRole('button', { name: 'outside' }).focus();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('holds the page-scroll lock only while open', async () => {
    const user = userEvent.setup();
    renderInHost(<Harness />);
    expect(scrollLock.isLocked()).toBe(false);

    await user.click(screen.getByRole('button', { name: 'open' }));
    expect(scrollLock.isLocked()).toBe(true);

    await user.keyboard('{Escape}');
    expect(scrollLock.isLocked()).toBe(false);
  });

  it('releases the lock when the host unmounts while still open', async () => {
    const user = userEvent.setup();
    const { unmount } = renderInHost(<Harness />);
    await user.click(screen.getByRole('button', { name: 'open' }));
    expect(scrollLock.isLocked()).toBe(true);

    unmount();
    expect(scrollLock.isLocked()).toBe(false);
  });
});
