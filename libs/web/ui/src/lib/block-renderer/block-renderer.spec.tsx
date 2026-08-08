import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { block, loc } from '../../test/fixtures.js';
import { EditProvider } from '../editable/edit-context.js';
import { BlockRenderer } from './block-renderer.js';

describe('BlockRenderer', () => {
  it('renders a stat value + suffix and the localized label', () => {
    const { container, getByText } = render(
      <BlockRenderer
        node={block('stat', {
          data: { value: 120, suffix: '+' },
          title: loc('مشروع', 'projects'),
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-stat-value')?.textContent).toBe(
      '120+',
    );
    expect(getByText('projects')).toBeInTheDocument();
  });

  it('renders a cta as an anchor with href + variant class', () => {
    const { getByRole } = render(
      <BlockRenderer
        node={block('cta', {
          data: { href: 'https://sanad.tech/contact', variant: 'secondary' },
          title: loc('تواصل', 'Contact'),
        })}
        locale="en"
        mode="live"
      />,
    );
    const link = getByRole('link', { name: 'Contact' });
    expect(link).toHaveAttribute('href', 'https://sanad.tech/contact');
    expect(link).toHaveClass('web-cta', 'web-cta--secondary');
  });

  it('locale-prefixes a root-relative cta href, passes external/prefixed through', () => {
    const hrefOf = (locale: 'ar' | 'en', href: string) =>
      render(
        <BlockRenderer
          node={block('cta', {
            data: { href, variant: 'primary' },
            title: loc('', 'Go'),
          })}
          locale={locale}
          mode="live"
        />,
      )
        .container.querySelector('a')
        ?.getAttribute('href');
    // root-relative internal → prefixed with the active locale
    expect(hrefOf('en', '/contact')).toBe('/en/contact');
    expect(hrefOf('ar', '/request-a-project')).toBe('/ar/request-a-project');
    // already-prefixed / external → unchanged
    expect(hrefOf('en', '/en/contact')).toBe('/en/contact');
    expect(hrefOf('en', 'mailto:x@y.z')).toBe('mailto:x@y.z');
  });

  it('resolves a feature icon and renders an svg, falling back on unknown keys', () => {
    const known = render(
      <BlockRenderer
        node={block('feature', {
          data: { icon: 'Rocket' },
          title: loc('سرعة', 'Speed'),
          body: loc('', 'Ship fast'),
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(known.container.querySelector('svg')).toBeInTheDocument();

    const unknown = render(
      <BlockRenderer
        node={block('feature', {
          data: { icon: 'NotARealIcon' },
          title: loc('', 'X'),
        })}
        locale="en"
        mode="live"
      />,
    );
    // unknown key still renders the fallback icon (no crash)
    expect(unknown.container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an image placeholder, and an <img> when a url resolver is injected', () => {
    const placeholder = render(
      <BlockRenderer
        node={block('image', {
          imageMediaId: 'asset-1',
          title: loc('', 'Cover'),
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(placeholder.container.querySelector('img')).toBeNull();

    const resolved = render(
      <BlockRenderer
        node={block('image', {
          imageMediaId: 'asset-1',
          title: loc('', 'Cover'),
        })}
        locale="en"
        mode="live"
        resolveImageUrl={(assetId: string) => `https://cdn.test/${assetId}.jpg`}
      />,
    );
    const img = resolved.container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://cdn.test/asset-1.jpg');
    expect(img).toHaveAttribute('alt', 'Cover');
  });

  it('makes an image block picker-editable in the studio (mode=edit) → fires onPickImage with the block-image path', () => {
    const onPickImage = vi.fn();
    const node = block('image', {
      imageMediaId: 'asset-1',
      title: loc('', 'Cover'),
    });
    const { getByRole } = render(
      <EditProvider
        value={{
          locale: 'en',
          onCommit: vi.fn(),
          onPickImage,
          pickImageLabel: 'Change image',
        }}
      >
        <BlockRenderer
          node={node}
          locale="en"
          mode="edit"
          sectionId="sec-1"
          resolveImageUrl={(id: string) => `https://cdn.test/${id}.jpg`}
        />
      </EditProvider>,
    );
    fireEvent.click(getByRole('button', { name: 'Change image' }));
    expect(onPickImage).toHaveBeenCalledWith({
      kind: 'block-image',
      sectionId: 'sec-1',
      blockId: node.id,
    });
  });

  it('keeps the image frame plain (no picker button) in live/preview', () => {
    const node = block('image', { imageMediaId: 'asset-1' });
    const live = render(
      <BlockRenderer
        node={node}
        locale="en"
        mode="live"
        sectionId="sec-1"
        resolveImageUrl={(id: string) => `https://cdn.test/${id}.jpg`}
      />,
    );
    expect(live.container.querySelector('button')).toBeNull();
    expect(live.container.querySelector('.web-editable-image')).toBeNull();
  });

  it('injects trusted richtext html', () => {
    const { container } = render(
      <BlockRenderer
        node={block('richtext', {
          body: loc('', '<h2>Heading</h2><a href="/x">link</a>'),
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(container.querySelector('.web-richtext-body h2')?.textContent).toBe(
      'Heading',
    );
    expect(container.querySelector('.web-richtext-body a')).toHaveAttribute(
      'href',
      '/x',
    );
  });

  it('renders a text block title + body', () => {
    const { getByText } = render(
      <BlockRenderer
        node={block('text', {
          title: loc('', 'Title'),
          body: loc('', 'Body copy'),
        })}
        locale="en"
        mode="live"
      />,
    );
    expect(getByText('Title')).toBeInTheDocument();
    expect(getByText('Body copy')).toBeInTheDocument();
  });

  it('picks the locale copy and falls back when a locale is blank (F7)', () => {
    const node = block('text', { title: loc('عنوان', '') });
    const ar = render(<BlockRenderer node={node} locale="ar" mode="live" />);
    expect(ar.getByText('عنوان')).toBeInTheDocument();
    ar.unmount();
    // en is blank → falls back to the ar value rather than rendering nothing
    const en = render(<BlockRenderer node={node} locale="en" mode="live" />);
    expect(en.getByText('عنوان')).toBeInTheDocument();
  });

  it('shows a placeholder for an empty block in preview, nothing in live', () => {
    const empty = block('text');
    const preview = render(
      <BlockRenderer node={empty} locale="en" mode="preview" />,
    );
    expect(
      preview.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();

    const live = render(<BlockRenderer node={empty} locale="en" mode="live" />);
    expect(live.container.firstChild).toBeNull();
  });
});
