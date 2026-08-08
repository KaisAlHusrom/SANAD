/**
 * A moon's inclined circular orbit around its planet (8.B-4 Stage 2b) — pure and clock-driven, so
 * transits (the moon crossing in front of / behind its world) fall out of plain depth. Positions are
 * in the planet group's local space; the scene parents each moon to its planet so dock/exit motion
 * and the presence swell carry it for free. Reduced motion parks the moon at its phase angle (a
 * clean static satellite, WEB4).
 */

export interface MoonDef {
  /** Orbit radius in the planet group's local units (comfortably outside the planet + its ring). */
  readonly orbitRadius: number;
  /** Angular speed (rad/s) — slow; a transit should take tens of seconds. */
  readonly speed: number;
  /** Starting angle (rad) so multiple moons never sync. */
  readonly phase: number;
  /** Tilt of the orbit plane out of the screen plane (rad). */
  readonly inclination: number;
  /** Moon radius (planet-local units). */
  readonly size: number;
}

export function moonOrbitPosition(
  def: MoonDef,
  elapsed: number,
  reducedMotion: boolean,
): { x: number; y: number; z: number } {
  const angle = def.phase + (reducedMotion ? 0 : elapsed * def.speed);
  const sin = Math.sin(angle);
  return {
    x: Math.cos(angle) * def.orbitRadius,
    y: sin * Math.sin(def.inclination) * def.orbitRadius,
    z: sin * Math.cos(def.inclination) * def.orbitRadius,
  };
}
