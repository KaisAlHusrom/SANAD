import type { SectionNode } from '@sanad/contracts';
import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { StructureRail } from './structure-rail';

beforeAll(() => {
  void i18n.changeLanguage('en');
});

function hero(id: string, en: string, published = true): SectionNode {
  return {
    id,
    type: 'hero',
    sortOrder: id === 's1' ? 0 : 1,
    published,
    eyebrow: { ar: '', en: '' },
    title: { ar: en, en },
    subtitle: { ar: '', en: '' },
    blocks: [],
    config: null,
    collection: null,
  };
}

function renderRail(
  overrides: Partial<Parameters<typeof StructureRail>[0]> = {},
) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    pageId: 'p1',
    sections: [hero('s1', 'Hero'), hero('s2', 'Trust', false)],
    canManage: true,
    locale: 'en' as const,
    detailId: null as string | null,
    onSelectDetail: vi.fn(),
    addSection: vi.fn().mockResolvedValue('s3'),
    toggleVisibility: vi.fn(),
    deleteSection: vi.fn(),
    reorderSections: vi.fn().mockResolvedValue(undefined),
    reorderBlocks: vi.fn().mockResolvedValue(undefined),
    deleteBlock: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<StructureRail {...props} />);
  return props;
}

describe('StructureRail — outline (master)', () => {
  it('lists every section with its type', () => {
    renderRail();
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Trust')).toBeInTheDocument();
    expect(screen.getAllByText('hero')).toHaveLength(2);
  });

  it('drills into a section detail when its row is clicked', () => {
    const props = renderRail();
    fireEvent.click(screen.getByRole('button', { name: /Hero/ }));
    expect(props.onSelectDetail).toHaveBeenCalledWith('s1');
  });

  it('closes the rail from the outline header', () => {
    const props = renderRail();
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('toggles a section visibility (W6)', () => {
    const props = renderRail();
    // s2 is hidden → its row offers a "show" action
    fireEvent.click(screen.getByRole('button', { name: /show/i }));
    expect(props.toggleVisibility).toHaveBeenCalledOnce();
  });
});

describe('StructureRail — section detail', () => {
  it('shows the selected section detail with a back control + blocks', () => {
    const props = renderRail({ detailId: 's1' });
    // the blocks sub-panel renders (hero has 0 blocks)
    expect(screen.getByText('Blocks (0)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /All sections/i }));
    expect(props.onSelectDetail).toHaveBeenCalledWith(null);
  });

  it('deletes the section from its detail', () => {
    const props = renderRail({ detailId: 's1' });
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(props.deleteSection).toHaveBeenCalledOnce();
  });

  it('closes the rail from the detail header', () => {
    const props = renderRail({ detailId: 's1' });
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
});
