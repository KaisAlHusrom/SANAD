import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MotionProvider } from '../../motion-provider';
import { useCosmosScrollStore } from '../../scroll';
import { UniverseMount } from './universe-mount';

/** Force `prefers-reduced-motion: reduce` so no Lenis/WebGL spins up in jsdom. */
function mockReducedMotion(reduce: boolean): void {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('prefers-reduced-motion') ? reduce : false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

afterEach(() => {
  vi.restoreAllMocks();
});

function StoreProbe() {
  const store = useCosmosScrollStore();
  return <span data-testid="probe">{store ? 'store' : 'none'}</span>;
}

describe('MotionProvider store wiring (WEB10)', () => {
  it('provides the cosmos scroll store to descendants', () => {
    mockReducedMotion(true);
    render(
      <MotionProvider>
        <StoreProbe />
      </MotionProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('store');
  });
});

describe('UniverseMount (P8.D — the persistent layout-level layer)', () => {
  it('renders the static fallback under reduced-motion (no canvas)', () => {
    mockReducedMotion(true);
    const { container } = render(<UniverseMount />);
    expect(container.querySelector('.cosmos-layer')).not.toBeNull();
    expect(container.querySelector('.cosmos-fallback')).not.toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('stays on the fallback without a store/director even when motion is allowed', () => {
    mockReducedMotion(false);
    const { container } = render(<UniverseMount />);
    expect(container.querySelector('.cosmos-fallback')).not.toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });
});
