import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '../../data/toast';
import { i18n } from '../../i18n';
import { useReorder } from './use-reorder';

function wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useReorder', () => {
  it('fires the mutation with the ordered ids and toasts success', async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    const success = vi.spyOn(toast, 'success').mockReturnValue('id');
    const { result } = renderHook(() => useReorder(mutate), { wrapper });

    await result.current(['c', 'a', 'b']);

    expect(mutate).toHaveBeenCalledWith(['c', 'a', 'b']);
    expect(success).toHaveBeenCalledTimes(1);
  });

  it('toasts the failure and rethrows so the table can revert', async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('boom'));
    const error = vi.spyOn(toast, 'error').mockReturnValue('id');
    const { result } = renderHook(() => useReorder(mutate), { wrapper });

    await expect(result.current(['a'])).rejects.toThrow('boom');
    expect(error).toHaveBeenCalledTimes(1);
  });
});
