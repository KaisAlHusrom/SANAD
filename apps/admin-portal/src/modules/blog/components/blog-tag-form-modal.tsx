import type { BlogTagItem } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useBlogTagForm } from '../hooks/use-blog-tag-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const BLOG_TAG_FORM_MODAL = 'content.blog-tag.form';

/**
 * Global-registry create/edit modal for a blog tag (W7). Opens with `{ item }` for edit (prefill)
 * or no data for create; the DynamicForm owns validation, submit, and toasts.
 */
export function BlogTagFormModal({ open, onClose, data }: ModalComponentProps) {
  const item = data.item as BlogTagItem | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    useBlogTagForm(item);

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
