import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { closeModal, openModal } from '../../data/modal/modal.slice';
import {
  clearModals,
  registerModal,
  type ModalComponentProps,
} from '../../data/modal/modal-registry';
import { createAppStore } from '../../data/store/store';
import { renderWithProviders } from '../../test/render-with-providers';
import { GlobalModalManager } from './global-modal-manager';

function DemoModal({ open, onClose, data }: ModalComponentProps) {
  if (!open) {
    return null;
  }
  return (
    <div>
      <p>demo:{String(data.label)}</p>
      <button type="button" onClick={onClose}>
        close-demo
      </button>
    </div>
  );
}

afterEach(() => {
  clearModals();
});

describe('GlobalModalManager', () => {
  it('renders the registered modal for the active type with its data, then closes', () => {
    registerModal({ component: DemoModal, types: ['demo'] });
    const store = createAppStore();
    renderWithProviders(<GlobalModalManager />, { store });

    expect(screen.queryByText('demo:hello')).not.toBeInTheDocument();

    act(() => {
      store.dispatch(openModal({ type: 'demo', data: { label: 'hello' } }));
    });
    expect(screen.getByText('demo:hello')).toBeInTheDocument();

    act(() => {
      store.dispatch(closeModal());
    });
    expect(screen.queryByText('demo:hello')).not.toBeInTheDocument();
  });

  it('renders nothing for an unregistered modal type', () => {
    registerModal({ component: DemoModal, types: ['demo'] });
    const store = createAppStore();
    renderWithProviders(<GlobalModalManager />, { store });

    act(() => {
      store.dispatch(openModal({ type: 'ghost', data: { label: 'x' } }));
    });
    expect(screen.queryByText(/demo:/)).not.toBeInTheDocument();
  });
});
