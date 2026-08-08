'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@sanad/contracts';

/**
 * Switches between `/ar` and `/en` while staying on the current page — swaps the locale
 * segment of the active pathname (F11: the in-app language choice is authoritative). The
 * label is the OTHER locale's endonym (U8), supplied by the dictionary.
 */
export function LocaleSwitch({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const pathname = usePathname() || `/${locale}`;
  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  const segments = pathname.split('/');
  segments[1] = other;
  const href = segments.join('/') || `/${other}`;

  return (
    <Link href={href} className="site-locale-switch" hrefLang={other}>
      {label}
    </Link>
  );
}
