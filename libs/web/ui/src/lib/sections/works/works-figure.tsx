import { RecordEditFrame } from '../../editable/record-edit-frame.js';
import type { RenderMode } from '../../mode/render-mode.js';
import type { WorkCardData } from './derive-work-cards.js';
import { WorkCard } from './work-card.js';
import type { WorkCardLabels, WorkCardLink } from './work-card.types.js';

/**
 * The static works figure — a clean grid of the shared `WorkCard`s. This is the faithful-static
 * representation the admin Content Studio (and any live render without the injected `Orbit`, plus
 * `prefers-reduced-motion`) shows: the same cards the animated orbit rotates, laid out readably
 * without motion (WEB4). Each card carries `data-orbit-card` so the website's `Orbit` wrapper — which
 * renders the SAME `WorkCard`s — can drive them by selector; here they sit inert in the grid.
 */
export function WorksFigure({
  cards,
  labels,
  CardLink,
  mode,
}: {
  cards: WorkCardData[];
  labels: WorkCardLabels;
  CardLink?: WorkCardLink;
  /** In the studio (`edit`) each card is wrapped so its cover deep-links to the project's editor. */
  mode?: RenderMode;
}) {
  return (
    <div className="web-orbit web-orbit--static">
      {cards.map((card) =>
        mode === 'edit' ? (
          <RecordEditFrame key={card.id} collection="portfolio" id={card.id}>
            <WorkCard card={card} labels={labels} CardLink={CardLink} />
          </RecordEditFrame>
        ) : (
          <WorkCard
            key={card.id}
            card={card}
            labels={labels}
            CardLink={CardLink}
          />
        ),
      )}
    </div>
  );
}
