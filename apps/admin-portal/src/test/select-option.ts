import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

type User = ReturnType<typeof userEvent.setup>;

/**
 * Open a styled `Select` (a Radix `combobox` trigger) by its accessible name, then click the
 * option with the given visible label. Replaces native `user.selectOptions`, which only drives
 * a native `<select>` — the styled Select renders its options in a portalled listbox that opens
 * on click. The single test canon for choosing a Select option (used by every migrated + future
 * spec).
 */
export async function selectOption(
  user: User,
  triggerName: string | RegExp,
  optionName: string | RegExp,
): Promise<void> {
  await user.click(screen.getByRole('combobox', { name: triggerName }));
  await user.click(await screen.findByRole('option', { name: optionName }));
}
