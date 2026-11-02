'use client';

import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import type { OverlayDialogProps } from '../overlay.types';
import { useOverlay } from '../use-overlay';

/**
 * The website's overlay primitive — the first one on this site, so it is built to be the only one.
 *
 * It portals rather than rendering in place because a trigger may live anywhere: the landing's
 * `.lp-finale` is a fixed, `isolation: isolate` layer whose opacity is written every frame, so a
 * dialog rendered beneath it would be both stacking-trapped and faded. `useOverlay` resolves the
 * target to `.sanad-web` (never `document.body`) so every `--web-*` token still applies.
 *
 * Entrance only, no exit: focus and the scroll lock are released the moment `open` flips, so an
 * exiting panel lingering on screen would be showing a surface that no longer owns the page.
 */
export function OverlayDialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  header,
  footer,
  children,
  className,
}: OverlayDialogProps) {
  const { portalTarget, dialogRef } = useOverlay({ open, onClose });

  if (!open || !portalTarget) return null;

  return createPortal(
    <div className="overlay-root">
      {/* Presentational: Escape and the trapped focus are the keyboard paths, so this needs no
          role of its own — it exists to dim the page and to catch an outside click. */}
      <div className="overlay-scrim" onClick={onClose} />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        tabIndex={-1}
        className={className ? `overlay-panel ${className}` : 'overlay-panel'}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="overlay-head">{header}</div>
        <div className="overlay-body">{children}</div>
        <div className="overlay-foot">{footer}</div>
      </motion.div>
    </div>,
    portalTarget,
  );
}
