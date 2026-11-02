'use client';

interface ConsentCategorySwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Id of the category name; the switch borrows it as its accessible name. */
  labelId: string;
  /** Id of the category's explanation. */
  describedById: string;
  /** `necessary`: shown and on, but not the visitor's to refuse. */
  locked?: boolean;
  stateLabel: { on: string; off: string };
}

/**
 * The website's first toggle control.
 *
 * A `<button role="switch">` rather than a checkbox: U21b rules out a bare platform control where
 * the design wants a real one, and a native button gives Enter *and* Space activation for free —
 * which only started being true once `shouldDriveScroll` stopped the capped scroller from
 * swallowing Space.
 *
 * The locked case is `aria-disabled`, never `disabled`: the point of listing `necessary` is that a
 * visitor can SEE the category we are not offering them, and `disabled` would take it out of the
 * tab order entirely. The permanent "always required" text beside it is the U23 answer to a
 * control that does nothing — the outcome is explained before the click, not withheld after it.
 */
export function ConsentCategorySwitch({
  checked,
  onChange,
  labelId,
  describedById,
  locked = false,
  stateLabel,
}: ConsentCategorySwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={describedById}
      {...(locked ? { 'aria-disabled': true } : {})}
      className="consent-switch"
      onClick={locked ? undefined : () => onChange(!checked)}
    >
      <span className="consent-switch-track" aria-hidden="true">
        <span className="consent-switch-thumb" />
      </span>
      <span className="consent-switch-state">
        {checked ? stateLabel.on : stateLabel.off}
      </span>
    </button>
  );
}
