import {
  integrationCapabilitySchema,
  integrationProviderIdSchema,
} from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useListIntegrationsQuery } from '../api/integrations.api';
import {
  useProviderConfig,
  type ProviderFormValues,
} from '../hooks/use-provider-config';

/** The modal `type` this component serves in the global registry (W7). */
export const PROVIDER_CONFIG_MODAL = 'integrations.configure-provider';

/** Narrow the registry's untyped `data` bag into a valid capability+provider pair. */
function resolveTarget(data: Record<string, unknown>) {
  const capability = integrationCapabilitySchema.safeParse(data['capability']);
  const provider = integrationProviderIdSchema.safeParse(data['provider']);
  return capability.success && provider.success
    ? { capability: capability.data, provider: provider.data }
    : null;
}

/**
 * Configure ONE provider (N13). The form is derived entirely from the provider's catalog
 * descriptor via `useProviderConfig` (F9 — reusing the DynamicForm kit), so only that provider's
 * fields appear and a new provider needs no UI code. Secrets render masked (`••••last4`) and
 * blank means "keep the stored value".
 *
 * NOTE: "Test connection" deliberately lives on the provider ROW, not here — the probe resolves
 * the SAVED config server-side, so testing unsaved edits would report on stale values.
 */
export function ProviderConfigModal({
  open,
  onClose,
  data,
}: ModalComponentProps) {
  const target = resolveTarget(data);
  if (!target) {
    return null;
  }
  return (
    <ProviderConfigModalForm
      open={open}
      onClose={onClose}
      capability={target.capability}
      provider={target.provider}
    />
  );
}

interface FormProps {
  open: boolean;
  onClose: () => void;
  capability: ReturnType<typeof integrationCapabilitySchema.parse>;
  provider: ReturnType<typeof integrationProviderIdSchema.parse>;
}

function ProviderConfigModalForm({
  open,
  onClose,
  capability,
  provider,
}: FormProps) {
  const { t } = useTranslation('integrations');
  // Read the provider's masked state from the list cache — the modal never re-fetches.
  const { data: capabilities } = useListIntegrationsQuery();
  const status = capabilities
    ?.find((entry) => entry.capability === capability)
    ?.providers.find((entry) => entry.provider === provider);

  const { fields, schema, defaults, submit } = useProviderConfig({
    capability,
    provider,
    status,
  });

  return (
    <DynamicFormModal<ProviderFormValues>
      open={open}
      onClose={onClose}
      title={t('dialog.configureTitle', {
        provider: t(`provider.${provider}`),
      })}
      fields={fields}
      schema={schema}
      mode="edit"
      record={defaults}
      submit={submit}
      successMessage={t('dialog.saved')}
      onSuccess={onClose}
      onCancel={onClose}
    />
  );
}
