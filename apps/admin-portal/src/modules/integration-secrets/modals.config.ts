// Registers this module's global modals (W7), mirroring `register-apis.ts`. Imported once
// at app init from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import {
  SET_SECRET_MODAL,
  SetSecretModal,
} from './components/set-secret-modal';

registerModal({ component: SetSecretModal, types: [SET_SECRET_MODAL] });
