import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// framer-motion's whileInView needs IntersectionObserver (absent in jsdom) — passthrough the
// motion tags so specs assert CONTENT + structure, not the reveal animation.
vi.mock('framer-motion', () => {
  const passthrough =
    (Tag: string) =>
    ({ children, ...props }: { children?: unknown }) => {
      const { initial, animate, whileInView, viewport, transition, ...rest } =
        props as Record<string, unknown>;
      void initial;
      void animate;
      void whileInView;
      void viewport;
      void transition;
      const React = require('react');
      return React.createElement(Tag, rest, children);
    };
  return {
    motion: {
      div: passthrough('div'),
      li: passthrough('li'),
      article: passthrough('article'),
    },
  };
});

import { ProcessIndex } from './process-index';

afterEach(cleanup);

describe('ProcessIndex (Phase-5 hybrid body)', () => {
  it('renders the coded method body chrome — the hero/CTA are CMS bands the route adds (U9)', () => {
    render(<ProcessIndex locale="ar" />);
    // the phases section head (body chrome) renders; the hero eyebrow/h1 now live in a CMS band
    expect(screen.getByText('المراحل الأربع')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('renders the 4 phases in order with reused METHOD_PHASES titles', () => {
    render(<ProcessIndex locale="ar" />);
    const items = screen.getAllByRole('listitem');
    const timelineItems = items.filter((li) =>
      li.querySelector('.mk-phase-title'),
    );
    expect(timelineItems).toHaveLength(4);
    expect(
      timelineItems[0]?.querySelector('.mk-phase-title')?.textContent,
    ).toBe('اكتشاف');
    expect(
      timelineItems[1]?.querySelector('.mk-phase-title')?.textContent,
    ).toBe('تصميم');
    expect(
      timelineItems[2]?.querySelector('.mk-phase-title')?.textContent,
    ).toBe('تطوير');
    expect(
      timelineItems[3]?.querySelector('.mk-phase-title')?.textContent,
    ).toBe('إطلاق');
  });

  it('renders each phase duration + deliverables', () => {
    render(<ProcessIndex locale="en" />);
    expect(screen.getByText('1–2 weeks')).toBeTruthy();
    expect(screen.getByText('A written scope')).toBeTruthy();
    expect(screen.getByText('A live system on the cloud')).toBeTruthy();
  });

  it('renders the weekly-meeting and post-launch-support sections', () => {
    render(<ProcessIndex locale="en" />);
    expect(
      screen.getByText('A standing meeting, never a delayed report'),
    ).toBeTruthy();
    expect(screen.getByText('Backing that stays past launch')).toBeTruthy();
  });

  it('is RTL-correct for Arabic (mono duration/labels isolated via lp-ltr)', () => {
    const { container } = render(<ProcessIndex locale="ar" />);
    const durations = container.querySelectorAll('.mk-process-duration');
    durations.forEach((el) =>
      expect(el.classList.contains('lp-ltr')).toBe(true),
    );
  });
});
