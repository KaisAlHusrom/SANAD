/** Keys the browser uses to ACTIVATE the focused control rather than to move the page. */
const ACTIVATION_KEYS: ReadonlySet<string> = new Set([' ', 'Spacebar']);

const ARROW_KEYS: ReadonlySet<string> = new Set(['ArrowUp', 'ArrowDown']);

/** Anything Space is expected to press. `a[href]` is included: Space scrolls, but Enter+Space parity matters for `role=link`. */
const ACTIVATABLE =
  'button, a[href], summary, [role="button"], [role="switch"], [role="link"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="tab"], [role="option"]';

/** Composite widgets that own their own arrow-key navigation (the phone-field country list is one). */
const COMPOSITE =
  '[role="listbox"], [role="menu"], [role="menubar"], [role="radiogroup"], [role="tablist"], [role="grid"], [role="tree"]';

const EDITABLE = '[contenteditable=""], [contenteditable="true"]';

const FORM_TAGS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Whether a keydown should drive the capped page scroller, or belongs to whatever is focused.
 *
 * This exists because the scroller `preventDefault()`s the keys it drives, and `keyScrollDelta`
 * drives **Space** — so before this predicate, Space on a focused `<button>` paged the document
 * instead of pressing the button, everywhere on the site. Exempting by tag name alone (the original
 * INPUT/TEXTAREA check) cannot see that, because the control that swallows Space is a `<button>`.
 *
 * `closest` rather than the target itself: a click target is usually the label span inside the
 * control, not the control.
 */
export function shouldDriveScroll(
  key: string,
  target: Element | null,
): boolean {
  if (!target) return true;

  if (FORM_TAGS.has(target.tagName) || target.closest(EDITABLE) !== null) {
    return false;
  }

  if (ACTIVATION_KEYS.has(key) && target.closest(ACTIVATABLE) !== null) {
    return false;
  }

  if (ARROW_KEYS.has(key) && target.closest(COMPOSITE) !== null) return false;

  return true;
}
