import { describe, expect, it } from 'vitest';
import { shouldDriveScroll } from './should-drive-scroll';

function el(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  const first = host.firstElementChild;
  if (!(first instanceof HTMLElement)) throw new Error('bad fixture');
  return first;
}

describe('shouldDriveScroll', () => {
  it('drives the page for a plain key press on ordinary content', () => {
    expect(shouldDriveScroll(' ', el('<div>body copy</div>'))).toBe(true);
    expect(shouldDriveScroll('ArrowDown', el('<p>x</p>'))).toBe(true);
    expect(shouldDriveScroll('PageDown', null)).toBe(true);
  });

  // The pre-existing platform bug: MotionProvider preventDefault()s Space for the capped scroller,
  // so Space on a focused button scrolled the page instead of activating it.
  it('never drives the page when an activation key targets an activatable element', () => {
    expect(shouldDriveScroll(' ', el('<button>Accept</button>'))).toBe(false);
    expect(shouldDriveScroll('Spacebar', el('<button>Accept</button>'))).toBe(
      false,
    );
    expect(shouldDriveScroll(' ', el('<a href="/ar">home</a>'))).toBe(false);
    expect(
      shouldDriveScroll(' ', el('<div role="switch">analytics</div>')),
    ).toBe(false);
    expect(shouldDriveScroll(' ', el('<summary>more</summary>'))).toBe(false);
  });

  it('finds the activatable ancestor, not just the event target', () => {
    const button = el('<button><span class="label">Accept all</span></button>');
    const label = button.querySelector('.label');
    expect(label).toBeInstanceOf(HTMLElement);
    expect(shouldDriveScroll(' ', label as HTMLElement)).toBe(false);
  });

  it('still drives the page for a NON-activation key on a button', () => {
    // Only Space is an activation key on a button — PageDown over a button should still scroll.
    expect(shouldDriveScroll('PageDown', el('<button>Accept</button>'))).toBe(
      true,
    );
  });

  it('leaves arrow keys to composite widgets that own them', () => {
    const list = el('<div role="listbox"><div role="option">SA</div></div>');
    const option = list.querySelector('[role="option"]');
    expect(shouldDriveScroll('ArrowDown', option as HTMLElement)).toBe(false);
    expect(shouldDriveScroll('ArrowUp', list)).toBe(false);
    expect(shouldDriveScroll('ArrowDown', el('<input type="range" />'))).toBe(
      false,
    );
  });

  it('preserves the original form-field exemptions', () => {
    expect(shouldDriveScroll('ArrowDown', el('<input />'))).toBe(false);
    expect(shouldDriveScroll('PageDown', el('<textarea></textarea>'))).toBe(
      false,
    );
    expect(
      shouldDriveScroll(' ', el('<select><option>a</option></select>')),
    ).toBe(false);
    const rich = el('<div contenteditable="true">draft</div>');
    expect(shouldDriveScroll('ArrowDown', rich)).toBe(false);
  });
});
