import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { loc, section } from '../../test/fixtures.js';
import { SectionRenderer } from './section-renderer.js';
import { WebsiteShell } from './website-shell.js';

describe('SectionRenderer', () => {
  it('renders sections in sortOrder', () => {
    const { container } = render(
      <SectionRenderer
        locale="en"
        mode="live"
        sections={[
          section({ sortOrder: 2, title: loc('', 'second') }),
          section({ sortOrder: 1, title: loc('', 'first') }),
        ]}
      />,
    );
    // the default fixture is a `richtext` section → renders its title in `.web-richtext-title`
    const headings = [...container.querySelectorAll('.web-richtext-title')].map(
      (node) => node.textContent,
    );
    expect(headings).toEqual(['first', 'second']);
  });
});

describe('WebsiteShell', () => {
  it('applies the .sanad-web scope and the inline per-page accent var', () => {
    const { container } = render(
      <WebsiteShell locale="en" pageAccent="about">
        <span>child</span>
      </WebsiteShell>,
    );
    const root = container.querySelector('.sanad-web') as HTMLElement;
    expect(root).toBeInTheDocument();
    // about accent = #2dd4bf, ink = #06121c (from pageAccents)
    expect(root.style.getPropertyValue('--web-accent')).toBe('#2dd4bf');
    expect(root.style.getPropertyValue('--web-accent-ink')).toBe('#06121c');
  });

  it('sets dir from the locale (RTL for ar default, LTR for en) — U7', () => {
    const ar = render(
      <WebsiteShell locale="ar">
        <span>a</span>
      </WebsiteShell>,
    );
    expect(ar.container.querySelector('.sanad-web')).toHaveAttribute(
      'dir',
      'rtl',
    );

    const en = render(
      <WebsiteShell locale="en">
        <span>a</span>
      </WebsiteShell>,
    );
    expect(en.container.querySelector('.sanad-web')).toHaveAttribute(
      'dir',
      'ltr',
    );
  });

  it('emits only website (.web-*/.sanad-web) classes — never an admin/portal token class', () => {
    const { container } = render(
      <WebsiteShell locale="en">
        <SectionRenderer
          locale="en"
          mode="preview"
          sections={[
            section({
              title: loc('', 'S'),
            }),
          ]}
        />
      </WebsiteShell>,
    );
    const classes = new Set<string>();
    container.querySelectorAll('[class]').forEach((node) => {
      node.classList.forEach((cls) => classes.add(cls));
    });
    const adminTokens = [
      'bg-surface',
      'text-accent',
      'text-dim',
      'border-border',
      'bg-bg',
    ];
    for (const token of adminTokens) {
      expect(classes.has(token)).toBe(false);
    }
    // every emitted class is a website class
    for (const cls of classes) {
      expect(cls === 'sanad-web' || cls.startsWith('web-')).toBe(true);
    }
  });
});
