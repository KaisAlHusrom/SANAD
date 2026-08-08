import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useMediaPicker } from './use-media-picker';

interface MediaPickerFieldProps {
  value: string;
  onChange: (url: string) => void;
  id?: string;
  placeholder?: string;
}

/**
 * A URL field with an optional "choose from the library" picker (W5 — bridges via the shared
 * lookups/write bridge). The picker opens the reusable `MediaLibraryModal` (browse + folder nav +
 * create-folder + upload). Presentational; logic in `useMediaPicker` (U5). Without `media.read`
 * the picker button is hidden and the plain URL input remains.
 */
export function MediaPickerField({
  value,
  onChange,
  id,
  placeholder,
}: MediaPickerFieldProps) {
  const { t } = useTranslation('common');
  const { canBrowse, openPicker, pickerElement } = useMediaPicker({
    onSelect: onChange,
  });

  return (
    <div className="flex items-center gap-2">
      {value ? (
        <img
          src={value}
          alt=""
          className="size-9 shrink-0 rounded-input border border-border-2 object-cover"
        />
      ) : null}
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
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
