import type { ReactNode } from 'react';

export interface UseOverlayOptions {
  open: boolean;
  onClose: () => void;
}

export interface OverlayDialogProps {
  open: boolean;
  onClose: () => void;
  /** Id of the heading the caller renders in `header`; becomes the dialog's accessible name. */
  labelledBy: string;
  /** Id of an intro paragraph, when the caller renders one. */
  describedBy?: string;
  /** Pinned above the scrolling body. */
  header: ReactNode;
  /** Pinned below it — the action row (U21c). */
  footer: ReactNode;
  /** The only scrolling region. */
  children: ReactNode;
  className?: string;
}
