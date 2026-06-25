import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import {
  closeModal,
  openModal,
  resetModalData,
  setModalData,
} from './modal.slice';

interface UseModalActionsResult {
  open: (type: string, data?: Record<string, unknown>) => void;
  close: () => void;
  setData: (patch: Record<string, unknown>) => void;
  resetData: () => void;
}

/**
 * The typed modal controller (U5/W7) — components open/close global modals through this,
 * never raw `dispatch`. Actions only (no state subscription) so an opener never re-renders
 * on unrelated modal changes; the `GlobalModalManager` reads the active type/data.
 */
export function useModalActions(): UseModalActionsResult {
  const dispatch = useAppDispatch();
  return {
    open: useCallback(
      (type: string, data?: Record<string, unknown>) =>
        dispatch(openModal({ type, data })),
      [dispatch],
    ),
    close: useCallback(() => dispatch(closeModal()), [dispatch]),
    setData: useCallback(
      (patch: Record<string, unknown>) => dispatch(setModalData(patch)),
      [dispatch],
    ),
    resetData: useCallback(() => dispatch(resetModalData()), [dispatch]),
  };
}
