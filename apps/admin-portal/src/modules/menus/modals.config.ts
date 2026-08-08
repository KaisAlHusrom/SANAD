// Registers this module's global modals (W7), mirroring `register-apis.ts`. Imported once
// at app init from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import {
  MENU_ITEM_FORM_MODAL,
  MenuItemFormModal,
} from './components/menu-item-form-modal';

registerModal({ component: MenuItemFormModal, types: [MENU_ITEM_FORM_MODAL] });
