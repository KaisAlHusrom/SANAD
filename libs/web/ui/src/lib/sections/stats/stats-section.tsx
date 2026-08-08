import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import { readStat } from '../../block-renderer/block-data.js';
import { EditableText } from '../../editable/editable-text.js';
import { isEditorMode, type RenderMode } from '../../mode/render-mode.js';
import { SectionField } from '../section-field.js';
import { resolveSlots, type SectionSlots } from '../section-slots.js';
import { STATS_COPY } from './stats-copy.js';

export interface StatsSectionProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  /** Website injects Reveal/Counter for `live`; the admin omits them (faithful-static). */
  slots?: SectionSlots;
}

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

/**
 * The `stats` telemetry band — the shared per-type component both the website (`mode='live'`, with
 * its `Reveal`/`CountUpNumber` slots) and the admin Content Studio (`mode='preview'|'edit'`) render.
 * A centered head over an instrument bank of counters from the section's `stat` blocks (each carries
 * `{ value, suffix }` data, a label `title`, an optional mono `body` note). Live counts up on view;
 * the editor shows static, inline-editable numbers. Empty renders nothing live, a placeholder in the
 * editor. Tokens-only `.web-*`, logical properties (RTL, U6/U7).
 */
export function StatsSection({
  section,
  locale,
  mode,
  slots,
}: StatsSectionProps) {
  const { Reveal, Counter } = resolveSlots(slots);
  const stats = [...section.blocks]
    .sort(bySortOrder)
    .filter((block) => block.type === 'stat');

  if (stats.length === 0 && !isEditorMode(mode)) return null;

  return (
    <section className="web-stats" data-section-type="stats">
      <Reveal className="web-stats-head">
        <SectionField
          as="p"
          className="web-stats-eyebrow"
          value={pickLocalized(section.eyebrow, locale)}
          fallback={pickLocalized(STATS_COPY.eyebrow, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
        />
        <SectionField
          as="h2"
          className="web-stats-title"
          value={pickLocalized(section.title, locale)}
          fallback={pickLocalized(STATS_COPY.title, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
      </Reveal>

      <div className="web-stats-row">
        {stats.map((block) => {
          const { value, suffix } = readStat(block.data);
          const numeric = Number(value) || 0;
          const note = pickLocalized(block.body, locale);
          return (
            <Reveal key={block.id} className="web-stat">
              <div className="web-stat-value">
                {mode === 'edit' ? (
                  <>
                    <EditableText
                      value={value}
                      placeholder="0"
                      path={{
                        kind: 'block-data',
                        sectionId: section.id,
                        blockId: block.id,
                        key: 'value',
                      }}
                    />
                    <EditableText
                      className="web-stat-suffix"
                      value={suffix}
                      placeholder="+"
                      path={{
                        kind: 'block-data',
                        sectionId: section.id,
                        blockId: block.id,
                        key: 'suffix',
                      }}
                    />
                  </>
                ) : (
                  <Counter value={numeric} suffix={suffix} />
                )}
              </div>
              <SectionField
                as="div"
                className="web-stat-label"
                value={pickLocalized(block.title, locale)}
                mode={mode}
                path={{
                  kind: 'block',
                  sectionId: section.id,
                  blockId: block.id,
                  field: 'title',
                }}
              />
              {note || mode === 'edit' ? (
                <SectionField
                  as="div"
                  className="web-stat-note"
                  value={note}
                  mode={mode}
                  path={{
                    kind: 'block',
                    sectionId: section.id,
                    blockId: block.id,
                    field: 'body',
                  }}
                />
              ) : null}
            </Reveal>
          );
        })}
        {stats.length === 0 ? (
          <div className="web-placeholder" aria-hidden="true" />
        ) : null}
      </div>
    </section>
  );
}
