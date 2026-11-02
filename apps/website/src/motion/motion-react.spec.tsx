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
import { scrollLock } from './scroll';
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

describe('MotionProvider — it must not eat input it does not own', () => {
  function wheel(): WheelEvent {
    const event = new WheelEvent('wheel', {
      deltaY: 120,
      cancelable: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
    return event;
  }

  function keyOn(target: Element, key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      cancelable: true,
      bubbles: true,
    });
    target.dispatchEvent(event);
    return event;
  }

  it('claims the wheel while unlocked, and hands it back while an overlay holds the lock', () => {
    setReducedMotion(false);
    render(
      <MotionProvider>
        <p>cosmos</p>
      </MotionProvider>,
    );

    expect(wheel().defaultPrevented).toBe(true);

    const release = scrollLock.acquire();
    // Handing the wheel back is what lets the dialog's own body scroll natively while
    // `overflow: hidden` freezes the page behind it.
    expect(wheel().defaultPrevented).toBe(false);

    release();
    expect(wheel().defaultPrevented).toBe(true);
  });

  // The pre-existing platform bug: Space is a page-scroll key for the capped scroller, so a
  // focused button was paging the document instead of activating.
  it('never swallows Space aimed at a button', () => {
    setReducedMotion(false);
    render(
      <MotionProvider>
        <button type="button">Accept all</button>
      </MotionProvider>,
    );

    const button = screen.getByRole('button', { name: 'Accept all' });
    expect(keyOn(button, ' ').defaultPrevented).toBe(false);
    expect(keyOn(document.body, ' ').defaultPrevented).toBe(true);
  });

  it('leaves keyboard scrolling alone while an overlay holds the lock', () => {
    setReducedMotion(false);
    render(
      <MotionProvider>
        <p>cosmos</p>
      </MotionProvider>,
    );

    const release = scrollLock.acquire();
    expect(keyOn(document.body, 'PageDown').defaultPrevented).toBe(false);
    expect(keyOn(document.body, 'Home').defaultPrevented).toBe(false);
    release();
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
