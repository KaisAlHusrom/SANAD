import { AlertTriangle, Info } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConfirmOptions, ConfirmTone } from '../../../data/confirm';
import { cn } from '../../../lib/cn';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../ui/dialog';

const TONE_ICON: Record<ConfirmTone, ComponentType<{ className?: string }>> = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const TONE_CLASS: Record<ConfirmTone, string> = {
  danger: 'text-bad',
  warning: 'text-warn',
  info: 'text-accent',
};

interface ConfirmationDialogProps {
  open: boolean;
  options: ConfirmOptions;
  pending: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Presentational confirmation (state lives in `confirmStore`, U5). Built on the Dialog. */
export function ConfirmationDialog({
  open,
  options,
  pending,
  error,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const { t } = useTranslation('common');
  const tone = options.variant ?? 'info';
  const Icon = TONE_ICON[tone];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Block esc/backdrop dismiss while a mutation is in flight.
        if (!next && !pending) {
          onCancel();
        }
      }}
    >
      <DialogContent>
        <div className="flex items-start gap-3">
          <Icon
            className={cn('mt-0.5 size-5 shrink-0', TONE_CLASS[tone])}
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-col gap-2">
            <DialogTitle className="text-lg font-semibold text-text">
              {options.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-dim">
              {options.message}
            </DialogDescription>
            {options.subMessage ? (
              <p className="text-sm text-faint">{options.subMessage}</p>
            ) : null}
          </div>
        </div>
        {error ? (
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={pending}
          >
            {options.cancelLabel ?? t('actions.cancel')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={TONE_CLASS[tone]}
            loading={pending}
            onClick={onConfirm}
          >
            {options.confirmLabel ?? t('actions.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
