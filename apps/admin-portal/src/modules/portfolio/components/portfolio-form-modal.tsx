import type { PortfolioProjectItem } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { usePortfolioForm } from '../hooks/use-portfolio-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const PORTFOLIO_FORM_MODAL = 'content.portfolio.form';

/**
 * Global-registry create/edit modal for a portfolio project (W7). Opens with `{ item }` for
 * edit (prefill) or no data for create; the DynamicForm owns validation, submit, and toasts.
 */
export function PortfolioFormModal({
  open,
  onClose,
  data,
}: ModalComponentProps) {
  const item = data.item as PortfolioProjectItem | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    usePortfolioForm(item);

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
