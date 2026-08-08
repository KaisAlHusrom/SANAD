import {
  pickLocalized,
  type Locale,
  type MenuItemNode,
  type MenuKey,
} from '@sanad/contracts';
import { CornerDownRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DragHandle, SortableList } from '../../../components/sortable';
import type { SortableHandle } from '../../../components/sortable';
import { EmptyState } from '../../../components/feedback/empty-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import { Button } from '../../../components/ui/button';
import { useModalActions } from '../../../data/modal/use-modal';
import { useMenuEditor } from '../hooks/use-menu-editor';
import {
  MENU_ITEM_FORM_MODAL,
  type MenuItemFormModalData,
} from './menu-item-form-modal';

/**
 * A keyed menu's item editor (U21) — the one-level nested item tree: top-level items drag-reorder
 * among themselves, each item's children drag-reorder within it (W6 labels per-locale). Add item /
 * add child / edit / delete drive the typed modal + the builder. Reorder is atomic per sibling set.
 */
export function MenuEditor({
  menuKey,
  menuId,
  locale,
  canManage,
}: {
  menuKey: MenuKey;
  menuId: string;
  locale: Locale;
  canManage: boolean;
}) {
  const { t } = useTranslation('menus');
  const { open } = useModalActions();
  const { tree, isLoading, isError, deleteItem, reorderItems } =
    useMenuEditor(menuKey);

  const openModal = (
    parentId: string | null,
    nextSortOrder: number,
    item?: MenuItemNode,
  ): void => {
    const data: MenuItemFormModalData = {
      menuId,
      menuKey,
      parentId,
      item,
      nextSortOrder,
    };
    open(MENU_ITEM_FORM_MODAL, data as unknown as Record<string, unknown>);
  };

  const card = (
    item: MenuItemNode,
    handle: SortableHandle | null,
    options: { parentId: string | null; childCount: number },
  ) => (
    <div className="flex items-center gap-2 rounded-input border border-border bg-surface px-3 py-2">
      {handle ? (
        <DragHandle handle={handle} label={t('item.dragHandle')} />
      ) : null}
      {item.icon ? (
        <span className="font-mono text-xs text-faint">{item.icon}</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
        {pickLocalized(item.label, locale) || (
          <span className="text-faint">{t('item.untitled')}</span>
        )}
      </span>
      <span className="hidden min-w-0 basis-2/5 truncate font-mono text-xs text-faint sm:block">
        {item.url}
      </span>
      {canManage ? (
        <div className="flex items-center gap-1">
          {options.parentId === null ? (
            <button
              type="button"
              onClick={() => openModal(item.id, options.childCount)}
              aria-label={t('item.addChild')}
              className="grid size-7 place-items-center rounded-input text-dim hover:bg-surface-2 hover:text-text"
            >
              <CornerDownRight className="size-4" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => openModal(options.parentId, item.sortOrder, item)}
            aria-label={t('actions.edit')}
            className="grid size-7 place-items-center rounded-input text-dim hover:bg-surface-2 hover:text-text"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => void deleteItem(item.id)}
            aria-label={t('actions.delete')}
            className="grid size-7 place-items-center rounded-input text-dim hover:bg-surface-2 hover:text-bad"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text">
          {t('editor.items', { count: tree?.items.length ?? 0 })}
        </h2>
        {canManage && tree ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => openModal(null, tree.items.length)}
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('editor.addItem')}
          </Button>
        ) : null}
      </div>

      <RenderGate
        isLoading={isLoading}
        isError={isError}
        isEmpty={!!tree && tree.items.length === 0}
        skeleton={<Skeleton className="h-32 w-full" />}
        error={<ErrorState message={t('editor.loadError')} />}
        empty={
          <EmptyState
            title={t('editor.emptyTitle')}
            description={t('editor.emptyBody')}
          />
        }
      >
        {tree ? (
          <SortableList
            items={tree.items}
            getId={(item) => item.id}
            onReorder={reorderItems}
            disabled={!canManage}
            className="flex flex-col gap-3"
            renderItem={(item, handle) => (
              <div className="flex flex-col gap-2">
                {card(item, handle, {
                  parentId: null,
                  childCount: item.children.length,
                })}
                {item.children.length > 0 ? (
                  <div className="ms-7 border-s border-border ps-3">
                    <SortableList
                      items={item.children}
                      getId={(child) => child.id}
                      onReorder={reorderItems}
                      disabled={!canManage}
                      className="flex flex-col gap-2"
                      renderItem={(child, childHandle) =>
                        card(child, childHandle, {
                          parentId: item.id,
                          childCount: 0,
                        })
                      }
                    />
                  </div>
                ) : null}
              </div>
            )}
          />
        ) : null}
      </RenderGate>
    </div>
  );
}
