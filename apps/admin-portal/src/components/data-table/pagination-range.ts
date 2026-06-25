export type PaginationItem = number | 'ellipsis';

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let page = start; page <= end; page += 1) {
    out.push(page);
  }
  return out;
}

/**
 * Build the page-button sequence with `'ellipsis'` gap markers (first + last always
 * present), keeping `siblings` pages either side of `current`. Pure + framework-agnostic
 * so it's unit-tested without a DOM (the MUI/usePagination algorithm).
 */
export function buildPaginationRange(
  current: number,
  totalPages: number,
  siblings = 1,
): PaginationItem[] {
  if (totalPages <= 0) {
    return [];
  }
  // first + last + current + 2·siblings + 2 ellipsis slots: below this, show them all.
  if (totalPages <= siblings * 2 + 5) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, totalPages);
  const showLeftDots = leftSibling > 3;
  const showRightDots = rightSibling < totalPages - 2;
  const edgeChunk = 3 + siblings * 2;

  if (!showLeftDots && showRightDots) {
    return [...range(1, edgeChunk), 'ellipsis', totalPages];
  }
  if (showLeftDots && !showRightDots) {
    return [1, 'ellipsis', ...range(totalPages - edgeChunk + 1, totalPages)];
  }
  return [
    1,
    'ellipsis',
    ...range(leftSibling, rightSibling),
    'ellipsis',
    totalPages,
  ];
}
