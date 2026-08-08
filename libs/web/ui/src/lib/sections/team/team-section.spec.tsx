import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { loc, section, teamMemberItem } from '../../../test/fixtures.js';
import {
  EditProvider,
  type EditContextValue,
} from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { TeamSection } from './team-section.js';

const teamSection = () =>
  section({
    type: 'team',
    eyebrow: loc('', 'The team'),
    title: loc('', 'Minds pulling in one direction'),
    collection: {
      collection: 'team',
      items: [
        teamMemberItem({
          name: loc('', 'Layla Mansour'),
          role: loc('', 'CEO'),
          linkedinUrl: 'https://x/y',
        }),
        teamMemberItem({
          name: loc('', 'Khalid Otaibi'),
          role: loc('', 'CTO'),
        }),
      ],
    },
  });

describe('TeamSection', () => {
  it('renders the head + one card per hydrated member (live)', () => {
    const { container } = render(
      <TeamSection section={teamSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-team')).toBeInTheDocument();
    expect(container.querySelector('.web-team-title')?.textContent).toBe(
      'Minds pulling in one direction',
    );
    const names = [...container.querySelectorAll('.web-team-name')].map(
      (n) => n.textContent,
    );
    expect(names).toEqual(['Layla Mansour', 'Khalid Otaibi']);
    // a LinkedIn pill on the first card only
    expect(container.querySelectorAll('.web-team-pill')).toHaveLength(1);
  });

  it('shows the gradient-initial fallback when a member has no avatar (F3)', () => {
    const { container } = render(
      <TeamSection section={teamSection()} locale="en" mode="live" />,
    );
    // no avatarMediaId + no resolver → the initial disc, never a broken <img>
    expect(container.querySelector('.web-team-avatar-img')).toBeNull();
    const fallback = container.querySelector('.web-team-avatar-fallback');
    expect(fallback?.textContent).toBe('L');
  });

  it('bakes the avatar url server-side into a plain <img> when present (RSC-safe)', () => {
    const sec = section({
      type: 'team',
      collection: {
        collection: 'team',
        items: [
          teamMemberItem({ avatarMediaId: 'm-1', name: loc('', 'Rana') }),
        ],
      },
    });
    const { container } = render(
      <TeamSection
        section={sec}
        locale="en"
        mode="live"
        resolveImageUrl={(id) => `https://cdn/${id}.png`}
      />,
    );
    const img = container.querySelector(
      '.web-team-avatar-img',
    ) as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://cdn/m-1.png');
  });

  it('renders a RecordEditFrame per card in edit mode (deep-link to the member record)', () => {
    const ctx: EditContextValue = {
      locale: 'en',
      onCommit: vi.fn(),
      onEditRecord: vi.fn(),
    };
    const { container } = render(
      <EditProvider value={ctx}>
        <TeamSection section={teamSection()} locale="en" mode="edit" />
      </EditProvider>,
    );
    expect(container.querySelectorAll('.web-record-edit-btn')).toHaveLength(2);
  });

  it('empty collection → placeholder in preview, nothing in live', () => {
    const empty = section({ type: 'team' });
    const preview = render(
      <TeamSection section={empty} locale="en" mode="preview" />,
    );
    expect(
      preview.container.querySelector('.web-placeholder'),
    ).toBeInTheDocument();
    const live = render(
      <TeamSection section={empty} locale="en" mode="live" />,
    );
    expect(live.container.firstChild).toBeNull();
  });

  it('SectionBlock dispatches the team type to TeamSection (not the generic body)', () => {
    const { container } = render(
      <SectionBlock section={teamSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-team')).toBeInTheDocument();
    expect(container.querySelector('.web-heading')).toBeNull();
  });
});
