import type { MenuItemNode, MenuKey } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useMenuItemForm } from '../hooks/use-menu-item-form';

/** The modal `type` this component serves in the global registry (item create + edit). */
export const MENU_ITEM_FORM_MODAL = 'content.menu-item.form';

/** The data the editor passes when opening the item modal (create or edit). */
export interface MenuItemFormModalData {
  menuId: string;
  menuKey: MenuKey;
  parentId: string | null;
  item?: MenuItemNode;
  nextSortOrder: number;
}

/**
 * Global-registry create/edit modal for a menu item (W7). The editor opens it with the owning
 * menu + an optional `parentId` (add-child), the next sort order (create) or the `item` (edit);
 * `useMenuItemForm` builds the label/url/icon fields and the DynamicForm owns validation/toasts.
 */
export function MenuItemFormModal({
  open,
  onClose,
  data,
}: ModalComponentProps) {
  const { menuId, menuKey, parentId, item, nextSortOrder } =
    data as unknown as MenuItemFormModalData;
  const { fields, schema, mode, record, submit, title, successMessage } =
    useMenuItemForm({ menuId, menuKey, parentId, item, nextSortOrder });

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
