import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * The single global modal state (W7): which modal `type` is open + its `data` payload
 * (id, prefill, a `loading` flag for lazy detail loads…). One slice serves every modal —
 * components open via `useModalActions`, the `GlobalModalManager` renders the active one.
 */
export interface ModalState {
  type: string | null;
  data: Record<string, unknown>;
}

/** The minimal store shape the selectors read — keeps this slice from importing the store. */
export interface ModalRoot {
  modal: ModalState;
}

const initialState: ModalState = { type: null, data: {} };

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    /** Open a modal by type, with an optional payload. */
    openModal(
      state,
      action: PayloadAction<{ type: string; data?: Record<string, unknown> }>,
    ) {
      state.type = action.payload.type;
      state.data = action.payload.data ?? {};
    },
    /** Close the active modal and clear its payload. */
    closeModal(state) {
      state.type = null;
      state.data = {};
    },
    /** Merge a patch into the open modal's payload (e.g. lazy-loaded detail / loading flag). */
    setModalData(state, action: PayloadAction<Record<string, unknown>>) {
      state.data = { ...state.data, ...action.payload };
    },
    /** Clear the payload without closing. */
    resetModalData(state) {
      state.data = {};
    },
  },
});

export const { openModal, closeModal, setModalData, resetModalData } =
  modalSlice.actions;
export const modalReducer = modalSlice.reducer;

export const selectModalType = (state: ModalRoot): string | null =>
  state.modal.type;
export const selectModalData = (state: ModalRoot): Record<string, unknown> =>
  state.modal.data;
