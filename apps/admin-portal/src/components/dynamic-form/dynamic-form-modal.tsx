import type { FieldValues } from 'react-hook-form';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
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
      <DialogContent>
        <DialogTitle className="text-lg font-semibold text-text">
          {title}
        </DialogTitle>
        <DynamicForm
          {...formProps}
          onSuccess={() => {
            onSuccess?.();
            onClose();
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
