import { cn } from '../../lib/cn';
import { Input } from './input';
import { useColorInput } from './use-color-input';

interface ColorInputProps {
  value: string;
  onChange: (hex: string) => void;
  id?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * A shared swatch + hex-text color field (F9 — generic, no branding knowledge). Logic is
 * in `useColorInput` (U5). The swatch shows the literal color value — runtime data, not a
 * theme token, so this single inline color is the U6 carve-out.
 */
export function ColorInput({
  value,
  onChange,
  id,
  disabled,
  'aria-label': ariaLabel,
}: ColorInputProps) {
  const { swatchValue, isValid, onSwatchChange, onTextChange } = useColorInput({
    value,
    onChange,
  });

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label={ariaLabel ? `${ariaLabel} swatch` : 'color swatch'}
        value={swatchValue}
        onChange={onSwatchChange}
        disabled={disabled}
        className="size-9 shrink-0 cursor-pointer rounded-input border border-border-2 bg-surface p-0.5"
      />
      <Input
        id={id}
        aria-label={ariaLabel}
        aria-invalid={!isValid}
        value={value}
        onChange={onTextChange}
        disabled={disabled}
        spellCheck={false}
        className={cn('font-mono', !isValid && 'border-bad')}
      />
    </div>
  );
}
