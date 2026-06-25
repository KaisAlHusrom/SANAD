import * as RadixToast from '@radix-ui/react-toast';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import {
  toastStore,
  type ToastRecord,
  type ToastVariant,
} from '../../../data/toast';
import { cn } from '../../../lib/cn';

const VARIANT_ICON: Record<
  ToastVariant,
  ComponentType<{ className?: string }>
> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const VARIANT_TONE: Record<ToastVariant, string> = {
  success: 'text-good',
  error: 'text-bad',
  warning: 'text-warn',
  info: 'text-accent',
  loading: 'text-dim',
};

/**
 * One toast item (presentation only — lifecycle/timers live in `toastStore`, U5). Radix
 * provides a11y + swipe; auto-dismiss is store-owned, so `duration={Infinity}` disables
 * Radix's own timer and removal flows through `onOpenChange` (Close / swipe).
 */
export function Toast({ record }: { record: ToastRecord }) {
  const { t } = useTranslation('common');
  const Icon = VARIANT_ICON[record.variant];

  return (
    <RadixToast.Root
      duration={Infinity}
      onOpenChange={(open) => {
        if (!open) {
          toastStore.dismiss(record.id);
        }
      }}
      className={cn(
        'flex items-start gap-3 rounded-md border border-border-2 bg-surface p-4 shadow-portal',
        'data-[state=closed]:opacity-0',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-5 shrink-0',
          VARIANT_TONE[record.variant],
          record.variant === 'loading' && 'animate-spin',
        )}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <RadixToast.Title className="text-sm font-medium text-text">
          {record.title}
        </RadixToast.Title>
        {record.description ? (
          <RadixToast.Description className="text-sm text-dim">
            {record.description}
          </RadixToast.Description>
        ) : null}
      </div>
      {record.action ? (
        <RadixToast.Action altText={record.action.label} asChild>
          <button
            type="button"
            onClick={record.action.onClick}
            className="shrink-0 text-sm font-medium text-accent hover:text-accent-2"
          >
            {record.action.label}
          </button>
        </RadixToast.Action>
      ) : null}
      <RadixToast.Close
        aria-label={t('actions.close')}
        className="shrink-0 text-faint transition-colors hover:text-text"
      >
        <X className="size-4" aria-hidden="true" />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}
