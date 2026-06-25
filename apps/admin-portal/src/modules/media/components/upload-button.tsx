import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { useUploadButton } from '../hooks/use-upload-button';

interface UploadButtonProps {
  folderId?: string;
}

/** Presentational upload control (file-input wiring + flow live in `useUploadButton`, U5). */
export function UploadButton({ folderId }: UploadButtonProps) {
  const { t } = useTranslation('media');
  const { inputRef, openFileDialog, onFileChange, isUploading, error } =
    useUploadButton(folderId);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Button type="button" onClick={openFileDialog} loading={isUploading}>
        {isUploading ? t('toolbar.uploading') : t('toolbar.upload')}
      </Button>
      {error ? <span className="text-sm text-bad">{error}</span> : null}
    </div>
  );
}
