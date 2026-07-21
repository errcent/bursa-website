"use client";

import { useEffect, useRef } from "react";

/**
 * Flowing "ribbon of light" hero wave.
 *
 * A single luminous thread arcs across the top of the hero, gently morphing and
 * flowing over time, with a bright core, soft additive bloom, and fading to
 * transparent at both horizontal ends. A fainter secondary strand trails below
 * it as a soft reflection.
 *
 * Rendered on a canvas so the line morphs smoothly (not tiled/repeating).
 */

type WaveLayer = {
  /** vertical position of the wave baseline, as a fraction of canvas height */
  baseY: number;
  /** amplitude in px (scaled by canvas height factor at draw time) */
  amplitude: number;
  /** peak brightness 0..1 of the core */
  intensity: number;
  /** core line width in px */
  lineWidth: number;
  /** animation speed multiplier */
  speed: number;
  /** phase offset so strands don't move in lockstep */
  phase: number;
};

/** Global animation speed multiplier (0.5 = half speed). */
const SPEED = 0.5;

const LAYERS: WaveLayer[] = [
  // main bright ribbon
  { baseY: 0.42, amplitude: 44, intensity: 1, lineWidth: 1.6, speed: 1, phase: 0 },
  // fainter lower reflection
  { baseY: 0.6, amplitude: 30, intensity: 0.34, lineWidth: 1.1, speed: 0.72, phase: 2.1 },
];

/** Sum of a few sines → one broad graceful crest that slowly morphs. */
function waveY(nx: number, t: number, layer: WaveLayer, h: number) {
  const a = layer.amplitude * (h / 460);
  const base = layer.baseY * h;
  const y =
    Math.sin(nx * Math.PI * 1.1 + t * 0.6 * layer.speed + layer.phase) * a +
    Math.sin(nx * Math.PI * 2.3 - t * 0.42 * layer.speed + layer.phase) * a * 0.32 +
    Math.sin(nx * Math.PI * 0.6 + t * 0.9 * layer.speed) * a * 0.22;
  return base + y;
}

export function HeroLightWave({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawLayer = (layer: WaveLayer, t: number) => {
      const step = 6;
      const points: Array<[number, number]> = [];
      for (let x = 0; x <= width; x += step) {
        points.push([x, waveY(x / width, t, layer, height)]);
      }

      // Horizontal fade: transparent at the edges, bright at the centre.
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "rgba(245, 246, 250, 0)");
      grad.addColorStop(0.18, "rgba(245, 246, 250, 0.5)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.82, "rgba(245, 246, 250, 0.5)");
      grad.addColorStop(1, "rgba(245, 246, 250, 0)");

      const tracePath = () => {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length - 1; i++) {
          const [x0, y0] = points[i];
          const [x1, y1] = points[i + 1];
          const mx = (x0 + x1) / 2;
          const my = (y0 + y1) / 2;
          ctx.quadraticCurveTo(x0, y0, mx, my);
        }
      };

      ctx.strokeStyle = grad;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Bloom passes: wide + faint underneath, narrowing + brighter on top.
      const passes = [
        { w: layer.lineWidth * 14, a: 0.05 },
        { w: layer.lineWidth * 8, a: 0.08 },
        { w: layer.lineWidth * 4, a: 0.14 },
        { w: layer.lineWidth * 2, a: 0.3 },
        { w: layer.lineWidth, a: 0.95 },
      ];

      for (const pass of passes) {
        ctx.globalAlpha = pass.a * layer.intensity;
        ctx.lineWidth = pass.w;
        tracePath();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const start = performance.now();

    const frame = (now: number) => {
      const t = reduceMotion ? 4 : ((now - start) / 1000) * SPEED;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (const layer of LAYERS) drawLayer(layer, t);
      ctx.globalCompositeOperation = "source-over";
      if (!reduceMotion) raf = requestAnimationFrame(frame);
    };

    resize();
    if (reduceMotion) {
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      resize();
      if (reduceMotion) frame(performance.now());
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
