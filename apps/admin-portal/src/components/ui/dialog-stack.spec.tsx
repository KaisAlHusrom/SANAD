import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogStackHeader,
  DialogTitle,
} from './dialog';
import {
  DialogStackProvider,
  DialogTitleProvider,
  useParentDialogTitle,
} from './dialog-stack';

/**
 * The owner's report: "the modal appears above another modal with the SAME WIDTH, and the view
 * confuses the user." These tests pin the three things that make a nested dialog read as a
 * layer — a higher z-index, a receded parent, and a breadcrumb naming what it opened from.
 */

/** A picker-ish child dialog that names its parent, exactly as `MediaLibraryModal` does. */
function ChildDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const parentTitle = useParentDialogTitle();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" data-testid="child">
        <DialogStackHeader
          parentTitle={parentTitle}
          title="Media library"
          backLabel="Back"
          onBack={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/** A form modal that publishes its title and can open the child from inside its body. */
function ParentWithChild() {
  const [childOpen, setChildOpen] = useState(false);
  return (
    <DialogStackProvider>
      <Dialog open>
        <DialogContent size="lg" data-testid="parent">
          <DialogTitle>New project</DialogTitle>
          <DialogTitleProvider title="New project">
            <button type="button" onClick={() => setChildOpen(true)}>
              Choose image
            </button>
            <ChildDialog open={childOpen} onOpenChange={setChildOpen} />
          </DialogTitleProvider>
        </DialogContent>
      </Dialog>
    </DialogStackProvider>
  );
}

function zIndexOf(element: HTMLElement): number {
  // The stacking wrapper is the content's parent (the flex-centering layer).
  const wrapper = element.parentElement as HTMLElement;
  return Number.parseInt(wrapper.style.zIndex || '0', 10);
}

describe('nested dialogs read as a STACK, not as two competing boxes', () => {
  it('a lone dialog is depth 0 and is not receded', () => {
    render(
      <DialogStackProvider>
        <Dialog open>
          <DialogContent data-testid="only">
            <DialogTitle>Only</DialogTitle>
          </DialogContent>
        </Dialog>
      </DialogStackProvider>,
    );
    const only = screen.getByTestId('only');
    expect(only).toHaveAttribute('data-dialog-depth', '0');
    expect(only).not.toHaveAttribute('data-behind');
  });

  it('the child paints ABOVE the parent (higher z-index, not just later in the DOM)', async () => {
    const user = userEvent.setup();
    render(<ParentWithChild />);

    await user.click(screen.getByRole('button', { name: 'Choose image' }));

    const parent = screen.getByTestId('parent');
    const child = await screen.findByTestId('child');
    expect(zIndexOf(child)).toBeGreaterThan(zIndexOf(parent));
    expect(child).toHaveAttribute('data-dialog-depth', '1');
  });

  it('the parent RECEDES and goes inert while the child is open', async () => {
    const user = userEvent.setup();
    render(<ParentWithChild />);

    const parent = screen.getByTestId('parent');
    expect(parent).not.toHaveAttribute('data-behind');

    await user.click(screen.getByRole('button', { name: 'Choose image' }));

    expect(parent).toHaveAttribute('data-behind');
    // clicks can't land on a layer that is visually underneath
    expect(parent.className).toContain('pointer-events-none');
  });

  it('the child is WIDER than the parent — the confusion the owner reported', async () => {
    const user = userEvent.setup();
    render(<ParentWithChild />);
    await user.click(screen.getByRole('button', { name: 'Choose image' }));

    const parent = screen.getByTestId('parent');
    const child = screen.getByTestId('child');
    // lg = 48rem, xl = 64rem — different widths, so the layers can't be mistaken for each other
    expect(parent.className).toContain('48rem');
    expect(child.className).toContain('64rem');
  });

  it('the child names the surface it opened from, and can go back to it', async () => {
    const user = userEvent.setup();
    render(<ParentWithChild />);
    await user.click(screen.getByRole('button', { name: 'Choose image' }));

    // the breadcrumb reads "New project ▸ Media library"
    expect(
      await screen.findByRole('button', { name: 'New project' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Media library')).toBeInTheDocument();

    // going back closes ONLY this layer; the parent form is still there, no longer receded
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByTestId('parent')).not.toHaveAttribute('data-behind');
  });

  it('a picker NOT inside a dialog shows no breadcrumb (nothing to go back to)', () => {
    render(
      <DialogStackProvider>
        <ChildDialog open onOpenChange={() => undefined} />
      </DialogStackProvider>,
    );
    expect(screen.getByText('Media library')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New project' }),
    ).not.toBeInTheDocument();
  });
});
