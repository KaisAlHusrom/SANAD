import { cn } from '../../lib/cn';

/** A content-shaped shimmer block (F2 — loading is a skeleton, never a spinner). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-card bg-surface-2', className)}
      aria-hidden="true"
    />
  );
}

/** A stack of shimmer lines for text-shaped loading. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
  );
}
