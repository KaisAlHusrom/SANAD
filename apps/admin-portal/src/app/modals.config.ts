// Side-effect imports that register each module's modals with the global registry (W7),
// mirroring `register-apis.ts`. A module declares its modals in a `modals.config.ts` that
// calls `registerModal(...)` at import; add one line here per module.
import '../modules/integration-secrets/modals.config';
import '../modules/media/modals.config';
