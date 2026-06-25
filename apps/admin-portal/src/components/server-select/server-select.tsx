import { Check, ChevronsUpDown, Loader2, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { ServerSelectProps } from './server-select.types';
import { useServerSelect } from './use-server-select';

const DEFAULT_MAX_DISPLAY = 3;

/**
 * The W5 server-searched picker (presentation; logic in `useServerSelect`). A Radix
 * Popover hosting a cmdk command list — debounced server search, infinite-scroll, and
 * selected values pinned first. Single or multi (chips). Tokens-only, RTL via logical
 * properties (the chevron is vertical, so it needs no direction flip).
 */
export function ServerSelect<T>(props: ServerSelectProps<T>) {
  const { t } = useTranslation('uiKit');
  const {
    multiple = false,
    clearable = true,
    maxDisplay = DEFAULT_MAX_DISPLAY,
    placeholder,
    searchPlaceholder,
    disabled = false,
    error,
    onCreate,
    createLabel,
  } = props;

  const vm = useServerSelect(props);
  const hasSelection = vm.selectedValues.length > 0;
  const triggerLabel = placeholder ?? t('serverSelect.placeholder');

  const shown = multiple
    ? vm.selectedOptions.slice(0, maxDisplay)
    : vm.selectedOptions;
  const overflow = multiple ? vm.selectedOptions.length - shown.length : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <Popover open={vm.open} onOpenChange={vm.setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={vm.open}
              aria-label={triggerLabel}
              disabled={disabled}
              className={cn(
                'flex h-10 w-full flex-1 items-center gap-1.5 rounded-input border border-border-2 bg-surface px-3 text-sm text-text',
                'focus-visible:border-accent-line focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {multiple ? (
                shown.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-1">
                    {shown.map((option) => (
                      <span
                        key={option.value}
                        className="inline-flex items-center gap-1 rounded-pill bg-surface-2 px-2 py-0.5 text-xs text-text"
                      >
                        {option.label}
                        <span
                          role="button"
                          tabIndex={-1}
                          aria-label={t('serverSelect.clear')}
                          className="text-dim hover:text-text"
                          onClick={(event) => {
                            event.stopPropagation();
                            vm.remove(option.value);
                          }}
                        >
                          <X className="size-3" aria-hidden="true" />
                        </span>
                      </span>
                    ))}
                    {overflow > 0 ? (
                      <span className="text-xs text-dim">
                        {t('serverSelect.more', { count: overflow })}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-faint">{triggerLabel}</span>
                )
              ) : hasSelection ? (
                <span>{vm.selectedOptions[0]?.label ?? triggerLabel}</span>
              ) : (
                <span className="text-faint">{triggerLabel}</span>
              )}
              <ChevronsUpDown
                className="ms-auto size-4 shrink-0 text-dim"
                aria-hidden="true"
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <div className="p-1">
                <CommandInput
                  aria-label={
                    searchPlaceholder ?? t('serverSelect.searchPlaceholder')
                  }
                  placeholder={
                    searchPlaceholder ?? t('serverSelect.searchPlaceholder')
                  }
                  value={vm.search}
                  onValueChange={vm.setSearch}
                />
              </div>
              <CommandList>
                {vm.isEmpty ? (
                  <CommandEmpty>{t('serverSelect.noResults')}</CommandEmpty>
                ) : null}
                {vm.options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => vm.select(option)}
                  >
                    {vm.isSelected(option.value) ? (
                      <Check
                        className="size-4 text-accent"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="size-4" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {option.node}
                    </span>
                  </CommandItem>
                ))}
                {vm.isFetching ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-dim">
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    {t('serverSelect.loading')}
                  </div>
                ) : null}
                {/* Infinite-scroll sentinel: intersecting it loads the next page. */}
                <div ref={vm.setSentinel} aria-hidden="true" className="h-px" />
              </CommandList>
              {onCreate ? (
                <div className="border-t border-border-2 p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      vm.setOpen(false);
                      onCreate();
                    }}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {createLabel ?? t('serverSelect.addNew')}
                  </Button>
                </div>
              ) : null}
            </Command>
          </PopoverContent>
        </Popover>
        {clearable && hasSelection && !disabled ? (
          <button
            type="button"
            aria-label={t('serverSelect.clear')}
            onClick={vm.clear}
            className="grid size-9 shrink-0 place-items-center rounded-input text-dim hover:bg-surface-2 hover:text-text"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-bad" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
