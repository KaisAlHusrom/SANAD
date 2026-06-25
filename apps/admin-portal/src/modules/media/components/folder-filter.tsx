import type { MediaFolder } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { ServerSelect } from '../../../components/server-select';
import {
  useGetFoldersByIdsQuery,
  useSearchFolderLookupQuery,
} from '../../../data/lookups/folder-lookup.api';

interface FolderFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

/**
 * Filter the library by folder via the shared folder lookup (W5) — a server-searched
 * ServerSelect, NOT a preloaded `<select>`. Bridges through `folder-lookup.api` so the
 * media list page never imports another module's api directly.
 */
export function FolderFilter({ value, onChange }: FolderFilterProps) {
  const { t } = useTranslation('media');
  return (
    <div className="w-56">
      <ServerSelect<MediaFolder>
        value={value}
        onChange={(next) =>
          onChange(typeof next === 'string' ? next : undefined)
        }
        useSearch={useSearchFolderLookupQuery}
        useResolveByIds={useGetFoldersByIdsQuery}
        getOptionValue={(folder) => folder.id}
        getOptionLabel={(folder) => folder.name}
        placeholder={t('filters.allFolders')}
        aria-label={t('filters.allFolders')}
      />
    </div>
  );
}
