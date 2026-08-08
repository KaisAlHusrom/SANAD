import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './sheet';

describe('Sheet', () => {
  it('renders its content when open and caps + scrolls its body', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Structure</SheetTitle>
          </SheetHeader>
          <SheetBody>outline</SheetBody>
          <SheetFooter>
            <button type="button">Close</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByText('Structure')).toBeInTheDocument();
    expect(screen.getByText('outline')).toHaveClass(
      'flex-1',
      'overflow-y-auto',
    );
    expect(screen.getByText('Structure').parentElement).toHaveClass(
      'shrink-0',
      'border-b',
    );
    expect(
      screen.getByRole('button', { name: 'Close' }).parentElement,
    ).toHaveClass('shrink-0', 'border-t');
  });

  it('anchors to the inline-end edge by default (logical, RTL-safe)', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Panel</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    const content = screen.getByRole('dialog');
    expect(content).toHaveAttribute('data-side', 'inline-end');
    // border-s == border-inline-start (the panel's inner edge when docked to inline-end)
    expect(content).toHaveClass('border-s', 'sheet-panel');
  });

  it('anchors to the inline-start edge when asked', () => {
    render(
      <Sheet open>
        <SheetContent side="inline-start">
          <SheetTitle>Panel</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    const content = screen.getByRole('dialog');
    expect(content).toHaveAttribute('data-side', 'inline-start');
    expect(content).toHaveClass('border-e');
  });

  it('omits the dimming overlay when non-modal (canvas stays interactive)', () => {
    const { container } = render(
      <Sheet open modal={false}>
        <SheetContent>
          <SheetTitle>Panel</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(container.ownerDocument.querySelector('.sheet-overlay')).toBeNull();
  });

  it('renders the dimming overlay when modal', () => {
    const { container } = render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Panel</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(
      container.ownerDocument.querySelector('.sheet-overlay'),
    ).not.toBeNull();
  });
});
