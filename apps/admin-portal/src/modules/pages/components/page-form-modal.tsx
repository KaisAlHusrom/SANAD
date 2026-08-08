import type { PageSummary } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { usePageForm } from '../hooks/use-page-form';

/** The modal `type` this component serves in the global registry (create + edit page meta). */
export const PAGE_FORM_MODAL = 'content.page.form';

/**
 * Global-registry create/edit modal for a page's meta (W7). Opens with `{ item }` for edit
 * (prefill) or no data for create; the DynamicForm owns validation, submit, and toasts. The
 * section→block tree is assembled in the builder, not here.
 */
export function PageFormModal({ open, onClose, data }: ModalComponentProps) {
  const item = data.item as PageSummary | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    usePageForm(item);

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
