import { useTranslation } from 'react-i18next';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import { EmptyState } from '../../../components/feedback/empty-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import { Button } from '../../../components/ui/button';
import { useModalActions } from '../../../data/modal/use-modal';
import { useMediaList } from '../hooks/use-media-list';
import { NEW_FOLDER_MODAL } from './new-folder-modal';
import { FolderFilter } from './folder-filter';
import { MediaGrid } from './media-grid';
import { TypeFilter } from './type-filter';
import { UploadButton } from './upload-button';

/** The media library page (presentational — list state in `useMediaList`, U5). */
export function MediaPage() {
  const { t } = useTranslation('media');
  const canManage = useRequirePermission('media.manage');
  const { open: openModal } = useModalActions();
  const {
    items,
    isLoading,
    isError,
    isStorageUnconfigured,
    folderId,
    setFolderId,
    type,
    setType,
  } = useMediaList();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-dim">{t('subtitle')}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <FolderFilter value={folderId} onChange={setFolderId} />
        <TypeFilter value={type} onChange={setType} />
        {canManage ? (
          <div className="flex flex-1 items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => openModal(NEW_FOLDER_MODAL)}
            >
              {t('toolbar.newFolder')}
            </Button>
            <UploadButton folderId={folderId} />
          </div>
        ) : null}
      </div>

      <RenderGate
        isLoading={isLoading}
        isError={isError}
        isEmpty={items.length === 0}
        skeleton={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square w-full" />
            ))}
          </div>
        }
        error={
          <ErrorState
            message={t(
              isStorageUnconfigured
                ? 'errors.storageUnconfigured'
                : 'errors.loadFailed',
            )}
          />
        }
        empty={
          <EmptyState
            title={t('empty.title')}
            description={t('empty.description')}
          />
        }
      >
        <MediaGrid items={items} canManage={canManage} />
      </RenderGate>
    </section>
  );
}
