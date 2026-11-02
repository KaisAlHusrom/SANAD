import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OVERLAY_HOST_SELECTOR } from '../overlay.constants';
import { OverlayDialog } from './overlay-dialog';

afterEach(() => {
  cleanup();
  for (const host of document.querySelectorAll(OVERLAY_HOST_SELECTOR)) {
    host.remove();
  }
});

function renderDialog(props: { open?: boolean; onClose?: () => void } = {}) {
  const host = document.createElement('div');
  host.className = OVERLAY_HOST_SELECTOR.slice(1);
  document.body.append(host);

  const result = render(
    <OverlayDialog
      open={props.open ?? true}
      onClose={props.onClose ?? (() => undefined)}
      labelledBy="dlg-title"
      describedBy="dlg-lead"
      header={<h2 id="dlg-title">Cookie preferences</h2>}
      footer={
        <button type="button" name="save">
          Save preferences
        </button>
      }
    >
      <p id="dlg-lead">Choose what we may use.</p>
    </OverlayDialog>,
    { container: host },
  );
  return { ...result, host };
}

describe('OverlayDialog', () => {
  it('renders nothing at all while closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('portals into the token scope, never into document.body', () => {
    const { host } = renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(host.contains(dialog)).toBe(true);
    expect(dialog.parentElement).not.toBe(document.body);
  });

  it('is a labelled modal dialog', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Cookie preferences' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dlg-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'dlg-lead');
  });

  // U21c: a capped panel whose BODY scrolls, with the title and the actions pinned — never a
  // full-height unscrollable box, and never a footer that scrolls out of reach.
  it('keeps the header and the footer outside the one scrolling region', () => {
    const { host } = renderDialog();
    const body = host.querySelector('.overlay-body');
    expect(body).toBeInstanceOf(HTMLElement);
    expect(body).toContainElement(screen.getByText('Choose what we may use.'));
    expect(body).not.toContainElement(
      screen.getByRole('heading', { name: 'Cookie preferences' }),
    );
    expect(body).not.toContainElement(
      screen.getByRole('button', { name: 'Save preferences' }),
    );
  });

  it('closes when the scrim is clicked, but not when the panel is', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { host } = renderDialog({ onClose });

    await user.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(onClose).not.toHaveBeenCalled();

    const scrim = host.querySelector('.overlay-scrim');
    expect(scrim).toBeInstanceOf(HTMLElement);
    await user.click(scrim as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
