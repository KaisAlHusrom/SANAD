import { configureStore } from '@reduxjs/toolkit';
import { getRegisteredApis } from '../api/api-registry';
import { authReducer } from '../auth/auth.slice';
import { writeAuthToStorage } from '../auth/auth.storage';
import { modalReducer } from '../modal/modal.slice';

/**
 * Build the store from the auth + modal slices + every registered api (W3). Feature api
 * modules self-register via `registerApi` at import, so adding one never edits this
 * file. Auth is persisted from a store subscriber (F12) so the slice reducers stay
 * pure (no side effects). The `modal` slice backs the global modal registry (W7).
 */
export function createAppStore() {
  const apis = getRegisteredApis();
  const apiReducers = Object.fromEntries(
    apis.map((api) => [api.reducerPath, api.reducer]),
  );

  const store = configureStore({
    reducer: { auth: authReducer, modal: modalReducer, ...apiReducers },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apis.map((api) => api.middleware)),
  });

  store.subscribe(() => {
    writeAuthToStorage(store.getState().auth);
  });

  return store;
}
