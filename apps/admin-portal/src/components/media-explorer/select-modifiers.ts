import type { MouseEvent } from 'react';

/** Modifier keys as the mouse handler saw them — what turns a click into a range or a toggle. */
export interface SelectModifiers {
  /** ⌘ / Ctrl — add or remove this one. */
  additive?: boolean;
  /** Shift — take everything from the last click to here. */
  range?: boolean;
}

/**
 * Read the modifier keys off a mouse event, in the ONE place that knows which key means what
 * (U10/U20). Both the grid and the list select through this, so the two can't disagree about
 * what a ⌘-click does.
 *
 * `metaKey` and `ctrlKey` are both "additive" on purpose: ⌘ is the macOS convention and Ctrl the
 * Windows/Linux one, and the app runs in both.
 */
export function modifiersOf(event: MouseEvent): SelectModifiers {
  return { additive: event.metaKey || event.ctrlKey, range: event.shiftKey };
}
