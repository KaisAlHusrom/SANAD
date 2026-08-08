import { pickLocalized } from '@sanad/contracts';
import { RecordEditFrame } from '../../editable/record-edit-frame.js';
import { isEditorMode } from '../../mode/render-mode.js';
import type { SectionComponentProps } from '../section-component.types.js';
import { SectionField } from '../section-field.js';
import { resolveSlots } from '../section-slots.js';
import { deriveTeamCards } from './derive-team.js';
import { TeamCard } from './team-card.js';
import { TEAM_SECTION_COPY } from './team-copy.js';

/**
 * The `team` roster section (the About page, WEB1) — the shared per-type component both the website
 * (`mode='live'`, with its `.lp-flow` `Reveal`) and the admin Content Studio (`mode='preview'|'edit'`)
 * render (preview===live). A head (eyebrow/title — section-owned copy, inline-editable in `edit`) over
 * the member grid, which comes from the section's HYDRATED `team` collection (curated in the Team
 * module via the admin config panel). Avatars are resolved server-side (`deriveTeamCards`) so cards
 * carry a plain `avatarUrl` — never a function crosses (RSC-safe). Cards stay pure server components;
 * in `edit` each is wrapped in `RecordEditFrame` (members live on their own table — deep-link to the
 * record editor). Empty renders nothing live, a placeholder in the editor. Tokens-only `.web-*`,
 * logical properties (RTL, U6/U7).
 */
export function TeamSection({
  section,
  locale,
  mode,
  slots,
  resolveImageUrl,
}: SectionComponentProps) {
  const { Reveal } = resolveSlots(slots);
  const cards = deriveTeamCards(section, locale, resolveImageUrl);

  if (cards.length === 0 && !isEditorMode(mode)) return null;

  return (
    <section className="web-team" data-section-type="team">
      <Reveal className="web-team-head">
        <SectionField
          as="p"
          className="web-team-eyebrow"
          value={pickLocalized(section.eyebrow, locale)}
          fallback={pickLocalized(TEAM_SECTION_COPY.eyebrow, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
        />
        <SectionField
          as="h2"
          className="web-team-title"
          value={pickLocalized(section.title, locale)}
          fallback={pickLocalized(TEAM_SECTION_COPY.title, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
      </Reveal>

      {cards.length > 0 ? (
        <div className="web-team-grid">
          {cards.map((card) => {
            const el = <TeamCard card={card} />;
            return (
              <Reveal key={card.id}>
                {mode === 'edit' ? (
                  <RecordEditFrame collection="team" id={card.id}>
                    {el}
                  </RecordEditFrame>
                ) : (
                  el
                )}
              </Reveal>
            );
          })}
        </div>
      ) : (
        <div className="web-placeholder" aria-hidden="true" />
      )}
    </section>
  );
}
