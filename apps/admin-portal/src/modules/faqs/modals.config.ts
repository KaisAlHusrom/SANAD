// Registers this module's global modals (W7). Imported once from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import { FAQ_FORM_MODAL, FaqFormModal } from './components/faq-form-modal';

registerModal({ component: FaqFormModal, types: [FAQ_FORM_MODAL] });
