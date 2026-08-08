/**
 * Build the hyperspace warp streaks as line-segment endpoints — `count` short vertical segments
 * scattered in a disc of `spread` around the flight axis. At render time the streak group follows
 * the camera, its Y-scale stretches the segments with `warp`, and its material opacity fades them in
 * (so a resting page shows none). Runtime scatter (U6 carve-out).
 */
export function makeWarpGeometry(count: number, spread: number): Float32Array {
  const positions = new Float32Array(count * 6); // 2 points × 3 coords per segment
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const rad = spread * Math.sqrt(Math.random());
    const x = Math.cos(theta) * rad;
    const z = Math.sin(theta) * rad;
    const yBase = (Math.random() * 2 - 1) * spread * 0.4;
    const half = 4; // base half-length; the group scales this up with warp
    const k = i * 6;
    positions[k] = x;
    positions[k + 1] = yBase - half;
    positions[k + 2] = z;
    positions[k + 3] = x;
    positions[k + 4] = yBase + half;
    positions[k + 5] = z;
  }
  return positions;
}
