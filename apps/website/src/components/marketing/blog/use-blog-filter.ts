'use client';

import { useMemo, useState } from 'react';
import type { BlogPostItem } from '@sanad/contracts';

/** The pseudo-slug for the "show all" chip (never a real category slug). */
export const ALL_CATEGORY = '__all__';

/**
 * Client-side, no-reload filtering of the already server-fetched posts by category (U5) — the
 * list is small and fully in memory, so a smooth in-place filter beats a route reload (the public
 * post list only supports `categoryId`/`search` server-side anyway). The component stays
 * presentation-only; the derived `visible` list + the active state live here.
 */
export function useBlogFilter(posts: BlogPostItem[]) {
  const [active, setActive] = useState<string>(ALL_CATEGORY);
  const visible = useMemo(
    () =>
      active === ALL_CATEGORY
        ? posts
        : posts.filter((post) => post.category?.slug === active),
    [posts, active],
  );
  return { active, setActive, visible };
}
