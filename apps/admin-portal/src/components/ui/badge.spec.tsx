import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('defaults to the neutral tone', () => {
    render(<Badge>Idle</Badge>);
    expect(screen.getByText('Idle')).toHaveClass('text-faint', 'bg-surface-2');
  });

  it.each([
    ['good', 'text-good'],
    ['warn', 'text-warn'],
    ['bad', 'text-bad'],
    ['accent', 'text-accent'],
  ] as const)('applies the %s tone token', (tone, cls) => {
    render(<Badge tone={tone}>X</Badge>);
    expect(screen.getByText('X')).toHaveClass(cls);
  });

  it('renders an aria-hidden status dot when requested', () => {
    const { container } = render(
      <Badge tone="good" dot>
        Live
      </Badge>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('spreads extra attributes (title, aria-*) onto the root', () => {
    render(
      <Badge title="tip" aria-label="status">
        Y
      </Badge>,
    );
    const el = screen.getByText('Y');
    expect(el).toHaveAttribute('title', 'tip');
    expect(el).toHaveAttribute('aria-label', 'status');
  });
});
