// Registers this module's global modals (W7), mirroring `register-apis.ts`. Imported once
// at app init from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import {
  BLOCK_FORM_MODAL,
  BlockFormModal,
} from './components/block-form-modal';
import { PAGE_FORM_MODAL, PageFormModal } from './components/page-form-modal';

registerModal({ component: PageFormModal, types: [PAGE_FORM_MODAL] });
registerModal({ component: BlockFormModal, types: [BLOCK_FORM_MODAL] });
