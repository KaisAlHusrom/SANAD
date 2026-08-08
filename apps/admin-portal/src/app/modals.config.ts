// Side-effect imports that register each module's modals with the global registry (W7),
// mirroring `register-apis.ts`. A module declares its modals in a `modals.config.ts` that
// calls `registerModal(...)` at import; add one line here per module.
import '../modules/integrations/modals.config';
import '../modules/services/modals.config';
import '../modules/testimonials/modals.config';
import '../modules/faqs/modals.config';
import '../modules/team/modals.config';
import '../modules/portfolio/modals.config';
import '../modules/blog/modals.config';
import '../modules/pages/modals.config';
import '../modules/menus/modals.config';
import '../modules/users/modals.config';
