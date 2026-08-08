/**
 * A resolved `process` phase, derived from a `step` block + its joined `feature` deliverables (see
 * `deriveProcessSteps`). The shared `ProcessSection` computes these from the section node and passes
 * them to the injected live `System` component (the website's `ProcessMoons`), which reads ONLY this
 * view — no `SectionNode`/`@sanad/contracts` coupling — so the motion layer stays presentational.
 */
export interface ProcessStepView {
  id: string;
  /** the mono "NN / NN" position counter (e.g. `01 / 04`). */
  label: string;
  title: string;
  body: string;
  /** mono duration meta (e.g. "أسبوع ١–٢"), blank when the CMS carries none. */
  duration: string;
  /** "what you receive" deliverable bullets for this phase (sibling `feature` blocks). */
  deliverables: string[];
  /** the localized "what you receive" label (coded default). */
  giveLabel: string;
}
