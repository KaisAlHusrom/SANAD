import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EditProvider, type EditContextValue } from './edit-context.js';
import { EditableImage } from './editable-image.js';
import type { BlockImageFieldPath } from './field-path.js';

const path: BlockImageFieldPath = {
  kind: 'block-image',
  sectionId: 's1',
  blockId: 'b1',
};

function withProvider(
  ui: ReactNode,
  overrides: Partial<EditContextValue> = {},
) {
  const value: EditContextValue = {
    locale: 'en',
    onCommit: vi.fn(),
    onPickImage: vi.fn(),
    ...overrides,
  };
  return { value, ...render(<EditProvider value={value}>{ui}</EditProvider>) };
}

describe('EditableImage', () => {
  it('renders a plain img frame with NO edit chrome when there is no EditProvider (live/preview)', () => {
    const { container } = render(
      <EditableImage
        url="https://cdn/x.png"
        alt="hero"
        className="web-image-frame"
      />,
    );
    const img = container.querySelector('img.web-image-frame');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://cdn/x.png');
    expect(container.querySelector('.web-editable-image')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders the placeholder frame (no img) when there is no url and no provider', () => {
    const { container } = render(
      <EditableImage
        className="web-image-frame"
        placeholder={<i data-testid="ph" />}
      />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('ph')).toBeInTheDocument();
  });

  it('shows the change-image button in edit mode and fires onPickImage with the path (click + double-click)', () => {
    const onPickImage = vi.fn();
    withProvider(
      <EditableImage
        url="https://cdn/x.png"
        path={path}
        className="web-image-frame"
      />,
      { onPickImage, pickImageLabel: 'Change image' },
    );

    const button = screen.getByRole('button', { name: 'Change image' });
    fireEvent.click(button);
    expect(onPickImage).toHaveBeenCalledWith(path);

    // double-clicking the frame also opens the picker
    fireEvent.doubleClick(
      document.querySelector('.web-editable-image') as HTMLElement,
    );
    expect(onPickImage).toHaveBeenCalledTimes(2);
  });

  it('falls back to editLabel for the aria-label when no pickImageLabel is injected', () => {
    withProvider(<EditableImage path={path} className="web-image-frame" />, {
      onPickImage: vi.fn(),
      editLabel: 'تعديل',
    });
    expect(screen.getByRole('button', { name: 'تعديل' })).toBeInTheDocument();
  });

  it('renders the plain frame (no button) when onPickImage is absent even inside a provider', () => {
    const { container } = render(
      <EditProvider value={{ locale: 'en', onCommit: vi.fn() }}>
        <EditableImage
          url="https://cdn/x.png"
          path={path}
          className="web-image-frame"
        />
      </EditProvider>,
    );
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('img.web-image-frame')).not.toBeNull();
  });
});
