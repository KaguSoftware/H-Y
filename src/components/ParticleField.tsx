"use client";

import { useEffect, useRef } from "react";

/**
 * Hero-only cool-air field. Each particle flows on its own (a gentle wander
 * current keeps it in motion) and springs toward a target. Normally the target
 * is its home; when the pointer is present every particle retargets to it and
 * packs in tightly, then springs back home when the pointer leaves. Drawn
 * additively so density forms the blue glow.
 */
export default function ParticleField() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let mx = 0.5;
    let my = 0.5;
    let hasMouse = false;

    // crisp particle dot sprite
    const S = 32;
    const sprite = document.createElement("canvas");
    sprite.width = S;
    sprite.height = S;
    const sctx = sprite.getContext("2d")!;
    const g = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(236,250,255,1)");
    g.addColorStop(0.28, "rgba(165,227,255,0.62)");
    g.addColorStop(0.6, "rgba(110,205,255,0.22)");
    g.addColorStop(1, "rgba(95,212,255,0)");
    sctx.fillStyle = g;
    sctx.beginPath();
    sctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    sctx.fill();

    // large soft glow sprite (ambient blue field)
    const GS = 256;
    const glow = document.createElement("canvas");
    glow.width = GS;
    glow.height = GS;
    const gctx = glow.getContext("2d")!;
    const g2 = gctx.createRadialGradient(GS / 2, GS / 2, 0, GS / 2, GS / 2, GS / 2);
    g2.addColorStop(0, "rgba(74,182,255,0.55)");
    g2.addColorStop(0.5, "rgba(28,138,208,0.2)");
    g2.addColorStop(1, "rgba(18,131,196,0)");
    gctx.fillStyle = g2;
    gctx.beginPath();
    gctx.arc(GS / 2, GS / 2, GS / 2, 0, Math.PI * 2);
    gctx.fill();

    // fixed cluster anchors (the ambient field)
    const anchors = [
      { x: 0.27, y: 0.42 },
      { x: 0.72, y: 0.52 },
      { x: 0.5, y: 0.74 },
    ];

    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      ci: number;
      ox: number;
      oy: number;
      size: number;
      baseA: number;
      twP: number;
      twS: number;
      ph: number;
      lag: number;
    };
    let parts: P[] = [];

    const build = () => {
      const target = Math.min(2400, Math.max(400, Math.floor((w * h) / 700)));
      parts = new Array(target);
      for (let i = 0; i < target; i++) {
        const ci = i % anchors.length;
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.pow(Math.random(), 1.7) * 0.32; // dense centre, sparse edge
        const ox = Math.cos(ang) * rad;
        const oy = Math.sin(ang) * rad;
        parts[i] = {
          x: anchors[ci].x + ox,
          y: anchors[ci].y + oy,
          vx: 0,
          vy: 0,
          ci,
          ox,
          oy,
          size: 2.5 + Math.random() * 4,
          baseA: 0.3 + Math.random() * 0.55,
          twP: Math.random() * Math.PI * 2,
          twS: 0.3 + Math.random() * 0.9,
          ph: Math.random() * Math.PI * 2,
          lag: 0.45 + Math.random() * 0.85, // varied responsiveness → trails when chasing
        };
      }
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    // simulation constants (relative units / second)
    const SPRING = 5; // higher = faster snap to target
    const FLOW = 0.16;
    const DAMP = 4;
    const GATHER = 0.06; // how tightly particles pack around the pointer (smaller = closer)
    const MAXV = 3.6;
    const SCATTER = 0.18; // gather spread grows with pointer speed (breaks apart while chasing)
    const SCATTER_MAX = 0.55;

    const start = performance.now();
    let prev = start;
    let pmx = mx;
    let pmy = my;
    let mspeed = 0;
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min(0.04, (now - prev) / 1000);
      prev = now;

      // smoothed pointer speed → how much the cluster breaks apart while following
      const rawSpeed = dt > 0 ? Math.hypot(mx - pmx, my - pmy) / dt : 0;
      mspeed += (rawSpeed - mspeed) * 0.25;
      pmx = mx;
      pmy = my;
      const gatherNow = GATHER + Math.min(SCATTER_MAX, mspeed * SCATTER);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // ambient glow at each home; when the pointer is active the whole field
      // gathers to it, so the home glows fade and a glow appears at the pointer
      const glowR = Math.min(w, h) * 0.85;
      for (let k = 0; k < anchors.length; k++) {
        ctx.globalAlpha = hasMouse ? 0.14 : 0.42;
        ctx.drawImage(
          glow,
          anchors[k].x * w - glowR / 2,
          anchors[k].y * h - glowR / 2,
          glowR,
          glowR,
        );
      }
      if (hasMouse) {
        const r = glowR * 0.85;
        ctx.globalAlpha = 0.6;
        ctx.drawImage(glow, mx * w - r / 2, my * h - r / 2, r, r);
      }

      // simulate + draw each particle individually
      const damp = Math.exp(-dt * DAMP);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const active = hasMouse;
        const tx = active ? mx + p.ox * gatherNow : anchors[p.ci].x + p.ox;
        const ty = active ? my + p.oy * gatherNow : anchors[p.ci].y + p.oy;
        const k = SPRING * p.lag;
        const fx = (tx - p.x) * k + Math.sin(p.y * 9 + t * 0.5 + p.ph) * FLOW;
        const fy = (ty - p.y) * k + Math.cos(p.x * 9 + t * 0.45 + p.ph) * FLOW;
        p.vx = (p.vx + fx * dt) * damp;
        p.vy = (p.vy + fy * dt) * damp;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > MAXV) {
          p.vx = (p.vx / sp) * MAXV;
          p.vy = (p.vy / sp) * MAXV;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.globalAlpha =
          p.baseA * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * p.twS + p.twP)));
        ctx.drawImage(
          sprite,
          p.x * w - p.size / 2,
          p.y * h - p.size / 2,
          p.size,
          p.size,
        );
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
        mx = nx;
        my = ny;
        hasMouse = true;
      } else {
        hasMouse = false;
      }
    };
    const onLeave = () => {
      hasMouse = false;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />
  );
}
