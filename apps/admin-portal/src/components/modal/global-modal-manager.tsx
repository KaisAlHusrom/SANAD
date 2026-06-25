import { selectModalData, selectModalType } from '../../data/modal/modal.slice';
import { findModal } from '../../data/modal/modal-registry';
import { useModalActions } from '../../data/modal/use-modal';
import { useAppSelector } from '../../data/store/hooks';

/**
 * Renders the single active registered modal (W7). Mounted ONCE at the app root; reads the
 * `modal` slice, looks up the component registered for the active `type`, and renders it
 * with `{open, onClose, data, type}`. Nothing renders when no modal is open or the type is
 * unregistered.
 */
export function GlobalModalManager() {
  const type = useAppSelector(selectModalType);
  const data = useAppSelector(selectModalData);
  const { close } = useModalActions();

  if (!type) {
    return null;
  }
  const entry = findModal(type);
  if (!entry) {
    return null;
  }

  const Modal = entry.component;
  return <Modal open onClose={close} data={data} type={type} />;
}
