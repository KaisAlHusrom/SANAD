import type { createAppStore } from './store';

/** Store back-edges — `import type` only, never a value import (W3). */
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
