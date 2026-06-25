import { useCallback } from 'react';
import { useDirection } from '../../providers/direction/use-direction';
import { formatDateTime } from './datetime';

/**
 * Returns a date+time formatter bound to the active locale (F8). Components call the
 * returned function; the locale-aware `Intl` lives in `formatDateTime`, never inline.
 */
export function useFormatDateTime(): (iso: string) => string {
  const { locale } = useDirection();
  return useCallback((iso: string) => formatDateTime(iso, locale), [locale]);
}
