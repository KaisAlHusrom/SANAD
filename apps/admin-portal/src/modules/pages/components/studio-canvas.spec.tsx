import type { PageTree, SectionNode } from '@sanad/contracts';
import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { i18n } from '../../../i18n';
import '../../../data/store/register-apis';
import { createAppStore } from '../../../data/store/store';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { StudioCanvas } from './studio-canvas';

beforeAll(() => {
  void i18n.changeLanguage('en');
});

function studioStore() {
  const store = createAppStore();
  store.dispatch(
    identityLoaded({
      userId: 'u',
      roles: ['admin'],
      permissions: ['content.manage', 'media.read'],
    }),
  );
  return store;
}

function hero(id: string, en: string): SectionNode {
  return {
    id,
    type: 'hero',
    sortOrder: id === 's1' ? 0 : 1,
    published: true,
    eyebrow: { ar: '', en: '' },
    title: { ar: en, en },
    subtitle: { ar: '', en: '' },
    blocks: [],
    config: null,
    collection: null,
  };
}

const tree: PageTree = {
  id: 'p1',
  slug: 'landing',
  status: 'published',
  sortOrder: 0,
  title: { ar: 'الرئيسية', en: 'Home' },
  metaTitle: { ar: '', en: '' },
  metaDescription: { ar: '', en: '' },
  sections: [hero('s1', 'Hero one'), hero('s2', 'Second')],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderCanvas(
  overrides: Partial<Parameters<typeof StudioCanvas>[0]> = {},
) {
  const onOpenStructure = vi.fn();
  const onFocusSection = vi.fn();
  renderWithProviders(
    <StudioCanvas
      tree={tree}
      canManage
      focusedSectionId={undefined}
      onFocusSection={onFocusSection}
      onOpenStructure={onOpenStructure}
      {...overrides}
    />,
    { store: studioStore() },
  );
  return { onOpenStructure, onFocusSection };
}

describe('StudioCanvas', () => {
  it('renders the WHOLE page — every section, not just one', () => {
    renderCanvas();
    expect(screen.getByText('Hero one')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('opens the structure rail from the toolbar', () => {
    const { onOpenStructure } = renderCanvas();
    fireEvent.click(screen.getByRole('button', { name: /structure/i }));
    expect(onOpenStructure).toHaveBeenCalledOnce();
  });

  it('focuses a section when its region is clicked (bidirectional select)', () => {
    const { onFocusSection } = renderCanvas();
    const region = document.querySelector('[data-section-id="s2"]');
    expect(region).not.toBeNull();
    fireEvent.click(region as Element);
    expect(onFocusSection).toHaveBeenCalledWith('s2');
  });

  it('makes copy inline-editable when the user can manage content', () => {
    renderCanvas({ canManage: true });
    expect(document.querySelector('.web-editable')).not.toBeNull();
  });

  it('renders plain (no edit affordances) for a read-only user', () => {
    renderCanvas({ canManage: false });
    expect(document.querySelector('.web-editable')).toBeNull();
    // still shows the page content
    expect(screen.getByText('Hero one')).toBeInTheDocument();
  });
});
