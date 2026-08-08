import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// GSAP is mocked: we only assert WIRING (the capped stepper added to the ticker or not), never
// real scroll. The speed-capped scroller (WS4) replaced Lenis — the OS reduce-motion preference now
// gates the *capped* path (a native-scroll fallback runs instead).
const { tickerAdd } = vi.hoisted(() => ({ tickerAdd: vi.fn() }));
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    ticker: { add: tickerAdd, remove: vi.fn(), lagSmoothing: vi.fn() },
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { update: vi.fn() } }));

import { MotionProvider } from './motion-provider';
import { Reveal } from './reveal';
import { WordReveal } from './word-reveal';

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce') ? reduce : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  tickerAdd.mockClear();
});

describe('MotionProvider (WEB4 — capped scroll gated on reduced-motion)', () => {
  it('drives the capped scroll stepper off the GSAP ticker when motion is allowed', () => {
    setReducedMotion(false);
    render(
      <MotionProvider>
        <p>journey</p>
      </MotionProvider>,
    );
    expect(screen.getByText('journey')).toBeInTheDocument();
    expect(tickerAdd).toHaveBeenCalledTimes(1);
  });

  it('does NOT run the capped stepper under prefers-reduced-motion (native scroll instead)', () => {
    setReducedMotion(true);
    render(
      <MotionProvider>
        <p>calm</p>
      </MotionProvider>,
    );
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(tickerAdd).not.toHaveBeenCalled();
  });
});

describe('Reveal / WordReveal (content always present)', () => {
  it('Reveal renders its children (animation is presentational)', () => {
    setReducedMotion(false);
    render(
      <Reveal delayMs={80}>
        <span>visible content</span>
      </Reveal>,
    );
    expect(screen.getByText('visible content')).toBeInTheDocument();
  });

  it('WordReveal keeps the full heading readable via aria-label and splits words', () => {
    setReducedMotion(false);
    render(<WordReveal text={'نَسنِدُك من الفكرة<br>إلى الإطلاق'} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAttribute(
      'aria-label',
      'نَسنِدُك من الفكرة إلى الإطلاق',
    );
    // each word is its own span → letters are never split (WEB5)
    expect(heading.textContent).toContain('نَسنِدُك');
    expect(heading.textContent).toContain('الإطلاق');
  });
});
