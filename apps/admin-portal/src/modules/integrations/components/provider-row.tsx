import {
  isSignedOnlyPublicUrl,
  type IntegrationCapability,
  type IntegrationFieldStatus,
  type IntegrationProviderId,
} from '@sanad/contracts';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useModalActions } from '../../../data/modal/use-modal';
import { useProviderTest } from '../hooks/use-provider-test';
import { PROVIDER_CONFIG_MODAL } from './provider-config-modal';
import { StorageCorsPanel } from './storage-cors-panel';

interface ProviderRowProps {
  capability: IntegrationCapability;
  provider: IntegrationProviderId;
  configured: boolean;
  /** The provider's masked field states — non-secret fields carry their real value. */
  fields: IntegrationFieldStatus[];
  isActive: boolean;
  canManage: boolean;
  onActivate: () => void;
  isActivating: boolean;
}

/**
 * One provider inside a capability card: its name, state, and the actions. **Configure** opens
 * the descriptor-driven modal; **Test** probes the SAVED config through the owning service; **Set
 * active** points the capability at this provider. Write actions require the capability's manage
 * permission; activating requires the provider to be configured first.
 */
export function ProviderRow({
  capability,
  provider,
  configured,
  fields,
  isActive,
  canManage,
  onActivate,
  isActivating,
}: ProviderRowProps) {
  const { t } = useTranslation('integrations');
  const { open: openModal } = useModalActions();
  const { run, result, isTesting } = useProviderTest();

  // A public base pointing at the SIGNED S3 API host uploads fine and then 403s every rendered
  // <img> — a failure that would otherwise surface days later, on the website, to a visitor.
  // Both fields are non-secret, so their values are in the masked status (U15: read, don't guess).
  const valueOf = (key: string) =>
    fields.find((field) => field.key === key)?.value ?? null;
  const publicUrlIsSignedOnly = isSignedOnlyPublicUrl(
    valueOf('publicUrl'),
    valueOf('endpoint'),
  );

  return (
    <div className="flex flex-col gap-2 border-b border-border-2 px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-32 font-medium text-text">
          {t(`provider.${provider}`)}
        </span>

        <div className="flex items-center gap-2">
          {isActive ? (
            <Badge tone="good" dot>
              {t('status.active')}
            </Badge>
          ) : null}
          <Badge tone={configured ? 'neutral' : 'warn'} dot={!configured}>
            {t(configured ? 'status.configured' : 'status.notConfigured')}
          </Badge>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {canManage ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  openModal(PROVIDER_CONFIG_MODAL, { capability, provider })
                }
              >
                {t('actions.configure')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={isTesting}
                disabled={!configured}
                onClick={() => void run(capability, provider)}
              >
                {t('actions.test')}
              </Button>
              {!isActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={isActivating}
                  disabled={!configured}
                  onClick={onActivate}
                >
                  {t('actions.setActive')}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/*
        Storage only: "can the browser actually upload to this bucket?" — a separate check from
        the credential test above, because the two fail independently (rules change-log
        2026-07-20). It renders itself away when it has nothing to say.
      */}
      {capability === 'storage' ? (
        <StorageCorsPanel
          provider={provider}
          configured={configured}
          canManage={canManage}
        />
      ) : null}

      {publicUrlIsSignedOnly ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          {t('warnings.publicUrlIsApiEndpoint')}
        </p>
      ) : null}

      {/*
        The probe's verdict. `message` arrives ALREADY localized by the service that ran it
        (U24d); `detail` is the vendor's own English text (`SignatureDoesNotMatch`, `ENOTFOUND`)
        and is shown muted underneath — the owner keeps the diagnostic without the UI dropping
        out of Arabic (U24e). It is `dir="ltr"` because it is always a latin technical string.
      */}
      {result ? (
        <div role="status" className="grid gap-1">
          <p
            className={`flex items-center gap-2 text-sm ${
              result.ok ? 'text-good' : 'text-bad'
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="size-4 shrink-0" aria-hidden="true" />
            )}
            {result.message}
          </p>
          {result.detail ? (
            <p
              dir="ltr"
              className="ms-6 break-words font-mono text-xs text-dim"
            >
              {result.detail}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
