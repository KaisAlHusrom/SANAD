// Registers this module's global modals (W7), mirroring `register-apis.ts`. Imported once
// at app init from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import {
  NEW_FOLDER_MODAL,
  NewFolderModal,
} from './components/new-folder-modal';

registerModal({ component: NewFolderModal, types: [NEW_FOLDER_MODAL] });
