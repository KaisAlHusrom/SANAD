import * as RadixTabs from '@radix-ui/react-tabs';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import { cn } from '../../lib/cn';

/** Tabs primitive on the token system (W2). RTL-correct — the list is a flex row that
 * follows the document direction; triggers are tokenized, no hardcoded colors (U6). */
export const Tabs = RadixTabs.Root;

export const TabsList = forwardRef<
  ElementRef<typeof RadixTabs.List>,
  ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 rounded-input border border-border-2 bg-surface p-1',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  ElementRef<typeof RadixTabs.Trigger>,
  ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      'inline-flex h-8 items-center justify-center rounded-nav px-3 text-sm font-medium text-dim transition-colors',
      'hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
      'data-[state=active]:bg-surface-2 data-[state=active]:text-text',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  ElementRef<typeof RadixTabs.Content>,
  ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
