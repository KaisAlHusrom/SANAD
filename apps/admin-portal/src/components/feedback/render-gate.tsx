import { Fragment, type ReactNode } from 'react';

interface RenderGateProps {
  isLoading: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  skeleton: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}

/**
 * Enforces the F2 render-gate order — `loading → error → empty → data` — so a list
 * never flashes empty during load and stale data never falls through. Every list/
 * detail composes this instead of hand-rolling the branches.
 */
export function RenderGate({
  isLoading,
  isError = false,
  isEmpty = false,
  skeleton,
  error = null,
  empty = null,
  children,
}: RenderGateProps) {
  if (isLoading) {
    return <Fragment>{skeleton}</Fragment>;
  }
  if (isError) {
    return <Fragment>{error}</Fragment>;
  }
  if (isEmpty) {
    return <Fragment>{empty}</Fragment>;
  }
  return <Fragment>{children}</Fragment>;
}
