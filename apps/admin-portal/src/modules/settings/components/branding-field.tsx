import * as Label from '@radix-ui/react-label';
import type { ReactNode } from 'react';

interface BrandingFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

/** A labelled form row (label + control + optional error). */
export function BrandingField({
  label,
  htmlFor,
  error,
  children,
}: BrandingFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label.Root htmlFor={htmlFor} className="text-sm text-dim">
        {label}
      </Label.Root>
      {children}
      {error ? <p className="text-sm text-bad">{error}</p> : null}
    </div>
  );
}
