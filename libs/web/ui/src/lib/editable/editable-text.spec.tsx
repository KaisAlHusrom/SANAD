import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EditProvider, type EditContextValue } from './edit-context.js';
import { EditableText } from './editable-text.js';
import { fieldPathKey, type EditableFieldPath } from './field-path.js';

const path: EditableFieldPath = {
  kind: 'section',
  sectionId: 's1',
  field: 'title',
};

function withProvider(
  ui: ReactNode,
  overrides: Partial<EditContextValue> = {},
  dir: 'rtl' | 'ltr' = 'ltr',
) {
  const value: EditContextValue = {
    locale: dir === 'rtl' ? 'ar' : 'en',
    onCommit: vi.fn(),
    ...overrides,
  };
  return {
    value,
    ...render(
      <div dir={dir}>
        <EditProvider value={value}>{ui}</EditProvider>
      </div>,
    ),
  };
}

describe('EditableText', () => {
  it('renders plain content with NO editing chrome when there is no EditProvider (live/preview)', () => {
    const { container } = render(
      <EditableText
        as="h2"
        value="Sanad Tech"
        path={path}
        className="web-heading"
      />,
    );
    const heading = container.querySelector('h2');
    expect(heading).toHaveClass('web-heading');
    expect(heading).not.toHaveClass('web-editable');
    expect(heading?.textContent).toBe('Sanad Tech');
    // no pencil, no contentEditable
    expect(container.querySelector('.web-edit-pencil')).toBeNull();
    expect(container.querySelector('[contenteditable="true"]')).toBeNull();
  });

  it('shows the pencil affordance and commits the edited value to the active locale', () => {
    const onCommit = vi.fn();
    withProvider(
      <EditableText
        as="h2"
        value="Sanad"
        path={path}
        className="web-heading"
      />,
      { onCommit, locale: 'en' },
    );

    // pencil is present (revealed on hover via CSS) and starts editing
    const pencil = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(pencil);

    const content = document.querySelector(
      '.web-editable-content',
    ) as HTMLElement;
    expect(content.getAttribute('contenteditable')).toBe('true');

    // user edits the text node, then commits with Enter (single-line)
    content.textContent = 'Sanad Tech';
    fireEvent.keyDown(content, { key: 'Enter' });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(path, 'Sanad Tech', 'en');
  });

  it('does NOT commit when the value is unchanged, and cancels on Escape', () => {
    const onCommit = vi.fn();
    withProvider(<EditableText value="Keep" path={path} />, { onCommit });

    const content = document.querySelector(
      '.web-editable-content',
    ) as HTMLElement;
    fireEvent.doubleClick(content.parentElement as HTMLElement);
    // blur without changing → no commit
    fireEvent.blur(content);
    expect(onCommit).not.toHaveBeenCalled();

    // edit then Escape → reverts, no commit
    fireEvent.doubleClick(content.parentElement as HTMLElement);
    content.textContent = 'Changed';
    fireEvent.keyDown(content, { key: 'Escape' });
    expect(onCommit).not.toHaveBeenCalled();
    expect(content.textContent).toBe('Keep');
  });

  it('uses the injected (localized) aria-label and works under dir=rtl (logical corner)', () => {
    withProvider(
      <EditableText value="مرحبا" path={path} />,
      { editLabel: 'تعديل', locale: 'ar' },
      'rtl',
    );
    // i18n-free lib: the label came from the injected context, not a hardcoded string
    expect(screen.getByRole('button', { name: 'تعديل' })).toBeInTheDocument();
    // the pencil uses the logical-inset class (inline-start corner flips for RTL via CSS)
    expect(document.querySelector('.web-edit-pencil')).toBeInTheDocument();
  });

  it('produces a stable, locale-agnostic key per field path', () => {
    expect(fieldPathKey(path)).toBe('section:s1:title');
    expect(
      fieldPathKey({
        kind: 'block-data',
        sectionId: 's',
        blockId: 'b',
        key: 'value',
      }),
    ).toBe('block-data:b:value');
  });
});
