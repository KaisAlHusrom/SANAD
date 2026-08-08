import * as RadixSelect from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * Styled select on the token system (W2, shadcn-on-tokens) — the real component that replaces
 * every raw `<select>` (U21). Radix gives the `combobox`/`listbox`/`option` a11y, keyboard nav,
 * typeahead, and RTL for free. Use the `SelectField` convenience for the 90% fixed-enum case
 * (W5: plain Select for coded enums); compose the parts directly for anything bespoke.
 */
export const Select = RadixSelect.Root;
export const SelectGroup = RadixSelect.Group;
export const SelectValue = RadixSelect.Value;

const selectTriggerVariants = cva(
  'inline-flex w-full items-center justify-between gap-2 rounded-input border border-border-2 bg-surface text-sm text-text transition-colors focus-visible:border-accent-line focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-faint',
  {
    variants: {
      size: { md: 'h-10 px-3', sm: 'h-9 px-2.5', xs: 'h-8 px-2' },
    },
    defaultVariants: { size: 'md' },
  },
);

export const SelectTrigger = forwardRef<
  ElementRef<typeof RadixSelect.Trigger>,
  ComponentPropsWithoutRef<typeof RadixSelect.Trigger> &
    VariantProps<typeof selectTriggerVariants>
>(({ className, size, children, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={cn(selectTriggerVariants({ size }), className)}
    {...props}
  >
    {children}
    <RadixSelect.Icon asChild>
      {/* Vertical glyph → no RTL flip needed (U7). */}
      <ChevronsUpDown className="size-4 shrink-0 text-dim" aria-hidden="true" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = forwardRef<
  ElementRef<typeof RadixSelect.Content>,
  ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      position={position}
      className={cn(
        'z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border-2 bg-surface p-1 shadow-portal',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
        className,
      )}
      {...props}
    >
      <RadixSelect.Viewport className="max-h-[inherit] overflow-y-auto">
        {children}
      </RadixSelect.Viewport>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = forwardRef<
  ElementRef<typeof RadixSelect.Item>,
  ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-nav px-2 py-1.5 text-sm text-text outline-none',
      'data-[highlighted]:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="grid size-4 shrink-0 place-items-center">
      <RadixSelect.ItemIndicator>
        <Check className="size-4 text-accent" aria-hidden="true" />
      </RadixSelect.ItemIndicator>
    </span>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = 'SelectItem';

export interface SelectFieldOption {
  value: string;
  label: ReactNode;
}

export interface SelectFieldProps {
  options: readonly SelectFieldOption[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
  size?: VariantProps<typeof selectTriggerVariants>['size'];
}

/**
 * The fixed-enum convenience: a controlled Select assembled from the parts above. Works behind
 * an RHF `Controller` or any `value`/`onValueChange` caller (filters, pagination, media type).
 * Model "no selection" as `value={undefined}` + a `placeholder` (Radix forbids an empty-string
 * `SelectItem`); a caller that needs a re-selectable "All" passes it as a real sentinel option.
 */
export function SelectField({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
  id,
  className,
  size,
  'aria-label': ariaLabel,
}: SelectFieldProps) {
  return (
    <Select
      value={value ?? ''}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-label={ariaLabel}
        className={className}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
