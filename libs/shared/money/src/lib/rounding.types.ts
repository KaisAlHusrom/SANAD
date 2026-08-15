/**
 * How a fractional minor unit becomes a whole one. Always passed explicitly at a call site that
 * can produce a fraction (a multiplication, a percentage) — an implicit rounding rule is the
 * thing nobody can reconstruct when a total is disputed.
 */
export type RoundingMode = 'half-up' | 'half-even' | 'up' | 'down';
