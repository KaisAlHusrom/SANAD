import { describe, expect, it } from 'vitest';
import {
  closeModal,
  modalReducer,
  openModal,
  resetModalData,
  setModalData,
} from './modal.slice';

const initial = { type: null, data: {} } as const;

describe('modal slice', () => {
  it('opens a modal with its type + data', () => {
    expect(
      modalReducer(initial, openModal({ type: 'editX', data: { id: '1' } })),
    ).toEqual({
      type: 'editX',
      data: { id: '1' },
    });
  });

  it('opens with empty data when none is given', () => {
    expect(modalReducer(initial, openModal({ type: 'addX' }))).toEqual({
      type: 'addX',
      data: {},
    });
  });

  it('merges setModalData into the open payload (lazy detail load)', () => {
    const open = modalReducer(
      initial,
      openModal({ type: 'editX', data: { id: '1' } }),
    );
    expect(modalReducer(open, setModalData({ loading: true })).data).toEqual({
      id: '1',
      loading: true,
    });
  });

  it('resets data without closing', () => {
    const open = modalReducer(
      initial,
      openModal({ type: 'editX', data: { id: '1' } }),
    );
    expect(modalReducer(open, resetModalData())).toEqual({
      type: 'editX',
      data: {},
    });
  });

  it('closes and clears everything', () => {
    const open = modalReducer(
      initial,
      openModal({ type: 'editX', data: { id: '1' } }),
    );
    expect(modalReducer(open, closeModal())).toEqual({ type: null, data: {} });
  });
});
