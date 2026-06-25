import { useCallback, type ChangeEvent } from 'react';
import { expandHex, isHexColor } from './hex-color';

/** A neutral swatch value when `value` is partial/invalid (the native picker needs 6 digits). */
const SWATCH_FALLBACK = '#000000';

interface UseColorInputArgs {
  value: string;
  onChange: (hex: string) => void;
}

interface UseColorInputResult {
  /** Always a valid 6-digit hex for the native swatch (falls back when `value` is partial). */
  swatchValue: string;
  /** Whether the current text value is a valid hex (drives the invalid affordance). */
  isValid: boolean;
  onSwatchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTextChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Logic for the dual swatch + hex-text color input (U5 — the component stays
 * presentational). Both inputs drive the single `onChange`; the swatch always shows a
 * normalized full hex while the text holds the raw user value so validation can flag it.
 */
export function useColorInput({
  value,
  onChange,
}: UseColorInputArgs): UseColorInputResult {
  const valid = isHexColor(value);
  const onSwatchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange],
  );
  const onTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange],
  );

  return {
    swatchValue: valid ? expandHex(value) : SWATCH_FALLBACK,
    isValid: valid,
    onSwatchChange,
    onTextChange,
  };
}
