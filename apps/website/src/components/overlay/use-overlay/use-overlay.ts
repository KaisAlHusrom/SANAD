'use client';

import { useEffect, useRef, useState } from 'react';
import { scrollLock } from '../../../motion/scroll';
import {
  FOCUSABLE_SELECTOR,
  OVERLAY_HOST_SELECTOR,
} from '../overlay.constants';
import type { UseOverlayOptions } from '../overlay.types';

export interface OverlayApi {
  /** `null` until the client resolves it, so nothing renders during SSR or hydration. */
  portalTarget: Element | null;
  dialogRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Everything an open overlay has to own, in one place (U5): where it portals to, who had focus
 * before it, keeping focus inside it, closing on Escape without waking the layers behind it, and
 * freezing the page while it is up.
 *
 * The site has no dialog library, so this is hand-rolled — and the two belts that make a
 * hand-rolled trap actually hold are the `focusin` recapture (a Tab handler cannot see focus
 * arriving from browser chrome or from another component's `.focus()` effect) and stopping Escape
 * at the dialog node.
 */
export function useOverlay({ open, onClose }: UseOverlayOptions): OverlayApi {
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Read inside the native listener so a re-rendered callback never leaves a stale closure behind.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setPortalTarget(
      document.querySelector(OVERLAY_HOST_SELECTOR) ?? document.body,
    );
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const returnFocusTo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // The root, not the first control: it carries `aria-labelledby`, so the title is announced
    // before the controls, and Tab/Shift+Tab then land on the first/last naturally.
    dialog.focus();

    const releaseScroll = scrollLock.acquire();

    const tabbables = (): HTMLElement[] =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        // Escape belongs to the topmost surface. `UniverseNavigator`'s flight-skip and
        // `MotionProvider`'s scroll keys are both bubble listeners on `window`, so stopping it
        // here — at the target, since focus is trapped inside — shields both with one call.
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = tabbables();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target;
      if (target instanceof Node && dialog.contains(target)) return;
      dialog.focus();
    };

    dialog.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);

    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      releaseScroll();
      // After the belt is detached, or it would immediately pull focus back off the trigger.
      returnFocusTo?.focus();
    };
    // `portalTarget` is load-bearing, not decorative: it resolves in an effect, so an overlay that
    // is ALREADY open on its first render has no dialog node yet when this runs. Keyed on `open`
    // alone it would bail once and never re-run — no focus trap, no Escape, no scroll lock.
  }, [open, portalTarget]);

  return { portalTarget, dialogRef };
}
