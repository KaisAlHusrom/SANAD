import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PageTree } from '@sanad/contracts';
import { SectionRenderer, WebsiteShell } from '@sanad/web-ui';

/**
 * The CMS-page vertical's rendering contract: the website wraps the shared `SectionRenderer`
 * (mode='live') in a `WebsiteShell` and it renders DB sections in the active locale with the
 * correct `dir`. This proves the 8.A acceptance page's integration (the async server
 * component's data/branch logic is covered by the data-layer specs).
 */
const page: Pick<PageTree, 'sections'> = {
  sections: [
    {
      id: 's1',
      type: 'richtext',
      sortOrder: 0,
      published: true,
      eyebrow: { ar: 'قانوني', en: 'Legal' },
      title: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
      subtitle: { ar: '', en: '' },
      blocks: [
        {
          id: 'b1',
          type: 'text',
          sortOrder: 0,
          data: {},
          imageMediaId: null,
          title: { ar: 'مقدمة', en: 'Intro' },
          body: { ar: 'نحترم خصوصيتك.', en: 'We respect your privacy.' },
        },
      ],
    },
  ],
};

function renderPage(locale: 'ar' | 'en') {
  return render(
    <WebsiteShell locale={locale}>
      <SectionRenderer sections={page.sections} locale={locale} mode="live" />
    </WebsiteShell>,
  );
}

describe('CMS page rendering (live)', () => {
  it('renders DB section + block content in Arabic, RTL', () => {
    const { container } = renderPage('ar');
    expect(screen.getByText('سياسة الخصوصية')).toBeInTheDocument();
    expect(screen.getByText('نحترم خصوصيتك.')).toBeInTheDocument();
    expect(container.querySelector('.sanad-web')).toHaveAttribute('dir', 'rtl');
  });

  it('renders the English locale, LTR', () => {
    const { container } = renderPage('en');
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('We respect your privacy.')).toBeInTheDocument();
    expect(container.querySelector('.sanad-web')).toHaveAttribute('dir', 'ltr');
  });
});
