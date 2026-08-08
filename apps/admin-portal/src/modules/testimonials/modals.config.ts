// Registers this module's global modals (W7). Imported once from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import {
  TESTIMONIAL_FORM_MODAL,
  TestimonialFormModal,
} from './components/testimonial-form-modal';

registerModal({
  component: TestimonialFormModal,
  types: [TESTIMONIAL_FORM_MODAL],
});
