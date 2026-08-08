import type { FieldValues } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { DialogTitleProvider } from '../ui/dialog-stack';
import { DynamicForm } from './dynamic-form';
import type { DynamicFormProps } from './dynamic-form.types';

export interface DynamicFormModalProps<
  TValues extends FieldValues,
> extends DynamicFormProps<TValues> {
  open: boolean;
  onClose: () => void;
  title: string;
}

/**
 * The DynamicForm wrapped in a Dialog for create/edit modals. An entity registers a thin
 * global-registry modal that maps the registry `{mode, record}` payload to this component's
 * props (fields/schema/submit). Submit success closes the modal (registry `onClose`, W7).
 */
export function DynamicFormModal<TValues extends FieldValues>({
  open,
  onClose,
  title,
  onSuccess,
  ...formProps
}: DynamicFormModalProps<TValues>) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent size="lg" className="gap-0 overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-text">
            {title}
          </DialogTitle>
        </DialogHeader>
        {/* Publish this modal's title so a picker opened from one of its fields can show
            "«title» ▸ Media library" and a back arrow, instead of appearing as an unexplained
            second box of the same width (owner report, 2026-07-20). */}
        <DialogTitleProvider title={title}>
          <DynamicForm
            {...formProps}
            onSuccess={() => {
              onSuccess?.();
              onClose();
            }}
            onCancel={onClose}
          />
        </DialogTitleProvider>
      </DialogContent>
    </Dialog>
  );
}
