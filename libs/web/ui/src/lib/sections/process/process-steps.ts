import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import { readBlockLocalized } from '../../block-renderer/block-data.js';
import type { ProcessStepView } from './process-step-view.types.js';

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

const pad = (value: number): string => String(value).padStart(2, '0');

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

/**
 * Derive the `process` phases from a section node (pure — the same reads the website's
 * `section-content` helpers did, ported into the lib so `@sanad/web-ui` stays self-contained). Each
 * `step` block becomes a `ProcessStepView`; its `feature` siblings (joined by `data.step ===
 * position`) become the deliverable bullets; the mono `duration` is a `LocalizedText` nested in the
 * `step`'s `data` bag (`readBlockLocalized`). The position-based `label` ("01 / 04") always matches
 * the active-moon index regardless of any `step` field drift in the seed.
 */
export function deriveProcessSteps(
  section: SectionNode,
  locale: Locale,
  giveLabel: string,
): ProcessStepView[] {
  const steps = [...section.blocks]
    .sort(bySortOrder)
    .filter((block) => block.type === 'step');
  const features = [...section.blocks]
    .sort(bySortOrder)
    .filter((block) => block.type === 'feature');
  const total = steps.length;

  return steps.map((block, index) => {
    const position = index + 1;
    const deliverables = features
      .filter((feature) => asString(feature.data['step']) === String(position))
      .map((feature) => pickLocalized(feature.title, locale))
      .filter((label) => label.trim().length > 0);
    return {
      id: block.id,
      label: `${pad(position)} / ${pad(total)}`,
      title: pickLocalized(block.title, locale),
      body: pickLocalized(block.body, locale),
      duration: pickLocalized(
        readBlockLocalized(block.data, 'duration'),
        locale,
      ),
      deliverables,
      giveLabel,
    };
  });
}
