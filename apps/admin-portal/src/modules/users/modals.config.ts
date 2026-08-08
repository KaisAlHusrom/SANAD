// Registers this module's global modals (W7), mirroring `register-apis.ts`. Imported once
// at app init from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import { USER_FORM_MODAL, UserFormModal } from './components/user-form-modal';
import {
  USER_ROLES_MODAL,
  UserRolesModal,
} from './components/user-roles-modal';

registerModal({ component: UserFormModal, types: [USER_FORM_MODAL] });
registerModal({ component: UserRolesModal, types: [USER_ROLES_MODAL] });
