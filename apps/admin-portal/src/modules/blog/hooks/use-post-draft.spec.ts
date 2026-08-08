import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePostDraft } from './use-post-draft';

interface Values {
  title: string;
}

const KEY = 'blog-draft:test';

function setup() {
  return renderHook(() => {
    const form = useForm<Values>({ defaultValues: { title: '' } });
    const draft = usePostDraft<Values>(KEY, form);
    return { form, draft };
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePostDraft', () => {
  it('debounce-autosaves the form values to localStorage while dirty', () => {
    const { result } = setup();
    expect(result.current.draft.draftAvailable).toBe(false);

    act(() => {
      result.current.form.setValue('title', 'Draft title', {
        shouldDirty: true,
      });
    });
    // before the debounce elapses, nothing is persisted
    expect(localStorage.getItem(KEY)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toMatchObject({
      title: 'Draft title',
    });
  });

  it('offers and restores a stored draft on mount', () => {
    localStorage.setItem(KEY, JSON.stringify({ title: 'Saved earlier' }));
    const { result } = setup();
    expect(result.current.draft.draftAvailable).toBe(true);

    act(() => {
      result.current.draft.restoreDraft();
    });
    expect(result.current.form.getValues('title')).toBe('Saved earlier');
    expect(result.current.draft.draftAvailable).toBe(false);
  });

  it('clearDraft and discardDraft remove the stored draft', () => {
    localStorage.setItem(KEY, JSON.stringify({ title: 'x' }));
    const { result } = setup();
    act(() => {
      result.current.draft.discardDraft();
    });
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(result.current.draft.draftAvailable).toBe(false);
  });
});
