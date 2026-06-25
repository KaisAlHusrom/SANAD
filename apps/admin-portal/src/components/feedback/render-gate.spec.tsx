import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RenderGate } from './render-gate';

const props = {
  skeleton: <div>skeleton</div>,
  error: <div>error</div>,
  empty: <div>empty</div>,
};

describe('RenderGate (F2 order)', () => {
  it('shows the skeleton while loading', () => {
    render(
      <RenderGate isLoading {...props}>
        <div>data</div>
      </RenderGate>,
    );
    expect(screen.getByText('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('data')).not.toBeInTheDocument();
  });

  it('shows the error even when stale data is present (no empty flash)', () => {
    render(
      <RenderGate isLoading={false} isError isEmpty {...props}>
        <div>data</div>
      </RenderGate>,
    );
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
  });

  it('shows empty when there is no data', () => {
    render(
      <RenderGate isLoading={false} isEmpty {...props}>
        <div>data</div>
      </RenderGate>,
    );
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('renders the data last', () => {
    render(
      <RenderGate isLoading={false} {...props}>
        <div>data</div>
      </RenderGate>,
    );
    expect(screen.getByText('data')).toBeInTheDocument();
  });
});
