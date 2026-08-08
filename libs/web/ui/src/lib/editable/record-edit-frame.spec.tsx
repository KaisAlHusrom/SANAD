import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditProvider } from './edit-context.js';
import { RecordEditFrame } from './record-edit-frame.js';

describe('RecordEditFrame', () => {
  it('renders the card unchanged (no wrapper, no button) when onEditRecord is absent', () => {
    const { container } = render(
      <RecordEditFrame collection="portfolio" id="p1">
        <article data-testid="card">card</article>
      </RecordEditFrame>,
    );
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(container.querySelector('.web-record-edit')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });

  it('shows the edit-record button in the studio and fires onEditRecord with the collection + id', () => {
    const onEditRecord = vi.fn();
    render(
      <EditProvider
        value={{
          locale: 'en',
          onCommit: vi.fn(),
          onEditRecord,
          editRecordLabel: 'Edit record',
        }}
      >
        <RecordEditFrame collection="testimonials" id="t7">
          <blockquote>quote</blockquote>
        </RecordEditFrame>
      </EditProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit record' }));
    expect(onEditRecord).toHaveBeenCalledWith('testimonials', 't7');
  });

  it('falls back to editLabel for the aria-label when no editRecordLabel is injected', () => {
    render(
      <EditProvider
        value={{
          locale: 'ar',
          onCommit: vi.fn(),
          onEditRecord: vi.fn(),
          editLabel: 'تعديل',
        }}
      >
        <RecordEditFrame collection="blog" id="b3">
          <a href="/blog/x">row</a>
        </RecordEditFrame>
      </EditProvider>,
    );
    expect(screen.getByRole('button', { name: 'تعديل' })).toBeInTheDocument();
  });
});
