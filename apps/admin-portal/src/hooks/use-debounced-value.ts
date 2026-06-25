import { useEffect, useState } from 'react';

/**
 * Returns `value` delayed by `delayMs` — the latest value wins, intermediate ones are
 * dropped. App-shared (U17): the ServerSelect search box and the DataTable URL search
 * both debounce through this, so neither re-implements the timer.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
