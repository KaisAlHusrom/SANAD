import type { StorageCorsState, StorageCorsStatus } from '@sanad/contracts';
import type { IntegrationProviderId } from '@sanad/contracts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast/use-toast';
import {
  useApplyStorageCorsMutation,
  useStorageCorsStatusQuery,
} from '../api/integrations.api';

/** How the panel should read: which tone, whether the fix button is offered. */
export type StorageCorsTone = 'good' | 'bad' | 'warn' | 'neutral';

const TONE_BY_STATE: Record<StorageCorsState, StorageCorsTone> = {
  ok: 'good',
  missing: 'bad',
  'origin-not-allowed': 'bad',
  'cannot-check': 'warn',
  unconfigured: 'neutral',
};

export interface UseStorageCorsResult {
  status: StorageCorsStatus | undefined;
  tone: StorageCorsTone;
  /** Loading the FIRST status — the panel renders a skeleton line, never a wrong verdict. */
  isLoading: boolean;
  isFetching: boolean;
  /** The check itself failed (network/permission) — distinct from "the check says blocked". */
  isError: boolean;
  refetch: () => void;
  /** Offer the one-click fix only when the backend says the write can actually succeed. */
  canFix: boolean;
  fix: () => Promise<void>;
  isFixing: boolean;
  /** The policy as pretty JSON, for the copy-and-paste fallback path. */
  policyJson: string;
  copyPolicy: () => Promise<void>;
}

/**
 * The storage browser-CORS check (U5).
 *
 * Why this is a first-class surface and not a hidden detail: the admin SPA uploads bytes straight
 * from the browser to the bucket, so a bucket without a CORS rule makes every upload fail with a
 * 403 that names nothing (rules change-log 2026-07-20). The owner must be able to SEE that state
 * and fix it without leaving the app — and when we can't fix it for them (an object-scoped API
 * token may not write bucket config), they still get the exact JSON to paste (U23c).
 *
 * `skip` keeps the query off the wire until the provider is configured — there is nothing to
 * check before that, and an unconfigured provider already reads as its own state.
 */
export function useStorageCors(
  provider: IntegrationProviderId,
  options: { enabled: boolean },
): UseStorageCorsResult {
  const { t } = useTranslation('integrations');
  const { data, isLoading, isFetching, isError, refetch } =
    useStorageCorsStatusQuery({ provider }, { skip: !options.enabled });
  const [applyCors, { isLoading: isFixing }] = useApplyStorageCorsMutation();

  const policyJson = useMemo(
    () =>
      data ? JSON.stringify({ CORSRules: toAwsShape(data) }, null, 2) : '',
    [data],
  );

  const fix = useCallback(async () => {
    try {
      const next = await applyCors({ provider }).unwrap();
      // The response is the RE-READ status, so "ok" here means the bucket really is fixed.
      if (next.state === 'ok') {
        toast.success(t('cors.fixed'));
      } else {
        // `next.message` is localized by media-service (U24d) — it explains WHY the write was
        // refused, which the generic local string can't. Fall back only when it said nothing.
        toast.error(next.message ?? t('cors.fixFailed'));
      }
    } catch {
      toast.error(t('cors.fixFailed'));
    }
  }, [applyCors, provider, t]);

  const copyPolicy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(policyJson);
      toast.success(t('cors.copied'));
    } catch {
      // Clipboard can be denied (permissions, insecure context) — say so rather than pretend.
      toast.error(t('cors.copyFailed'));
    }
  }, [policyJson, t]);

  return {
    status: data,
    tone: data ? TONE_BY_STATE[data.state] : 'neutral',
    isLoading,
    isFetching,
    isError,
    refetch: () => void refetch(),
    canFix: data?.canApply === true && data.state !== 'ok',
    fix,
    isFixing,
    policyJson,
    copyPolicy,
  };
}

/** Our contract rules → the S3/R2 JSON the Cloudflare dashboard expects, verbatim-pasteable. */
function toAwsShape(status: StorageCorsStatus) {
  return status.policy.map((rule) => ({
    AllowedOrigins: rule.allowedOrigins,
    AllowedMethods: rule.allowedMethods,
    AllowedHeaders: rule.allowedHeaders,
    ExposeHeaders: rule.exposeHeaders,
    ...(rule.maxAgeSeconds === null
      ? {}
      : { MaxAgeSeconds: rule.maxAgeSeconds }),
  }));
}
