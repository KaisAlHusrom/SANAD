import { useTranslation } from 'react-i18next';
import { ErrorState } from '../feedback/error-state';
import { RenderGate } from '../feedback/render-gate';
import { Skeleton } from '../feedback/skeleton';
import { EmptyState } from '../feedback/empty-state';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { useMediaPicker } from './use-media-picker';

interface MediaPickerFieldProps {
  value: string;
  onChange: (url: string) => void;
  id?: string;
  placeholder?: string;
}

/**
 * A URL field with an optional "choose from the library" picker (W5 — bridges via the
 * shared media-lookup). Presentational; logic in `useMediaPicker` (U5). When the user
 * lacks `media.read` the picker button is hidden and the plain URL input remains.
 */
export function MediaPickerField({
  value,
  onChange,
  id,
  placeholder,
}: MediaPickerFieldProps) {
  const { t } = useTranslation('common');
  const { canBrowse, open, setOpen, items, isLoading, isError, pick } =
    useMediaPicker({
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              {t('mediaPicker.choose')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="text-lg font-semibold text-text">
              {t('mediaPicker.title')}
            </DialogTitle>
            <RenderGate
              isLoading={isLoading}
              isError={isError}
              isEmpty={items.length === 0}
              skeleton={
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-square w-full" />
                  ))}
                </div>
              }
              error={<ErrorState message={t('mediaPicker.errorLoad')} />}
              empty={<EmptyState title={t('mediaPicker.empty')} />}
            >
              <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto">
                {items.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => pick(asset)}
                    className="overflow-hidden rounded-card border border-border-2 transition-colors hover:border-accent-line"
                  >
                    <img
                      src={asset.url}
                      alt={asset.alt.en || asset.filename}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </RenderGate>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
