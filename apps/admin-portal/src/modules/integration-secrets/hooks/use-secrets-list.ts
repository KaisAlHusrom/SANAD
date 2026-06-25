import {
  SECRET_REGISTRY_LIST,
  type SecretKey,
  type SecretRegistryEntry,
  type SecretStatus,
} from '@sanad/contracts';
import { useListSecretsQuery } from '../api/integration-secrets.api';

export interface SecretRow {
  entry: SecretRegistryEntry;
  status: SecretStatus;
}

interface UseSecretsListResult {
  rows: SecretRow[];
  isLoading: boolean;
  isError: boolean;
}

/** A masked "not set" placeholder so a registered secret renders even before any status. */
function emptyStatus(key: SecretKey): SecretStatus {
  return {
    key,
    isSet: false,
    fromEnv: false,
    last4: null,
    updatedAt: null,
    updatedByUserId: null,
  };
}

/**
 * Merges the secret registry (the source of which rows exist + their RBAC/wired flags)
 * with the fetched masked statuses (U5 — the page stays presentational). One row per
 * registered third party, always.
 */
export function useSecretsList(): UseSecretsListResult {
  const { data, isLoading, isError } = useListSecretsQuery();
  const rows = SECRET_REGISTRY_LIST.map((entry) => ({
    entry,
    status:
      data?.find((status) => status.key === entry.key) ??
      emptyStatus(entry.key),
  }));
  return { rows, isLoading, isError };
}
