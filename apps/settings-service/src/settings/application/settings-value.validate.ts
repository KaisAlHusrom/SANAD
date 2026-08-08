import { HttpStatus } from '@nestjs/common';
import type { SettingType, SettingValue } from '@sanad/contracts';
import { rpcError, type MessageKey } from '@sanad/i18n';
import { isLocalizedText } from './resolved-value.js';

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
