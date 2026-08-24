import type { IntegrationProviderId } from '@sanad/contracts';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatList } from '../../../lib/format';
import { Button } from '../../../components/ui/button';
import { CALLOUT_TONE_CLASSES } from '../../../components/ui/callout';
import { Skeleton } from '../../../components/feedback/skeleton';
import {
  useStorageCors,
  type StorageCorsTone,
} from '../hooks/use-storage-cors';

interface StorageCorsPanelProps {
  provider: IntegrationProviderId;
  /** Only check a configured provider — there is no bucket to inspect before that. */
  configured: boolean;
  canManage: boolean;
}

/**
 * Tone → the token classes for the panel's border/background/text, from the shared Callout
 * canon (U3/F9). It used to spell them as `bg-good/10` etc., which Tailwind 3.4 compiles to
 * NOTHING for a `var(--token)` color — so every verdict here rendered with no tint and no
 * border (found and fixed in P8.23.A1).
 */
const TONE_CLASSES: Record<StorageCorsTone, string> = CALLOUT_TONE_CLASSES;

const TONE_ICON: Record<StorageCorsTone, typeof CheckCircle2> = {
  good: CheckCircle2,
  bad: ShieldAlert,
  warn: AlertTriangle,
  neutral: AlertTriangle,
};

/**
 * "Can the browser upload to this bucket?" — the check that would have turned the owner's
 * unexplained 403 into a one-line answer with a button (rules change-log 2026-07-20).
 *
 * Presentation only (U5); every state comes from `useStorageCors`. All of them render — loading,
 * each of the five verdicts, a failed check, and the no-permission read-only view (U23) — because
 * a check that silently renders nothing is the very failure this feature exists to prevent.
 */
export function StorageCorsPanel({
  provider,
  configured,
  canManage,
}: StorageCorsPanelProps) {
  const { t, i18n } = useTranslation('integrations');
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const cors = useStorageCors(provider, { enabled: configured && canManage });

  // Nothing to say yet: an unconfigured provider already reads "not configured" on its row, and
  // a viewer without manage rights can't act on this anyway.
  if (!configured || !canManage) return null;

  if (cors.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border-2 bg-surface-2 px-3 py-2">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  // The CHECK failed (network, gateway, permissions) — distinct from "the check says blocked".
  if (cors.isError || !cors.status) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border-2 bg-surface-2 px-3 py-2 text-sm text-dim">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <span>{t('cors.checkFailed')}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={cors.isFetching}
          onClick={cors.refetch}
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t('cors.recheck')}
        </Button>
      </div>
    );
  }

  const { status } = cors;
  const Icon = TONE_ICON[cors.tone];

  return (
    <div
      role="status"
      className={`flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm ${TONE_CLASSES[cors.tone]}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="font-medium">{t(`cors.state.${status.state}`)}</span>
        <span className="text-dim">
          {t('cors.origins', {
            origins: formatList(status.requiredOrigins, locale),
          })}
        </span>

        <div className="flex flex-1 items-center justify-end gap-2">
          {cors.canFix ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={cors.isFixing}
              onClick={() => void cors.fix()}
            >
              <Wrench className="size-3.5" aria-hidden="true" />
              {t('cors.fix')}
            </Button>
          ) : null}
          {status.state !== 'ok' ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void cors.copyPolicy()}
            >
              <Copy className="size-3.5" aria-hidden="true" />
              {t('cors.copyPolicy')}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={cors.isFetching}
            onClick={cors.refetch}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t('cors.recheck')}
          </Button>
        </div>
      </div>

      {/* What the bucket allows TODAY — so "not allowed" is diagnosable, not just a verdict. */}
      {status.state === 'origin-not-allowed' &&
      status.allowedOrigins.length > 0 ? (
        <p className="text-dim">
          {t('cors.currentlyAllowed', {
            origins: formatList(status.allowedOrigins, locale),
          })}
        </p>
      ) : null}

      {/*
        Why we couldn't read/write the config, plus what to do about it. `message` arrives
        ALREADY localized from media-service (U24d); `detail` is the vendor's own English
        (`AccessDenied`) and gets the same muted ltr monospace treatment as the test result's,
        under the sentence rather than in place of it (U24e).
      */}
      {status.state === 'cannot-check' ? (
        <div className="grid gap-1">
          <p className="text-dim">
            {status.message ? `${status.message} — ` : ''}
            {t('cors.manualHint')}
          </p>
          {status.detail ? (
            <p dir="ltr" className="break-words font-mono text-xs text-dim">
              {status.detail}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
