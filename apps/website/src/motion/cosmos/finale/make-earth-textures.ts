import { CanvasTexture, RepeatWrapping, type Texture } from 'three';

/**
 * The procedural Earth textures for the impact finale (WEB10), ported from the reference
 * `makeEarthTextures`: a 512×256 **day** map (banded ocean + wobbly land blobs speckled with terrain
 * + polar ice caps) and a **cloud** map (soft radial puffs), plus a **night** map (warm city-light
 * clusters over black, used as an `emissiveMap` so the dark limb sparkles) — a small fidelity
 * upgrade over the reference. Built once on the client; returns transparent fallbacks during SSR so
 * nothing throws.
 */
export function makeEarthTextures(): {
  day: Texture;
  clouds: Texture;
  night: Texture;
} {
  if (typeof document === 'undefined') {
    return {
      day: new CanvasTexture(undefined as never),
      clouds: new CanvasTexture(undefined as never),
      night: new CanvasTexture(undefined as never),
    };
  }
  const w = 512;
  const h = 256;
  // land-blob centres (shared by the day map + the night city-light clusters)
  const blobs = [
    [0.16, 0.4, 0.13],
    [0.21, 0.6, 0.1],
    [0.3, 0.74, 0.06],
    [0.44, 0.34, 0.12],
    [0.5, 0.52, 0.085],
    [0.69, 0.44, 0.14],
    [0.8, 0.64, 0.08],
    [0.9, 0.4, 0.07],
    [0.62, 0.8, 0.05],
    [0.07, 0.5, 0.05],
  ];

  // ----- day map -----
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const x = canvas.getContext('2d');
  if (x) {
    const ocean = x.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#0a3a63');
    ocean.addColorStop(0.5, '#0f5288');
    ocean.addColorStop(1, '#0a3a63');
    x.fillStyle = ocean;
    x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.12;
    x.strokeStyle = '#1d6fa8';
    x.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      x.beginPath();
      const yy = Math.random() * h;
      x.moveTo(0, yy);
      for (let xx = 0; xx <= w; xx += 16)
        x.lineTo(xx, yy + Math.sin(xx * 0.05 + i) * 6);
      x.stroke();
    }
    x.globalAlpha = 1;
    const land = ['#2f7d3e', '#3f8f47', '#5c8c39', '#8a7a3e', '#6f5d34'];
    for (let bi = 0; bi < blobs.length; bi++) {
      const [bx, by, br] = blobs[bi] as [number, number, number];
      const cxp = bx * w;
      const cyp = by * h;
      const rr = br * w;
      x.beginPath();
      const steps = 30;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const wob =
          rr *
          (0.62 +
            0.46 * Math.sin(a * 3 + bx * 9) +
            0.22 * Math.sin(a * 7 + by * 7));
        const px = cxp + Math.cos(a) * wob;
        const py = cyp + Math.sin(a) * wob * 0.72;
        if (i === 0) x.moveTo(px, py);
        else x.lineTo(px, py);
      }
      x.closePath();
      x.fillStyle = land[bi % land.length] as string;
      x.fill();
      x.save();
      x.clip();
      for (let s = 0; s < 40; s++) {
        x.globalAlpha = 0.18 + Math.random() * 0.22;
        x.fillStyle = Math.random() < 0.5 ? '#234d22' : '#9c8a4e';
        const r = 3 + Math.random() * 12;
        x.beginPath();
        x.arc(
          cxp + (Math.random() - 0.5) * rr * 2,
          cyp + (Math.random() - 0.5) * rr * 1.4,
          r,
          0,
          7,
        );
        x.fill();
      }
      x.restore();
      x.globalAlpha = 1;
    }
    const capTop = x.createLinearGradient(0, 0, 0, h * 0.14);
    capTop.addColorStop(0, 'rgba(238,247,255,0.95)');
    capTop.addColorStop(1, 'rgba(238,247,255,0)');
    x.fillStyle = capTop;
    x.fillRect(0, 0, w, h * 0.14);
    const capBottom = x.createLinearGradient(0, h, 0, h * 0.86);
    capBottom.addColorStop(0, 'rgba(238,247,255,0.95)');
    capBottom.addColorStop(1, 'rgba(238,247,255,0)');
    x.fillStyle = capBottom;
    x.fillRect(0, h * 0.86, w, h * 0.14);
  }
  const day = new CanvasTexture(canvas);
  day.wrapS = RepeatWrapping;

  // ----- cloud map -----
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = w;
  cloudCanvas.height = h;
  const xc = cloudCanvas.getContext('2d');
  if (xc) {
    for (let i = 0; i < 70; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const r = 7 + Math.random() * 40;
      const g = xc.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(
        0,
        `rgba(255,255,255,${(0.22 + Math.random() * 0.4).toFixed(2)})`,
      );
      g.addColorStop(1, 'rgba(255,255,255,0)');
      xc.fillStyle = g;
      xc.beginPath();
      xc.arc(px, py, r, 0, 7);
      xc.fill();
    }
  }
  const clouds = new CanvasTexture(cloudCanvas);
  clouds.wrapS = RepeatWrapping;

  // ----- night map (emissive) — black with warm city-light clusters over the land blobs -----
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = w;
  nightCanvas.height = h;
  const xn = nightCanvas.getContext('2d');
  if (xn) {
    xn.fillStyle = '#000000';
    xn.fillRect(0, 0, w, h);
    for (let bi = 0; bi < blobs.length; bi++) {
      const [bx, by, br] = blobs[bi] as [number, number, number];
      const cxp = bx * w;
      const cyp = by * h;
      const rr = br * w;
      const lights = 26 + Math.floor(Math.random() * 26);
      for (let s = 0; s < lights; s++) {
        const px = cxp + (Math.random() - 0.5) * rr * 1.9;
        const py = cyp + (Math.random() - 0.5) * rr * 1.3;
        const r = 0.6 + Math.random() * 1.8;
        const g = xn.createRadialGradient(px, py, 0, px, py, r * 3);
        g.addColorStop(
          0,
          `rgba(255,214,160,${(0.5 + Math.random() * 0.5).toFixed(2)})`,
        );
        g.addColorStop(1, 'rgba(255,214,160,0)');
        xn.fillStyle = g;
        xn.beginPath();
        xn.arc(px, py, r * 3, 0, 7);
        xn.fill();
      }
    }
  }
  const night = new CanvasTexture(nightCanvas);
  night.wrapS = RepeatWrapping;

  return { day, clouds, night };
}
