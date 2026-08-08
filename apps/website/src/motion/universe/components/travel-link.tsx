'use client';

import Link from 'next/link';
import { useCallback, type ComponentProps, type MouseEvent } from 'react';
import { useTravel } from '../hooks/use-travel';

type TravelLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

/**
 * The site's internal link (P8.D) — a `next/link` whose click starts a comet flight to the
 * destination system instead of a hard content swap. Falls back to Link's own behavior for
 * modified clicks (new tab), non-primary buttons, external/hash hrefs, same-place clicks,
 * and when no universe provider is mounted — so it is always safe to use anywhere a plain
 * Link was. Server components render it as a client leaf.
 */
export function TravelLink({ href, onClick, ...rest }: TravelLinkProps) {
  const { travelTo } = useTravel();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      travelTo(event, href);
    },
    [onClick, travelTo, href],
  );

  return <Link {...rest} href={href} onClick={handleClick} />;
}
