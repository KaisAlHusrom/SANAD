import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

export interface AddTypeOption {
  value: string;
  label: string;
}

/**
 * The dashed "+ Add" type picker (the `Sanad Admin.dc.html` `+ قسم` / `+ block` canon, U21):
 * a dashed-accent button opening a dropdown of typed options. Reused for "add section" and
 * "add block" — selecting a kind creates a blank entity of that type.
 */
export function AddTypeMenu({
  label,
  options,
  onSelect,
}: {
  label: string;
  options: AddTypeOption[];
  onSelect: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-input border border-dashed border-accent-line px-3.5 py-2 text-sm font-medium text-accent hover:bg-accent-soft"
        >
          <Plus className="size-4" aria-hidden="true" />
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onSelect(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
