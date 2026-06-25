import type { SecretRegistryEntry, SecretStatus } from '@sanad/contracts';
import { useRequirePermission } from '../../../app/guards/use-require-permission';

export type SecretStatusKey = 'inVault' | 'fromEnv' | 'notSet';
export type SecretStatusTone = 'good' | 'warn' | 'neutral';

interface UseSecretRowResult {
  /** Whether the caller may set/rotate this third party's secret (its managePermission). */
  canManage: boolean;
  isSet: boolean;
  statusKey: SecretStatusKey;
  statusTone: SecretStatusTone;
  /** A masked tail like `••••1234`, or null when unset. */
  last4Display: string | null;
}

/** Per-row display derivations + per-integration RBAC (U5 — the row stays presentational). */
export function useSecretRow(
  entry: SecretRegistryEntry,
  status: SecretStatus,
): UseSecretRowResult {
  const canManage = useRequirePermission(entry.managePermission);
  const statusKey: SecretStatusKey = !status.isSet
    ? 'notSet'
    : status.fromEnv
      ? 'fromEnv'
      : 'inVault';
  const statusTone: SecretStatusTone =
    statusKey === 'inVault'
      ? 'good'
      : statusKey === 'fromEnv'
        ? 'warn'
        : 'neutral';

  return {
    canManage,
    isSet: status.isSet,
    statusKey,
    statusTone,
    last4Display: status.last4 ? `••••${status.last4}` : null,
  };
}
