'use client';

import { useEffect, useRef } from 'react';
import { inkTrailStyle } from './ink-trail';
import { isTouchDevice, prefersReducedMotion } from './reduced-motion';

/**
 * The signature velocity-reactive cursor — a single luminous accent thread that trails the pointer
 * and thickens with speed, NOT a generic particle/dot field (WEB9). A fixed `z-55` canvas, pointer
 * events off. **Disabled** under reduced-motion ("calm mode", WEB4) and on touch devices. The
 * accent color is read from the live `--web-accent` token (U6) so it tracks the page accent.
 * 8.B-4 Stage 4c: over an interactive target (`a`/`button`/`[data-ink]`) the thread **tightens and
 * brightens** (`inkTrailStyle`) — our own acknowledgement, not a morphing/magnetic cursor (WEB9).
 */
export function InkCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || isTouchDevice()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--web-accent')
        .trim() || '#22d3ee';

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const points: Array<{ x: number; y: number }> = [];
    const MAX = 18;
    let pointer = { x: -100, y: -100 };
    let raf = 0;
    let hoverTarget = 0;
    let hover = 0;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
    };
    const onOver = (e: PointerEvent) => {
      hoverTarget =
        e.target instanceof Element && e.target.closest('a, button, [data-ink]')
          ? 1
          : 0;
    };

    const draw = () => {
      points.push({ ...pointer });
      if (points.length > MAX) points.shift();
      hover += (hoverTarget - hover) * 0.14; // smooth the tighten/release
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineCap = 'round';
      ctx.strokeStyle = accent;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        if (!a || !b) continue;
        const style = inkTrailStyle(i / points.length, hover);
        ctx.globalAlpha = style.alpha;
        ctx.lineWidth = style.width;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="ink-cursor" aria-hidden="true" />;
}
