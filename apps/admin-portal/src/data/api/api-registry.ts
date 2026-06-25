import type { Middleware, Reducer } from '@reduxjs/toolkit';

/**
 * The minimal shape an RTK Query api exposes for store wiring. Each api module calls
 * `registerApi(theApi)` at import; the store reads `getRegisteredApis()` and wires
 * every reducer + middleware once (W3) — so adding a feature api never edits the
 * store config.
 */
export interface RegisteredApi {
  reducerPath: string;
  reducer: Reducer;
  middleware: Middleware;
}

const registry = new Map<string, RegisteredApi>();

/** Register an api slice for store wiring (idempotent per `reducerPath`). */
export function registerApi(api: RegisteredApi): void {
  registry.set(api.reducerPath, api);
}

/** Every registered api, for the store to wire reducers + middleware. */
export function getRegisteredApis(): RegisteredApi[] {
  return [...registry.values()];
}
