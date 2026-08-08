import type { BlockNode, BlockType } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useBlockForm } from '../hooks/use-block-form';

/** The modal `type` this component serves in the global registry (typed create + edit block). */
export const BLOCK_FORM_MODAL = 'content.block.form';

/** The data the builder passes when opening the block modal (create or edit). */
export interface BlockFormModalData {
  pageId: string;
  sectionId: string;
  type: BlockType;
  node?: BlockNode;
  nextSortOrder: number;
}

/**
 * Global-registry create/edit modal for a typed block (W7, U21). The builder opens it with the
 * owning page + section, the chosen block `type`, the next sort order (create) or the `node`
 * (edit). `useBlockForm` renders the kind's typed fields; the DynamicForm owns validation/toasts.
 */
export function BlockFormModal({ open, onClose, data }: ModalComponentProps) {
  const { pageId, sectionId, type, node, nextSortOrder } =
    data as unknown as BlockFormModalData;
  const { fields, schema, mode, record, submit, title, successMessage } =
    useBlockForm({ pageId, sectionId, type, node, nextSortOrder });

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
