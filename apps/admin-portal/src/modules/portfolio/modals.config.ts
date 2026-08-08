// Registers this module's global modals (W7), mirroring `register-apis.ts`. Imported once
// at app init from `src/app/modals.config.ts`.
import { registerModal } from '../../data/modal/modal-registry';
import {
  PORTFOLIO_CATEGORY_FORM_MODAL,
  PortfolioCategoryFormModal,
} from './components/portfolio-category-form-modal';
import {
  PORTFOLIO_FORM_MODAL,
  PortfolioFormModal,
} from './components/portfolio-form-modal';

registerModal({ component: PortfolioFormModal, types: [PORTFOLIO_FORM_MODAL] });
registerModal({
  component: PortfolioCategoryFormModal,
  types: [PORTFOLIO_CATEGORY_FORM_MODAL],
});
