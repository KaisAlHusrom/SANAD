import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { useModalActions } from '../../../data/modal/use-modal';
import { useFormatDateTime } from '../../../lib/format/use-format-datetime';
import type { SecretStatusTone } from '../hooks/use-secret-row';
import { useSecretRow } from '../hooks/use-secret-row';
import type { SecretRow } from '../hooks/use-secrets-list';
import { SET_SECRET_MODAL } from './set-secret-modal';

const TONE_CLASS: Record<SecretStatusTone, string> = {
  good: 'text-good',
  warn: 'text-warn',
  neutral: 'text-dim',
};

/** One masked secret row (presentational — display + RBAC live in `useSecretRow`, U5). */
export function SecretTableRow({ row }: { row: SecretRow }) {
  const { entry, status } = row;
  const { t } = useTranslation('integrationSecrets');
  const formatDateTime = useFormatDateTime();
  const { open: openModal } = useModalActions();
  const { canManage, isSet, statusKey, statusTone, last4Display } =
    useSecretRow(entry, status);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-sm text-text">{entry.key}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dim">
            {t(`feature.${entry.feature}`)}
          </span>
          {!entry.wired ? (
            <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-xs text-faint">
              {t('badge.notWired')}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className={TONE_CLASS[statusTone]}>
          {t(`status.${statusKey}`)}
        </span>
        {last4Display ? (
          <span className="font-mono text-xs text-dim">{last4Display}</span>
        ) : null}
      </div>

      <span className="text-xs text-dim">
        {status.updatedAt ? formatDateTime(status.updatedAt) : '—'}
      </span>

      <div className="flex justify-end">
        {canManage ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              openModal(SET_SECRET_MODAL, { key: entry.key, isSet })
            }
          >
            {isSet ? t('actions.rotate') : t('actions.set')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
