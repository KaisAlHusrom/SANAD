import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { getLastQuill, resetQuillInstances } from '../../test/mock-quill';
import { RichTextEditor } from './rich-text-editor';

// Replace Quill with the deterministic mock — jsdom can't host a real Quill (selection/range).
vi.mock('quill', async () => {
  const mod = await import('../../test/mock-quill');
  return { default: mod.MockQuill };
});

beforeEach(async () => {
  await i18n.changeLanguage('ar');
});

afterEach(() => {
  resetQuillInstances();
  vi.clearAllMocks();
});

describe('RichTextEditor', () => {
  it('mounts Quill, applies the initial HTML value, and bridges text-change to onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <RichTextEditor
        value="<p>hello</p>"
        onChange={onChange}
        aria-label="Body"
      />,
    );

    const quill = getLastQuill();
    expect(quill).toBeDefined();
    // The RHF value seeds the editor on mount.
    expect(quill?.root.innerHTML).toBe('<p>hello</p>');

    // A user edit propagates the editor HTML upward.
    quill?.emitTextChange('<p>world</p>');
    expect(onChange).toHaveBeenCalledWith('<p>world</p>');
  });

  it('defaults the editing direction to the active locale (ar → rtl)', () => {
    renderWithProviders(<RichTextEditor value="" onChange={vi.fn()} />);
    expect(getLastQuill()?.root.getAttribute('dir')).toBe('rtl');
  });

  it('honours an explicit direction override', () => {
    renderWithProviders(
      <RichTextEditor value="" onChange={vi.fn()} direction="ltr" />,
    );
    expect(getLastQuill()?.root.getAttribute('dir')).toBe('ltr');
  });
});
