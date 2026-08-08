// Registers this module's global modals (W7). Imported once from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import { TEAM_FORM_MODAL, TeamFormModal } from './components/team-form-modal';

registerModal({ component: TeamFormModal, types: [TEAM_FORM_MODAL] });
