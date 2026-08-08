import {
  type LocalizedText,
  type MenuItemNode,
  type MenuKey,
} from '@sanad/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import {
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
} from '../api/menus.api';
import {
  MENU_ITEM_TRANSLATABLE_KEYS,
  menuItemFormSchema,
  type MenuItemFormValues,
} from '../schema';

export interface UseMenuItemFormArgs {
  menuId: string;
  menuKey: MenuKey;
  /** Set when adding a child under another item (one nesting level); null for a top-level item. */
  parentId: string | null;
  item?: MenuItemNode;
  nextSortOrder: number;
}

export interface UseMenuItemFormResult {
  fields: FieldConfig<MenuItemFormValues>[];
  schema: typeof menuItemFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: MenuItemFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * The menu-item create/edit form (U5/W6): the translatable `label` (per-locale tabs) + `url` +
 * an optional `icon` key. The submit pivots the label back to the contract `{ar,en}`, nulls an
 * empty icon, and threads the owning `menuId`/`parentId`/sortOrder (create) or the item id (edit).
 */
export function useMenuItemForm(
  args: UseMenuItemFormArgs,
): UseMenuItemFormResult {
  const { menuId, menuKey, parentId, item, nextSortOrder } = args;
  const { t } = useTranslation('menus');
  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<MenuItemFormValues>[]>(
    () => [
      {
        name: 'label',
        type: 'text',
        label: t('item.label'),
        translatable: true,
        colSpan: 4,
      },
      {
        name: 'url',
        type: 'text',
        label: t('item.url'),
        placeholder: t('item.urlPlaceholder'),
        colSpan: 2,
      },
      {
        name: 'icon',
        type: 'text',
        label: t('item.icon'),
        placeholder: t('item.iconPlaceholder'),
        colSpan: 2,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item
        ? {
            ...toLocalizedFormRecord(item, MENU_ITEM_TRANSLATABLE_KEYS),
            url: item.url,
            icon: item.icon ?? '',
          }
        : undefined,
    [item],
  );

  const submit = async (values: MenuItemFormValues): Promise<unknown> => {
    const { label } = toLocalizedUpsertBody<{ label: LocalizedText }>(values, {
      translatableKeys: MENU_ITEM_TRANSLATABLE_KEYS,
    });
    const icon = values.icon ? values.icon : null;
    if (item) {
      return updateMenuItem({
        id: item.id,
        body: { url: values.url, icon, label },
        menuKey,
      }).unwrap();
    }
    return createMenuItem({
      body: {
        menuId,
        parentId,
        url: values.url,
        icon,
        sortOrder: nextSortOrder,
        label,
      },
      menuKey,
    }).unwrap();
  };

  return {
    fields,
    schema: menuItemFormSchema,
    mode,
    record,
    submit,
    title: item ? t('item.editTitle') : t('item.createTitle'),
    successMessage: item ? t('item.updated') : t('item.created'),
  };
}
