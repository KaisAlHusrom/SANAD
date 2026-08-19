import { HttpStatus } from '@nestjs/common';
import type { SettingType, SettingValue } from '@sanad/contracts';
import { rpcError, type MessageKey } from '@sanad/i18n';
import { isLocalizedText } from './resolved-value.js';

/** The inclusive range a `number` descriptor accepts. */
export interface SettingNumberBounds {
  min: number;
  max: number;
}

/**
 * Validate a value against its setting descriptor `type` before persisting (N7). Throws a keyed
 * 400 the gateway maps + localizes (N9, U24) on a type mismatch. Nullable leaves accept `null`, which clears the value back to the coded default
 * (U9) — that includes `localized_text` (e.g. `contact.address` is `LocalizedText | null`,
 * "set or explicitly unset"), so emptying the field in the admin UI CLEARS it instead of
 * failing. The writer drops the per-locale translation rows when it sees a null.
 */
export function assertValidSettingValue(
  key: string,
  type: SettingType,
  value: SettingValue,
  bounds?: SettingNumberBounds,
): void {
  const reject = (expected: MessageKey): never => {
    throw rpcError(HttpStatus.BAD_REQUEST, expected, { key });
  };
  switch (type) {
    case 'localized_text':
      if (value !== null && !isLocalizedText(value)) {
        reject('settings.value.expected.localizedText');
      }
      return;
    case 'boolean':
      if (typeof value !== 'boolean') {
        reject('settings.value.expected.boolean');
      }
      return;
    case 'number':
      if (typeof value !== 'number') {
        reject('settings.value.expected.number');
      }
      // A descriptor that declares bounds enforces them HERE, not only wherever the value is
      // consumed. A consumer that silently clamps is a necessary backstop, but on its own it
      // means the admin is told "saved" for a value that never applies (U0).
      if (
        bounds !== undefined &&
        (!Number.isInteger(value) ||
          (value as number) < bounds.min ||
          (value as number) > bounds.max)
      ) {
        throw rpcError(HttpStatus.BAD_REQUEST, 'settings.value.outOfRange', {
          key,
          min: bounds.min,
          max: bounds.max,
        });
      }
      return;
    case 'text':
    case 'color':
    case 'url':
    case 'image':
    case 'select':
      if (value !== null && typeof value !== 'string') {
        reject('settings.value.expected.string');
      }
      return;
    default:
      return;
  }
}
