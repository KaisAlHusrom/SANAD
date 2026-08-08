import { ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { useMediaIdPicker } from './use-media-id-picker';

interface MediaIdPickerFieldProps {
  /** The selected media id ('' when none). */
  value: string;
  onChange: (id: string) => void;
}

/**
 * Picks a media asset **id** for content fields that store a `coverMediaId`/`avatarMediaId` UUID
 * (W5 — bridges via the shared lookups, never the media module's api). The "choose" button opens
 * the reusable `MediaLibraryModal` (browse existing + folder nav + create-folder + upload) so the
 * user never leaves the form. The selected asset's thumbnail is resolved for preview; without
 * `media.read` there is no picker (no manual UUID entry). Presentational — logic in
 * `useMediaIdPicker` (U5).
 */
export function MediaIdPickerField({
  value,
  onChange,
}: MediaIdPickerFieldProps) {
  const { t } = useTranslation('common');
  const { canBrowse, openPicker, pickerElement, preview, clear } =
    useMediaIdPicker({ value, onChange });

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        <img
          src={preview.url}
          alt=""
          className="size-12 shrink-0 rounded-input border border-border-2 object-cover"
        />
      ) : (
        <div className="grid size-12 shrink-0 place-items-center rounded-input border border-border-2 bg-surface-2 text-faint">
          <ImageOff className="size-5" aria-hidden="true" />
        </div>
      )}
      <span className="flex-1 truncate text-sm text-dim">
        {preview ? preview.filename : value ? value : t('mediaPicker.none')}
      </span>
      {value ? (
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          {t('actions.clear')}
        </Button>
      ) : null}
      {canBrowse ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={openPicker}
          >
            {t('mediaPicker.choose')}
          </Button>
          {pickerElement}
        </>
      ) : null}
    </div>
  );
}
