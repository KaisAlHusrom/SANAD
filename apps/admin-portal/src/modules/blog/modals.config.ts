// Registers this module's global modals (W7), mirroring `register-apis.ts`. Imported once
// at app init from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import {
  BLOG_CATEGORY_FORM_MODAL,
  BlogCategoryFormModal,
} from './components/blog-category-form-modal';
import {
  BLOG_TAG_FORM_MODAL,
  BlogTagFormModal,
} from './components/blog-tag-form-modal';

// Posts use a dedicated create/edit page (not a modal) — see `blog-form-page.tsx` (U21).
registerModal({
  component: BlogCategoryFormModal,
  types: [BLOG_CATEGORY_FORM_MODAL],
});
registerModal({ component: BlogTagFormModal, types: [BLOG_TAG_FORM_MODAL] });
