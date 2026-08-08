import {
  hasPermission,
  INTEGRATION_CAPABILITIES,
  integrationManagePermission,
  listProviders,
  type IntegrationCapability,
  type IntegrationCapabilityStatus,
  type IntegrationProviderId,
} from '@sanad/contracts';
import { selectPermissions } from '../../../data/auth/auth.slice';
import { useAppSelector } from '../../../data/store/hooks';
import {
  useActivateProviderMutation,
  useListIntegrationsQuery,
} from '../api/integrations.api';

/** One capability card's view model: its providers, which is active, and whether we may edit. */
export interface CapabilityCardModel {
  capability: IntegrationCapability;
  activeProvider: IntegrationProviderId | null;
  canManage: boolean;
  providers: {
    provider: IntegrationProviderId;
    configured: boolean;
    isActive: boolean;
    status?: IntegrationCapabilityStatus['providers'][number];
  }[];
}

interface UseIntegrationsListResult {
  cards: CapabilityCardModel[];
  isLoading: boolean;
  isError: boolean;
  activate: (
    capability: IntegrationCapability,
    provider: IntegrationProviderId,
  ) => Promise<unknown>;
  isActivating: boolean;
}

/**
 * The integrations page view model (U5). The **catalog** decides which capabilities and providers
 * exist (so a provider added to contracts appears with no UI change); the server response supplies
 * each one's masked state + the active selection. Each capability is gated by its own manage
 * permission, so a card can be read-only while another is editable.
 */
export function useIntegrationsList(): UseIntegrationsListResult {
  const { data, isLoading, isError } = useListIntegrationsQuery();
  const [activateProvider, { isLoading: isActivating }] =
    useActivateProviderMutation();
  // Read the permission set ONCE — each capability is checked against it below (a hook cannot
  // be called per-capability inside the map).
  const permissions = useAppSelector(selectPermissions);

  const byCapability = new Map(
    (data ?? []).map((status) => [status.capability, status]),
  );

  const cards: CapabilityCardModel[] = INTEGRATION_CAPABILITIES.map(
    (capability) => {
      const status = byCapability.get(capability);
      return {
        capability,
        activeProvider: status?.activeProvider ?? null,
        canManage: hasPermission(
          permissions,
          integrationManagePermission(capability),
        ),
        providers: listProviders(capability).map((descriptor) => {
          const providerStatus = status?.providers.find(
            (p) => p.provider === descriptor.id,
          );
          return {
            provider: descriptor.id,
            configured: providerStatus?.configured ?? false,
            isActive: status?.activeProvider === descriptor.id,
            status: providerStatus,
          };
        }),
      };
    },
  );

  return {
    cards,
    isLoading,
    isError,
    activate: (capability, provider) =>
      activateProvider({ capability, provider }).unwrap(),
    isActivating,
  };
}
