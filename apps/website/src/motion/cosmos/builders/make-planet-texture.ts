import { CanvasTexture, RepeatWrapping, type Texture } from 'three';
import type { ColorTriplet, PlanetType } from '../types';

/**
 * The procedural surface texture for a non-star planet — upgraded for 8.B-4 Stage 1 from the
 * reference's 256×128 to **1024×512** (the works planet docks at z −30 where the old map went soft)
 * with richer per-archetype detail, still painted once per planet from the three palette shades:
 *  - **gas**: turbulent wavy cloud bands (two shear frequencies + per-band phase), eddies spun off
 *    the band boundaries, darkened polar hoods, and a concentric signature storm.
 *  - **ice**: a pale base of soft floes, a fracture network of jagged cracks, and noisy polar caps.
 *  - **rocky**: a cratered base plus a few large rim-lit craters with radial ejecta rays and dark
 *    maria patches.
 * Built once per planet on the client (the scene is canvas-only, so `document` exists); returns a
 * transparent fallback during SSR so nothing throws. `Math.random` is fine here — surface noise
 * needs no determinism (the U6 runtime carve-out, same as the star field).
 */
export function makePlanetTexture(
  type: Exclude<PlanetType, 'star'>,
  palette: readonly [ColorTriplet, ColorTriplet, ColorTriplet],
): Texture {
  if (typeof document === 'undefined')
    return new CanvasTexture(undefined as never);
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const x = canvas.getContext('2d');
  if (!x) {
    const empty = new CanvasTexture(canvas);
    empty.wrapS = RepeatWrapping;
    return empty;
  }
  const c: [string, string, string] = [
    css(palette[0]),
    css(palette[1]),
    css(palette[2]),
  ];

  if (type === 'gas') paintGas(x, w, h, c);
  else if (type === 'ice') paintIce(x, w, h, c);
  else paintRocky(x, w, h, c);

  x.globalAlpha = 1;
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  return texture;
}

function paintGas(
  x: CanvasRenderingContext2D,
  w: number,
  h: number,
  c: [string, string, string],
): void {
  x.fillStyle = c[1];
  x.fillRect(0, 0, w, h);

  // turbulent cloud bands — two shear frequencies + a per-band phase so no two edges repeat
  let y = 0;
  while (y < h) {
    const bh = 12 + Math.random() * 52;
    const r = Math.random();
    const phase = Math.random() * Math.PI * 2;
    x.fillStyle = r < 0.34 ? c[0] : r < 0.68 ? c[1] : c[2];
    x.globalAlpha = 0.45 + Math.random() * 0.5;
    const edge = (i: number, base: number): number =>
      base +
      Math.sin(i * 0.018 + y * 0.15 + phase) * 6.5 +
      Math.sin(i * 0.006 - y * 0.08 + phase * 1.7) * 11;
    x.beginPath();
    x.moveTo(0, edge(0, y));
    for (let i = 0; i <= w; i += 16) x.lineTo(i, edge(i, y));
    for (let i = w; i >= 0; i -= 16) x.lineTo(i, edge(i, y + bh));
    x.closePath();
    x.fill();

    // eddies spun off this band boundary
    if (Math.random() < 0.6) {
      const ex = Math.random() * w;
      const er = 8 + Math.random() * 22;
      x.globalAlpha = 0.2 + Math.random() * 0.25;
      x.fillStyle = Math.random() < 0.5 ? c[0] : c[2];
      x.beginPath();
      x.ellipse(ex, y + bh * 0.5, er, er * 0.42, 0, 0, 7);
      x.fill();
    }
    y += bh;
  }

  // polar hoods — the bands dim and cool toward both poles
  for (const [gy0, gy1] of [
    [0, h * 0.14],
    [h, h * 0.86],
  ] as const) {
    const hood = x.createLinearGradient(0, gy0, 0, gy1);
    hood.addColorStop(0, 'rgba(0,0,0,0.42)');
    hood.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = 1;
    x.fillStyle = hood;
    x.fillRect(0, Math.min(gy0, gy1), w, Math.abs(gy1 - gy0));
  }

  // the signature storm — concentric rings with a trailing wake
  const sx = w * 0.68;
  const sy = h * 0.56;
  const rings: readonly (readonly [number, number, string, number])[] = [
    [92, 46, c[0], 0.5],
    [64, 32, c[2], 0.55],
    [40, 20, c[0], 0.6],
    [18, 9, c[2], 0.7],
  ];
  for (const [rw, rh, col, a] of rings) {
    x.globalAlpha = a;
    x.fillStyle = col;
    x.beginPath();
    x.ellipse(sx, sy, rw, rh, -0.16, 0, 7);
    x.fill();
  }
  for (let i = 0; i < 4; i++) {
    x.globalAlpha = 0.22;
    x.fillStyle = c[0];
    x.beginPath();
    x.ellipse(
      sx - 120 - i * 60,
      sy + 10 + i * 6,
      34 - i * 6,
      10 - i * 1.5,
      -0.1,
      0,
      7,
    );
    x.fill();
  }
}

function paintIce(
  x: CanvasRenderingContext2D,
  w: number,
  h: number,
  c: [string, string, string],
): void {
  x.fillStyle = c[2];
  x.fillRect(0, 0, w, h);

  // soft floes
  for (let i = 0; i < 900; i++) {
    x.globalAlpha = 0.05 + Math.random() * 0.22;
    x.fillStyle = Math.random() < 0.5 ? c[0] : c[1];
    const r = 8 + Math.random() * 44;
    x.beginPath();
    x.arc(Math.random() * w, Math.random() * h, r, 0, 7);
    x.fill();
  }

  // the fracture network
  x.globalAlpha = 0.45;
  x.strokeStyle = c[0];
  x.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    x.beginPath();
    let px = Math.random() * w;
    let py = Math.random() * h;
    x.moveTo(px, py);
    for (let k = 0; k < 9; k++) {
      px += (Math.random() - 0.5) * 150;
      py += (Math.random() - 0.5) * 70;
      x.lineTo(px, py);
    }
    x.stroke();
  }

  // noisy polar caps
  x.fillStyle = c[0];
  for (const top of [true, false]) {
    for (let i = 0; i <= w; i += 18) {
      const depth = h * 0.05 + Math.random() * h * 0.05;
      x.globalAlpha = 0.5 + Math.random() * 0.35;
      x.beginPath();
      x.ellipse(i, top ? 0 : h, 22, depth, 0, 0, 7);
      x.fill();
    }
  }
}

function paintRocky(
  x: CanvasRenderingContext2D,
  w: number,
  h: number,
  c: [string, string, string],
): void {
  x.fillStyle = c[1];
  x.fillRect(0, 0, w, h);

  // dark maria patches under the cratering
  for (let i = 0; i < 5; i++) {
    x.globalAlpha = 0.12;
    x.fillStyle = c[2];
    x.beginPath();
    x.ellipse(
      Math.random() * w,
      Math.random() * h,
      90 + Math.random() * 150,
      50 + Math.random() * 80,
      Math.random() * Math.PI,
      0,
      7,
    );
    x.fill();
  }

  // the general crater field
  for (let i = 0; i < 1400; i++) {
    x.globalAlpha = 0.06 + Math.random() * 0.24;
    const t = Math.random();
    x.fillStyle = t < 0.5 ? c[2] : c[0];
    const r = 4 + Math.random() * 30;
    x.beginPath();
    x.arc(Math.random() * w, Math.random() * h, r, 0, 7);
    x.fill();
  }

  // a few large rim-lit craters with radial ejecta rays
  for (let i = 0; i < 12; i++) {
    const cx = Math.random() * w;
    const cy = h * 0.15 + Math.random() * h * 0.7;
    const r = 18 + Math.random() * 34;
    x.globalAlpha = 0.3;
    x.fillStyle = c[2];
    x.beginPath();
    x.arc(cx, cy, r, 0, 7);
    x.fill();
    x.globalAlpha = 0.5;
    x.strokeStyle = c[0];
    x.lineWidth = 2.5;
    x.beginPath();
    x.arc(cx, cy, r, Math.PI * 0.9, Math.PI * 1.9);
    x.stroke();
    const rays = 5 + Math.floor(Math.random() * 5);
    for (let k = 0; k < rays; k++) {
      const a = Math.random() * Math.PI * 2;
      const len = r * (1.6 + Math.random() * 1.8);
      x.globalAlpha = 0.1 + Math.random() * 0.1;
      x.lineWidth = 1.5 + Math.random() * 2;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
      x.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      x.stroke();
    }
  }
}

/** Normalized RGB triplet → a `rgb()` CSS string for canvas fills. */
function css([r, g, b]: ColorTriplet): string {
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}
