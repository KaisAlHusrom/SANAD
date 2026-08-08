import { screen } from '@testing-library/react';
import type { SectionNode } from '@sanad/contracts';
import { beforeAll, describe, expect, it } from 'vitest';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { SectionConfigPanel } from './section-config-panel';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

function section(overrides: Partial<SectionNode> = {}): SectionNode {
  return {
    id: 's1',
    type: 'services',
    sortOrder: 0,
    published: true,
    eyebrow: { ar: '', en: '' },
    title: { ar: '', en: '' },
    subtitle: { ar: '', en: '' },
    blocks: [],
    config: null,
    collection: null,
    ...overrides,
  };
}

describe('SectionConfigPanel', () => {
  it('renders the collection panel + a "Manage services →" deep-link for a services section', () => {
    renderWithProviders(<SectionConfigPanel pageId="p1" section={section()} />);
    expect(screen.getByText('Linked collection')).toBeInTheDocument();
    const manage = screen.getByRole('link', { name: /Manage services/ });
    expect(manage).toHaveAttribute('href', '/content/services');
  });

  it('renders nothing for a non-collection section type (hero)', () => {
    const { store } = renderWithProviders(
      <SectionConfigPanel pageId="p1" section={section({ type: 'hero' })} />,
    );
    expect(store).toBeDefined();
    expect(screen.queryByText('Linked collection')).toBeNull();
  });

  it('reveals the picked-records picker when the stored config mode is "picked"', () => {
    renderWithProviders(
      <SectionConfigPanel
        pageId="p1"
        section={section({ config: { mode: 'picked', ids: [] } })}
      />,
    );
    // the picked-records field label is shown; the limit field is hidden in picked mode
    expect(screen.getByText('Picked records')).toBeInTheDocument();
    expect(screen.queryByText('Limit')).toBeNull();
  });

  it('renders the panel + deep-link for a testimonials section (collection-backed)', () => {
    renderWithProviders(
      <SectionConfigPanel
        pageId="p1"
        section={section({ type: 'testimonials' })}
      />,
    );
    expect(screen.getByText('Linked collection')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Manage testimonials/ }),
    ).toHaveAttribute('href', '/content/testimonials');
  });

  it('renders the panel + deep-link for a blog section (collection-backed)', () => {
    renderWithProviders(
      <SectionConfigPanel pageId="p1" section={section({ type: 'blog' })} />,
    );
    expect(screen.getByText('Linked collection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage blog/ })).toHaveAttribute(
      'href',
      '/content/blog',
    );
  });

  it('renders the panel + "Manage FAQs →" deep-link for a faq section (Phase 5)', () => {
    renderWithProviders(
      <SectionConfigPanel pageId="p1" section={section({ type: 'faq' })} />,
    );
    expect(screen.getByText('Linked collection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage FAQs/ })).toHaveAttribute(
      'href',
      '/content/faqs',
    );
  });

  it('renders the panel + "Manage team →" deep-link for a team section (Phase 5)', () => {
    renderWithProviders(
      <SectionConfigPanel pageId="p1" section={section({ type: 'team' })} />,
    );
    expect(screen.getByText('Linked collection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage team/ })).toHaveAttribute(
      'href',
      '/content/team',
    );
  });
});
