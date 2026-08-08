import { registerModal } from '../../data/modal/modal-registry';
import {
  PROVIDER_CONFIG_MODAL,
  ProviderConfigModal,
} from './components/provider-config-modal';

/** Register the provider-configuration modal with the global registry (W7). */
registerModal({
  component: ProviderConfigModal,
  types: [PROVIDER_CONFIG_MODAL],
});
