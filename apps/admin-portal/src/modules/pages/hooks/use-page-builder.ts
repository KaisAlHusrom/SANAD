import type { SectionNode, SectionType } from '@sanad/contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import {
  useDeleteBlockMutation,
  useDeleteSectionMutation,
  useGetPageTreeQuery,
  useReorderBlocksMutation,
  useReorderSectionsMutation,
  useUpsertSectionMutation,
} from '../api/pages.api';

export interface UsePageBuilderResult {
  tree: ReturnType<typeof useGetPageTreeQuery>['data'];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Create a blank section of `type`; resolves to its new id (so the caller can drill into it). */
  addSection: (type: SectionType) => Promise<string | undefined>;
  toggleSectionVisibility: (section: SectionNode) => Promise<void>;
  deleteSection: (section: SectionNode) => Promise<void>;
  reorderSectionsTo: (orderedIds: string[]) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  reorderBlocksTo: (orderedIds: string[]) => Promise<void>;
}

/**
 * The pages-builder orchestration (U5): loads the draft-visible page tree and exposes the
 * section/block mutations the preview-first Studio drives — add (a blank section of a chosen type,
 * returning its id so the rail can drill into it), visibility toggle (preserving copy, W6), delete
 * (confirmed), and atomic drag-reorder of sections and a section's blocks (U21). Block create/edit go
 * through the typed modal; this hook owns delete + reorder. Section SELECTION lives in the page (it
 * drives both the canvas focus and the rail detail). All writes re-fetch the page tree (W3).
 */
export function usePageBuilder(pageId: string): UsePageBuilderResult {
  const { t } = useTranslation('pages');
  const { confirm } = useConfirm();
  const {
    data: tree,
    isLoading,
    isFetching,
    isError,
  } = useGetPageTreeQuery(pageId);
  const [upsertSection] = useUpsertSectionMutation();
  const [deleteSectionMutation] = useDeleteSectionMutation();
  const [reorderSections] = useReorderSectionsMutation();
  const [deleteBlockMutation] = useDeleteBlockMutation();
  const [reorderBlocks] = useReorderBlocksMutation();

  const addSection = useCallback(
    async (type: SectionType): Promise<string | undefined> => {
      try {
        const created = await upsertSection({
          body: {
            pageId,
            type,
            sortOrder: tree?.sections.length ?? 0,
            published: true,
          },
          pageId,
        }).unwrap();
        toast.success(t('section.added'));
        return created.id;
      } catch {
        toast.error(t('errors.saveFailed'));
        return undefined;
      }
    },
    [upsertSection, pageId, tree, t],
  );

  /** Flip `published` without touching the section's copy (re-send the existing translations, W6). */
  const toggleSectionVisibility = useCallback(
    async (section: SectionNode): Promise<void> => {
      try {
        await upsertSection({
          body: {
            id: section.id,
            pageId,
            type: section.type,
            sortOrder: section.sortOrder,
            published: !section.published,
            eyebrow: section.eyebrow,
            title: section.title,
            subtitle: section.subtitle,
          },
          pageId,
        }).unwrap();
      } catch {
        toast.error(t('errors.saveFailed'));
      }
    },
    [upsertSection, pageId, t],
  );

  const deleteSection = useCallback(
    async (section: SectionNode): Promise<void> => {
      await confirm({
        title: t('section.deleteTitle'),
        message: t('section.deleteMessage'),
        variant: 'danger',
        confirmLabel: t('delete.confirm'),
        onConfirm: async () => {
          try {
            await deleteSectionMutation({ id: section.id, pageId }).unwrap();
            toast.success(t('section.deleted'));
          } catch {
            const message = t('errors.deleteFailed');
            toast.error(message);
            throw new Error(message);
          }
        },
      });
    },
    [confirm, deleteSectionMutation, pageId, t],
  );

  const reorderSectionsTo = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      try {
        await reorderSections({ ids: orderedIds, pageId }).unwrap();
        toast.success(t('section.reordered'));
      } catch (error) {
        toast.error(t('errors.reorderFailed'));
        throw error;
      }
    },
    [reorderSections, pageId, t],
  );

  const deleteBlock = useCallback(
    async (blockId: string): Promise<void> => {
      await confirm({
        title: t('block.deleteTitle'),
        message: t('block.deleteMessage'),
        variant: 'danger',
        confirmLabel: t('delete.confirm'),
        onConfirm: async () => {
          try {
            await deleteBlockMutation({ id: blockId, pageId }).unwrap();
            toast.success(t('block.deleted'));
          } catch {
            const message = t('errors.deleteFailed');
            toast.error(message);
            throw new Error(message);
          }
        },
      });
    },
    [confirm, deleteBlockMutation, pageId, t],
  );

  const reorderBlocksTo = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      try {
        await reorderBlocks({ ids: orderedIds, pageId }).unwrap();
        toast.success(t('block.reordered'));
      } catch (error) {
        toast.error(t('errors.reorderFailed'));
        throw error;
      }
    },
    [reorderBlocks, pageId, t],
  );

  return {
    tree,
    isLoading,
    isFetching,
    isError,
    addSection,
    toggleSectionVisibility,
    deleteSection,
    reorderSectionsTo,
    deleteBlock,
    reorderBlocksTo,
  };
}
