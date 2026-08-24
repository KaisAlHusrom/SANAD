import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Callout } from './callout';

describe('Callout', () => {
  it('renders its message and a leading icon', () => {
    render(
      <Callout tone="warn" icon={<span data-testid="icon" />}>
        Both are on
      </Callout>,
    );
    expect(screen.getByText('Both are on')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  /**
   * The regression this primitive exists to stop. `bg-warn/10` / `border-warn/30` compile to
   * NOTHING under Tailwind 3.4 when the color is a `var(--token)` — no error, no tint, no
   * border, just bare text. Two integrations panels shipped that way. Assert the tone paints
   * through the explicit `color-mix` canon and carries no opacity modifier.
   */
  it.each(['good', 'warn', 'bad', 'accent'] as const)(
    'paints the %s tone with an explicit color-mix, never an opacity modifier',
    (tone) => {
      const { container } = render(<Callout tone={tone}>text</Callout>);
      const className = container.firstElementChild?.className ?? '';
      expect(className).toContain(`color-mix(in_oklab,var(--${tone})`);
      expect(className).not.toMatch(new RegExp(`(bg|border)-${tone}/`));
    },
  );

  it('falls back to the surface chip for the neutral tone', () => {
    const { container } = render(<Callout>text</Callout>);
    expect(container.firstElementChild?.className).toContain('bg-surface-2');
  });
});
