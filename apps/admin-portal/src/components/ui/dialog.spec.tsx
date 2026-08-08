import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

describe('Dialog', () => {
  it('renders flat children (backward-compatible) and caps + scrolls height', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Set secret</DialogTitle>
          <p>body</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Set secret')).toBeInTheDocument();
    const content = screen.getByRole('dialog');
    expect(content.className).toContain('max-h-');
    expect(content).toHaveClass('overflow-y-auto');
  });

  it('applies the size width variant', () => {
    render(
      <Dialog open>
        <DialogContent size="lg">
          <DialogTitle>Edit</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole('dialog').className).toContain('48rem');
  });

  it('composes a scrollable body between a fixed header and footer', () => {
    render(
      <Dialog open>
        <DialogContent size="lg" className="gap-0 overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle>Edit</DialogTitle>
          </DialogHeader>
          <DialogBody>fields</DialogBody>
          <DialogFooter>
            <button type="button">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('fields')).toHaveClass('flex-1', 'overflow-y-auto');
    expect(screen.getByText('Edit').parentElement).toHaveClass(
      'shrink-0',
      'border-b',
    );
    expect(
      screen.getByRole('button', { name: 'Save' }).parentElement,
    ).toHaveClass('shrink-0', 'border-t');
  });
});
