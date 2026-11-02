import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentCategorySwitch } from './consent-category-switch';

afterEach(cleanup);

function renderSwitch(
  props: Partial<React.ComponentProps<typeof ConsentCategorySwitch>> = {},
) {
  return render(
    <ConsentCategorySwitch
      checked={props.checked ?? false}
      onChange={props.onChange ?? (() => undefined)}
      labelId="cat-name"
      describedById="cat-help"
      locked={props.locked ?? false}
      stateLabel={props.stateLabel ?? { on: 'On', off: 'Off' }}
    />,
  );
}

describe('ConsentCategorySwitch', () => {
  it('is a switch that reports its state', () => {
    renderSwitch({ checked: true });
    const control = screen.getByRole('switch');
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(control).toHaveAttribute('aria-labelledby', 'cat-name');
    expect(control).toHaveAttribute('aria-describedby', 'cat-help');
  });

  it('toggles on click, on Enter, and on Space', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSwitch({ checked: false, onChange });
    const control = screen.getByRole('switch');

    await user.click(control);
    expect(onChange).toHaveBeenLastCalledWith(true);

    control.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('reports the opposite of what it currently is', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSwitch({ checked: true, onChange });

    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  // `necessary` is shown so a visitor can see it, and locked because the product cannot honour a
  // refusal. It stays FOCUSABLE on purpose: `disabled` would drop it out of the tab order, and a
  // screen-reader user must be able to reach the one category we are not offering.
  it('shows the locked category as on, reachable, and inert', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSwitch({ checked: true, locked: true, onChange });
    const control = screen.getByRole('switch');

    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control).not.toHaveAttribute('disabled');

    control.focus();
    expect(control).toHaveFocus();

    await user.click(control);
    await user.keyboard(' ');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('carries a text state for anyone who cannot read the track', () => {
    renderSwitch({
      checked: false,
      stateLabel: { on: 'مُفعّل', off: 'مُعطّل' },
    });
    expect(screen.getByRole('switch')).toHaveTextContent('مُعطّل');
  });
});
