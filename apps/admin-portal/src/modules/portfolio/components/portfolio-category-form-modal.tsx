import type { PortfolioCategoryItem } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { usePortfolioCategoryForm } from '../hooks/use-portfolio-category-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const PORTFOLIO_CATEGORY_FORM_MODAL = 'content.portfolio-category.form';

/**
 * Global-registry create/edit modal for a portfolio category (W7). Opens with `{ item }` for
 * edit (prefill) or no data for create; the DynamicForm owns validation, submit, and toasts.
 */
export function PortfolioCategoryFormModal({
  open,
  onClose,
  data,
}: ModalComponentProps) {
  const item = data.item as PortfolioCategoryItem | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    usePortfolioCategoryForm(item);

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
