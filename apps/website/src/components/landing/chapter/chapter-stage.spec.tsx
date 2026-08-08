import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChapterStage } from './chapter-stage';
import { CHAPTER_HEIGHTS } from './chapter.constants';

describe('ChapterStage', () => {
  it('renders its children (server content passes straight through, WEB2)', () => {
    render(
      <ChapterStage id="trust" minHeightVh={200}>
        <p>chapter content</p>
      </ChapterStage>,
    );
    expect(screen.getByText('chapter content')).toBeInTheDocument();
  });

  it('wraps content in the sticky chapter structure', () => {
    const { container } = render(
      <ChapterStage id="services" minHeightVh={210}>
        <span>x</span>
      </ChapterStage>,
    );
    expect(container.querySelector('.lp-chapter')).not.toBeNull();
    expect(container.querySelector('.lp-stage')).not.toBeNull();
    expect(container.querySelector('.lp-stage-flow')).not.toBeNull();
  });
});

describe('CHAPTER_HEIGHTS', () => {
  it('defines a travel height for every wrapped section', () => {
    for (const key of [
      'trust',
      'services',
      'process',
      'works',
      'stats',
      'testimonials',
      'blog',
      'cta',
    ] as const) {
      expect(CHAPTER_HEIGHTS[key]).toBeGreaterThanOrEqual(100);
    }
  });
});
