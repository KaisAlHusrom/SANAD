import type { BlogCategoryItem } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useBlogCategoryForm } from '../hooks/use-blog-category-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const BLOG_CATEGORY_FORM_MODAL = 'content.blog-category.form';

/**
 * Global-registry create/edit modal for a blog category (W7). Opens with `{ item }` for edit
 * (prefill) or no data for create; the DynamicForm owns validation, submit, and toasts.
 */
export function BlogCategoryFormModal({
  open,
  onClose,
  data,
}: ModalComponentProps) {
  const item = data.item as BlogCategoryItem | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    useBlogCategoryForm(item);

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
