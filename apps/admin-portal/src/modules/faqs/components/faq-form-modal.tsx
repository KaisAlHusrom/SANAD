import type { FaqItem } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useFaqForm } from '../hooks/use-faqs-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const FAQ_FORM_MODAL = 'content.faq.form';

/** Global-registry create/edit modal for an FAQ (W7). */
export function FaqFormModal({ open, onClose, data }: ModalComponentProps) {
  const item = data.item as FaqItem | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    useFaqForm(item);

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
