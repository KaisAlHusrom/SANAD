// Registers this module's global modals (W7), mirroring `register-apis.ts`. Imported once
// at app init from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import {
  SERVICE_FORM_MODAL,
  ServiceFormModal,
} from './components/service-form-modal';

registerModal({ component: ServiceFormModal, types: [SERVICE_FORM_MODAL] });
