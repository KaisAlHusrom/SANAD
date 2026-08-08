import type { ServiceItem } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useServiceForm } from '../hooks/use-services-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const SERVICE_FORM_MODAL = 'content.service.form';

/**
 * Global-registry create/edit modal for a service (W7). Opens with `{ item }` for edit
 * (prefill) or no data for create; the DynamicForm owns validation, submit, and toasts.
 */
export function ServiceFormModal({ open, onClose, data }: ModalComponentProps) {
  const item = data.item as ServiceItem | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    useServiceForm(item);

  return (
    <DynamicFormModal
      open={open}
      onClose={onClose}
      title={title}
      fields={fields}
      schema={schema}
      mode={mode}
      record={record}
      submit={submit}
      successMessage={successMessage}
    />
  );
}
