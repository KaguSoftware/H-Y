"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE COOLING SEQUENCE — pinned, scroll-driven Three.js hero
 *
 *  Stack: React Three Fiber + Drei + GSAP ScrollTrigger + Tailwind overlay.
 *
 *  The cooler is modelled procedurally after the H&Y reference renders in
 *  /public (phone_cooler_renders_transparent.png, _exploded_, _overview_):
 *  hourglass body with pinched sides, X-frame front cover case with two
 *  lens cutouts, digital display window, blower-wheel fan, side vent slats,
 *  clip tabs, semiconductor plate and copper heat sheet.
 *
 *  The phone is a procedural modern flagship (titanium rail, edge-to-edge
 *  glass, triple camera island). Heat is communicated by a pulsing glow
 *  in the BACK glass — the phone is staged from a 3/4 back angle.
 *  🔁 To use a branded GLB phone model instead, swap the <Phone /> body
 *  for a useGLTF() primitive (see git history for a working example).
 *
 *  Scroll story (pinned for 400vh):
 *    0.00 – 0.18  Floating phone overheating (heat particles, thermal screen)
 *    0.18 – 0.30  Phone exits left, cooler enters from the right
 *    0.30 – 0.45  Cooler explodes into its four layers
 *    0.45 – 0.62  Red heat particles get drawn into the copper sheet
 *    0.62 – 0.78  Flow turns cyan and travels into the cooling core
 *    0.78 – 0.88  Layers reassemble, fan spins up, activation ring glows
 *    0.88 – 1.00  Phone returns, snap-on, cooling pulse, temp drops, CTA
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// mobile browsers resize the viewport when the URL bar collapses mid-scroll;
// without this, ScrollTrigger refreshes and the pin jumps
if (typeof window !== "undefined") {
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/* ── palette ─────────────────────────────────────────────────────────────── */
const EMBER = new THREE.Color("#ff4d1f");
const ICE = new THREE.Color("#5fd4ff");
const ICE_DEEP = new THREE.Color("#1283c4");
const GUNMETAL = "#2b303c"; // body colour from the product render
const BRAND_RED = "#c8102e";

/* ── timeline phases (fractions of the pinned scroll) ────────────────────── */
const PH = {
  hot: [0.0, 0.18],
  swap: [0.18, 0.3],
  open: [0.3, 0.45],
  heatIn: [0.45, 0.62],
  coolFlow: [0.62, 0.78],
  close: [0.78, 0.88],
  attach: [0.88, 1.0],
} as const;

/* ── tiny easing/keyframe helpers (used inside useFrame) ─────────────────── */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, [a, b]: readonly [number, number] | readonly number[]) =>
  clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const outBack = (t: number) => {
  const c = 2.2;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

// p: raw scroll progress (written by ScrollTrigger)
// s: exponentially smoothed progress — everything in the 3D scene reads
//    this so discrete scroll-wheel steps never cause visible jumps
type Prog = { p: number; s: number };

/* ════════════════════════════════════════════════════════════════════════════
   PHONE — procedural modern flagship, staged from a 3/4 back angle.
   Heat is a pulsing glow inside the back glass (no fake thermal screen).
   ════════════════════════════════════════════════════════════════════════════ */

// triple camera lens layout on the island (local x/y)
const LENSES: [number, number][] = [
  [-0.115, 0.115],
  [-0.115, -0.13],
  [0.13, 0.115],
];

/** iOS-style lock screen with a Dynamic Island, drawn to canvas.
    Shows the REAL current time/date and refreshes every 30s. */
function useLockScreenTexture() {
  const { tex, draw } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 1024;
    const ctx = c.getContext("2d")!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const draw = () => {
      const now = new Date();
      const time = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const date = now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      drawLockScreen(ctx, time, date);
      tex.needsUpdate = true;
    };
    draw();
    return { tex, draw };
  }, []);

  useEffect(() => {
    const id = setInterval(draw, 30_000);
    return () => clearInterval(id);
  }, [draw]);

  return tex;
}

function drawLockScreen(
  ctx: CanvasRenderingContext2D,
  time: string,
  date: string
) {
  {
    ctx.clearRect(0, 0, 512, 1024);
    // rounded screen corners (transparent outside) — matches the bezel
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 1024, 58);
    ctx.clip();
    // the phone is HOT: ember-red wallpaper with a molten bloom
    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, "#2b0903");
    g.addColorStop(0.5, "#551307");
    g.addColorStop(1, "#1c0506");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 1024);
    const rg = ctx.createRadialGradient(256, 660, 40, 256, 660, 480);
    rg.addColorStop(0, "rgba(255,110,40,0.5)");
    rg.addColorStop(0.55, "rgba(255,70,20,0.18)");
    rg.addColorStop(1, "rgba(255,70,20,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, 512, 1024);

    // dynamic island (camera dot offset right, like the 14 Pro)
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.roundRect(256 - 78, 32, 156, 46, 23);
    ctx.fill();
    ctx.fillStyle = "#101218";
    ctx.beginPath();
    ctx.arc(256 + 50, 55, 9, 0, Math.PI * 2);
    ctx.fill();

    // date + big bold SF-style clock (iOS 16 lock screen)
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font =
      "600 30px -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";
    ctx.fillText(date, 256, 148);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font =
      "700 168px -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif";
    ctx.fillText(time, 256, 308);

    // flashlight + camera quick actions
    for (const [cx, glyph] of [
      [88, "flash"],
      [424, "cam"],
    ] as const) {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.arc(cx, 924, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      if (glyph === "flash") {
        ctx.beginPath();
        ctx.roundRect(cx - 8, 906, 16, 20, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(cx - 5, 928, 10, 14, 3);
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(cx - 15, 912, 30, 24, 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, 924, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // home indicator
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.roundRect(256 - 70, 990, 140, 8, 4);
    ctx.fill();
  }
}

/** Soft radial sprite texture for the heat halo behind the phone. */
function useHaloTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.85)");
    g.addColorStop(0.45, "rgba(255,255,255,0.22)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
}

function Phone({ prog }: { prog: Prog }) {
  const group = useRef<THREE.Group>(null!);
  const backMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const heatLight = useRef<THREE.PointLight>(null!);
  const haloMat = useRef<THREE.SpriteMaterial>(null!);
  const screenTex = useLockScreenTexture();
  const haloTex = useHaloTexture();

  // iPhone-14-style construction: a FLAT extruded rail band (not a pill)
  // with flush glass slabs front and back — kills the edge gap too
  const { railGeo, glassGeo } = useMemo(() => {
    const rr = (w: number, h: number, r: number) => {
      const s = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };
    const railGeo = new THREE.ExtrudeGeometry(rr(1.45, 3.05, 0.22), {
      depth: 0.13,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 3,
      curveSegments: 32,
    });
    railGeo.translate(0, 0, -0.065);
    const glassGeo = new THREE.ExtrudeGeometry(rr(1.41, 3.01, 0.19), {
      depth: 0.012,
      bevelEnabled: true,
      bevelSize: 0.01,
      bevelThickness: 0.01,
      bevelSegments: 2,
      curveSegments: 32,
    });
    glassGeo.translate(0, 0, -0.006);
    return { railGeo, glassGeo };
  }, []);

  useFrame(({ clock }) => {
    const p = prog.s;
    const t = clock.elapsedTime;
    const g = group.current;

    const exit = smooth(span(p, [0.18, 0.27]));
    const ret = smooth(span(p, [0.88, 0.95]));
    const gone = p > PH.swap[1] && p < PH.attach[0];

    g.visible = !gone;
    if (gone) return;

    // float in place → slide off left → return from the left, back to camera
    const float = p < 0.3 ? Math.sin(t * 0.9) * 0.07 : 0;
    g.position.x = -exit * 8 + (p >= PH.attach[0] ? -8 + ret * 8 : 0);
    g.position.y = float + (p >= PH.attach[0] ? Math.sin(t * 0.7) * 0.04 : 0);
    g.position.z = p >= PH.attach[0] ? -0.45 : 0;

    if (p < PH.attach[0]) {
      // 3/4 FRONT view — the lock screen stays clean while the heat
      // pulses as a halo from behind the phone
      g.rotation.set(
        0.04 + Math.sin(t * 0.5) * 0.03,
        -0.38 + Math.sin(t * 0.4) * 0.05 - exit * 1.1,
        -0.03
      );
    } else {
      // back faces the camera square-on so the cooler can snap onto it
      g.rotation.set(0.03, Math.PI + (1 - ret) * 0.9, 0);
    }

    // heat: slow breathing pulse glowing from BEHIND the phone
    const heat = (1 - exit) * (p < PH.swap[1] ? 1 : 0);
    const breathe = 0.62 + 0.38 * Math.sin(t * 2.6);
    haloMat.current.opacity = heat * breathe * 0.5;
    if (p < 0.5) {
      backMat.current.emissive.copy(EMBER);
      backMat.current.emissiveIntensity = heat * breathe * 0.85;
      heatLight.current.color.copy(EMBER);
      heatLight.current.intensity = heat * breathe * 7;
    } else {
      // cooling pulse washes over the back right after the snap
      const pulse = Math.sin(span(p, [0.93, 1.0]) * Math.PI);
      backMat.current.emissive.copy(ICE);
      backMat.current.emissiveIntensity = pulse * 0.4;
      heatLight.current.color.copy(ICE);
      heatLight.current.intensity = pulse * 3;
    }
  });

  return (
    <group ref={group}>
      {/* satin aluminium rail — flat band with rounded corners (iPhone 14) */}
      <mesh geometry={railGeo}>
        <meshPhysicalMaterial color="#4a4e57" metalness={1} roughness={0.45} />
      </mesh>
      {/* front glass, flush with a slight proud edge */}
      <mesh geometry={glassGeo} position={[0, 0, 0.082]}>
        <meshPhysicalMaterial
          color="#05070b"
          metalness={0.3}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>
      {/* lock screen with Dynamic Island — rendered above the glass so the
          heat pulse never tints the UI */}
      <mesh position={[0, 0, 0.103]}>
        <planeGeometry args={[1.37, 2.97]} />
        <meshBasicMaterial map={screenTex} transparent toneMapped={false} />
      </mesh>
      {/* pulsing heat halo radiating from the back */}
      <sprite position={[0, 0, -0.6]} scale={[3.6, 4.6, 1]}>
        <spriteMaterial
          ref={haloMat}
          map={haloTex}
          color={EMBER}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {/* back glass — carries the pulsing heat glow */}
      <mesh geometry={glassGeo} position={[0, 0, -0.082]}>
        <meshPhysicalMaterial
          ref={backMat}
          color="#15181f"
          metalness={0.5}
          roughness={0.28}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {/* camera island (top-left of the back) */}
      <group position={[-0.38, 1.08, -0.115]}>
        <RoundedBox args={[0.56, 0.56, 0.05]} radius={0.15}>
          <meshPhysicalMaterial color="#1b1e25" metalness={0.7} roughness={0.3} />
        </RoundedBox>
        {LENSES.map(([x, y], i) => (
          <group key={i} position={[x, y, -0.035]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.105, 0.105, 0.035, 32]} />
              <meshPhysicalMaterial color="#2c313a" metalness={1} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0, -0.02]}>
              <circleGeometry args={[0.07, 24]} />
              <meshPhysicalMaterial
                color="#0a1428"
                metalness={0.4}
                roughness={0.05}
                clearcoat={1}
              />
            </mesh>
          </group>
        ))}
        {/* flash */}
        <mesh position={[0.13, -0.13, -0.032]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial color="#d8dce2" roughness={0.4} />
        </mesh>
      </group>
      {/* iPhone button layout: power right; mute + volume up/down left */}
      <RoundedBox args={[0.025, 0.42, 0.05]} radius={0.012} position={[0.735, 0.55, 0]}>
        <meshPhysicalMaterial color="#565b64" metalness={1} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.025, 0.13, 0.05]} radius={0.012} position={[-0.735, 1.05, 0]}>
        <meshPhysicalMaterial color="#565b64" metalness={1} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.025, 0.24, 0.05]} radius={0.012} position={[-0.735, 0.72, 0]}>
        <meshPhysicalMaterial color="#565b64" metalness={1} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.025, 0.24, 0.05]} radius={0.012} position={[-0.735, 0.38, 0]}>
        <meshPhysicalMaterial color="#565b64" metalness={1} roughness={0.35} />
      </RoundedBox>
      <pointLight
        ref={heatLight}
        color={EMBER}
        distance={4.5}
        decay={2}
        position={[0, 0.2, -0.9]}
      />
    </group>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COOLER GEOMETRY — shapes traced from the product drawings
   ════════════════════════════════════════════════════════════════════════════ */

/** Hourglass body silhouette: corner lobes with pinched (concave) sides. */
function bodyOutline(w = 0.75, h = 1.1, waist = 0.6) {
  const s = new THREE.Shape();
  s.moveTo(-0.5, -h);
  s.lineTo(0.5, -h);
  s.bezierCurveTo(0.72, -h, w, -h + 0.16, w, -h + 0.34);
  // right side sweeps inward to the waist, then back out
  s.bezierCurveTo(waist - 0.02, -0.36, waist - 0.02, 0.36, w, h - 0.34);
  s.bezierCurveTo(w, h - 0.16, 0.72, h, 0.5, h);
  s.lineTo(-0.5, h);
  s.bezierCurveTo(-0.72, h, -w, h - 0.16, -w, h - 0.34);
  s.bezierCurveTo(-(waist - 0.02), 0.36, -(waist - 0.02), -0.36, -w, -h + 0.34);
  s.bezierCurveTo(-w, -h + 0.16, -0.72, -h, -0.5, -h);
  return s;
}

function roundedRectPath(cx: number, cy: number, w: number, h: number, r: number) {
  const p = new THREE.Path();
  const x = cx - w / 2;
  const y = cy - h / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r);
  p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h);
  p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  return p;
}

/**
 * One lens-shaped cutout of the front cover (mirrored for the other side).
 * The pair of holes is what creates the signature X-frame: a centre column
 * pinched at the middle with arms sweeping out to the corners.
 */
function lensCutout(side: 1 | -1) {
  const m = (x: number) => x * side;
  const p = new THREE.Path();
  p.moveTo(m(0.13), 0.52);
  p.bezierCurveTo(m(0.38), 0.56, m(0.54), 0.5, m(0.58), 0.34); // top arm
  // outer edge is CONCAVE: it follows the pinched waist, leaving a thin rim
  p.bezierCurveTo(m(0.45), 0.13, m(0.45), -0.13, m(0.58), -0.34);
  p.bezierCurveTo(m(0.54), -0.5, m(0.38), -0.56, m(0.13), -0.52); // bottom arm
  p.bezierCurveTo(m(0.045), -0.2, m(0.045), 0.2, m(0.13), 0.52); // pinched column
  return p;
}

/** Canvas texture helper for small decals (logo, control markings). */
function makeDecal(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 128) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The cooler's own digital temperature display (the real unit has one). */
function useDisplayTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    let last = -1;
    const draw = (temp: number) => {
      const v = Math.round(temp * 10) / 10;
      if (v === last) return;
      last = v;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#04060a";
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = v > 36 ? "#ff6a3c" : "#8fe8ff";
      ctx.font = "700 60px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${v.toFixed(1)}°`, 128, 68);
      tex.needsUpdate = true;
    };
    draw(42);
    return { tex, draw };
  }, []);
}

/** Blower-wheel fan: a dense ring of long fins filling the lens openings. */
function BlowerFan() {
  const fins = useMemo(() => Array.from({ length: 44 }, (_, i) => i), []);
  return (
    <>
      {fins.map((i) => {
        const a = (i / 44) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0]}
            rotation={[0, 0, a + 0.5]}
          >
            <boxGeometry args={[0.045, 0.34, 0.24]} />
            <meshPhysicalMaterial color="#3a4150" metalness={0.6} roughness={0.4} />
          </mesh>
        );
      })}
      {/* rotor backing disc closes the wheel */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[0.61, 48]} />
        <meshPhysicalMaterial color="#23272f" metalness={0.6} roughness={0.45} />
      </mesh>
      {/* 7 broad inner blades (the spec sheet's quiet 7-blade fan) */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <group key={`b${i}`} rotation={[0, 0, a]}>
            <mesh position={[0.29, 0, 0.0]} rotation={[0.6, 0, 0]}>
              <boxGeometry args={[0.3, 0.17, 0.02]} />
              <meshPhysicalMaterial color="#2e3440" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
      {/* silver hub like the render */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.24, 32]} />
        <meshPhysicalMaterial color="#9aa0a8" metalness={1} roughness={0.3} />
      </mesh>
    </>
  );
}

const LAYER_LABELS = [
  "FRONT COVER CASE",
  "SILENT COOLING FAN",
  "SEMICONDUCTOR COOLING",
  "COPPER SHEET",
];

/**
 * Cool-air path: thin streamlines + particles riding them, shown ONLY in
 * the EXPLODED view once the cooling flow kicks in. The streams travel
 * through the separated stack — copper sheet → semiconductor plate → fan —
 * and flare out past the front cover. Cooler-local coordinates match the
 * exploded layer positions.
 */
function AirFlow({ prog }: { prog: Prog }) {
  const lineMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const dotMat = useRef<THREE.PointsMaterial>(null!);
  const dotPos = useRef<THREE.BufferAttribute>(null!);

  const curves = useMemo(() => {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    // direction of travel = point order: in past the front cover, through
    // the fan, onto the plate and copper sheet
    return [
      new THREE.CatmullRomCurve3([
        v(-0.5, 0.55, 1.4), v(0.05, 0.1, 0.5), v(0.2, 0.3, -0.85), v(0.45, 0.6, -2.3),
      ]),
      new THREE.CatmullRomCurve3([
        v(-0.7, -0.35, 1.3), v(-0.04, -0.05, 0.55), v(-0.18, -0.15, -0.85), v(-0.4, -0.3, -2.3),
      ]),
      new THREE.CatmullRomCurve3([
        v(0.6, -0.5, 1.45), v(0.0, -0.08, 0.6), v(0.05, -0.3, -0.9), v(0.1, -0.6, -2.4),
      ]),
    ];
  }, []);
  const tubes = useMemo(
    () => curves.map((c) => new THREE.TubeGeometry(c, 48, 0.008, 6, false)),
    [curves]
  );
  const PER_STREAM = 7;
  const positions = useMemo(
    () => new Float32Array(curves.length * PER_STREAM * 3),
    [curves]
  );

  useFrame(({ clock }) => {
    const p = prog.s;
    // exploded view only: appear with the cyan cooling flow, vanish as the
    // layers close back up
    const e = smooth(span(p, PH.open)) * (1 - smooth(span(p, PH.close)));
    const air = e * smooth(span(p, [0.6, 0.66]));
    lineMats.current.forEach((m) => m && (m.opacity = air * 0.22));
    if (dotMat.current) dotMat.current.opacity = air * 0.9;
    if (air <= 0) return;
    const t = clock.elapsedTime;
    curves.forEach((c, ci) => {
      for (let i = 0; i < PER_STREAM; i++) {
        const u = (t * 0.22 + i / PER_STREAM + ci * 0.13) % 1;
        const pt = c.getPointAt(u);
        const o = (ci * PER_STREAM + i) * 3;
        positions[o] = pt.x;
        positions[o + 1] = pt.y;
        positions[o + 2] = pt.z;
      }
    });
    if (dotPos.current) dotPos.current.needsUpdate = true;
  });

  return (
    <group>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial
            ref={(m) => {
              if (m) lineMats.current[i] = m;
            }}
            color={ICE}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            ref={dotPos}
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={dotMat}
          color="#9be4ff"
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

const bodyMatProps = {
  color: GUNMETAL,
  metalness: 0.7,
  roughness: 0.35,
  clearcoat: 0.5,
  clearcoatRoughness: 0.3,
} as const;

function Cooler({ prog }: { prog: Prog }) {
  const group = useRef<THREE.Group>(null!);
  const layers = [
    useRef<THREE.Group>(null!), // front cover case (incl. body shell)
    useRef<THREE.Group>(null!), // blower fan
    useRef<THREE.Group>(null!), // semiconductor plate
    useRef<THREE.Group>(null!), // copper sheet
  ];
  const fan = useRef<THREE.Group>(null!);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!);
  const coreGlowMat = useRef<THREE.MeshBasicMaterial>(null!);
  const plateMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const copperMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const shockMat = useRef<THREE.MeshBasicMaterial>(null!);
  const shock = useRef<THREE.Mesh>(null!);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fanSpeed = useRef(0);

  const display = useDisplayTexture();

  /* ── geometry traced from the drawings ─────────────────────────────────── */
  const { shellGeo, faceGeo, copperGeo } = useMemo(() => {
    // body shell: hourglass outline, hollowed by a smaller inner outline
    const shellShape = bodyOutline(0.75, 1.1, 0.6);
    shellShape.holes.push(bodyOutline(0.66, 1.0, 0.54) as unknown as THREE.Path);
    const shellGeo = new THREE.ExtrudeGeometry(shellShape, {
      depth: 0.44,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 3,
      curveSegments: 24,
    });
    shellGeo.translate(0, 0, -0.22);

    // front cover plate with display window + the two lens cutouts
    const faceShape = bodyOutline(0.73, 1.08, 0.59);
    faceShape.holes.push(roundedRectPath(0, 0.72, 0.56, 0.3, 0.08));
    faceShape.holes.push(lensCutout(1));
    faceShape.holes.push(lensCutout(-1));
    // sculpted corner openings flanking the display (top) and controls
    // (bottom) — the arms read as loops, not a solid slab (see overview png)
    for (const [cx, cy, rx, ry] of [
      [0.45, 0.74, 0.14, 0.12],
      [-0.45, 0.74, 0.14, 0.12],
      [0.45, -0.76, 0.13, 0.11],
      [-0.45, -0.76, 0.13, 0.11],
    ]) {
      const hole = new THREE.Path();
      hole.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, false, 0);
      faceShape.holes.push(hole);
    }
    // deeper extrusion + bevel so the X-frame arms read as rounded tubes
    const faceGeo = new THREE.ExtrudeGeometry(faceShape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.045,
      bevelSegments: 3,
      curveSegments: 24,
    });

    // copper heat sheet: same silhouette, thin
    const copperGeo = new THREE.ExtrudeGeometry(bodyOutline(0.68, 1.0, 0.56), {
      depth: 0.02,
      bevelEnabled: false,
      curveSegments: 20,
    });

    return { shellGeo, faceGeo, copperGeo };
  }, []);

  const logoTex = useMemo(
    () =>
      makeDecal((ctx) => {
        ctx.clearRect(0, 0, 256, 128);
        ctx.fillStyle = BRAND_RED;
        ctx.font = "italic 900 84px Arial Black, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("H&Y", 128, 70);
      }),
    []
  );

  const controlsTex = useMemo(
    () =>
      makeDecal((ctx) => {
        ctx.clearRect(0, 0, 256, 64);
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "600 17px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("MIN   AUTO   POWER", 128, 24);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(88, 38, 80, 9);
        ctx.fillStyle = "#0a0c10";
        ctx.fillRect(92, 40, 30, 5);
      }, 256, 64),
    []
  );

  // resting z of each layer, its explode direction, and how far apart the
  // stack spreads when fully open (matches the exploded diagram)
  const EXPLODE = 1.7;
  const layout = [
    { z: 0.0, dir: 1.0 }, // shell + face travel together (front cover case)
    { z: 0.0, dir: 0.36 },
    { z: -0.12, dir: -0.42 },
    { z: -0.24, dir: -1.0 },
  ];

  useFrame(({ clock }, dt) => {
    const p = prog.s;
    const t = clock.elapsedTime;
    const g = group.current;

    const enter = smooth(span(p, [0.19, 0.28]));
    g.visible = p > 0.19;

    // exploded amount: opens during `open`, holds, closes during `close`
    const e = smooth(span(p, PH.open)) * (1 - smooth(span(p, PH.close)));
    layers.forEach((l, i) => {
      l.current.position.z = layout[i].z + layout[i].dir * e * EXPLODE;
      l.current.rotation.z = i > 0 ? e * (i % 2 ? -0.1 : 0.1) : 0;
    });

    // entrance from the right, tilt while exploded, settle for attach
    const snap = outBack(smooth(span(p, [0.9, 0.97])));
    // drift forward smoothly at the end of step 5, then snap back onto the
    // phone — no discontinuity at the phase boundary
    const lead = smooth(span(p, [0.85, 0.9]));
    g.position.x = (1 - enter) * 8;
    g.position.y = Math.sin(t * 0.8) * 0.05;
    g.position.z = lead * 0.9 - snap * 0.55;
    // stronger Y twist while exploded so the stack spreads across the screen
    g.rotation.y = (1 - enter) * -1.4 + e * 0.85;
    g.rotation.x = e * 0.12;
    const scale = 1 - smooth(span(p, [0.88, 0.94])) * 0.42;
    g.scale.setScalar(scale);

    // fan spin-up once the cooler activates
    const active = smooth(span(p, PH.close));
    fanSpeed.current += ((active * 20) - fanSpeed.current) * Math.min(1, dt * 2);
    fan.current.rotation.z -= fanSpeed.current * dt;

    // activation ring + core glow (cyan)
    const ring = active * (1 - span(p, [0.88, 0.92]) * 0.4);
    ringMat.current.opacity = ring * 0.85;
    coreGlowMat.current.opacity =
      Math.max(smooth(span(p, PH.coolFlow)) * 0.6, active * 0.55);

    // thermal handoff: copper sheet heats red, then the semiconductor
    // plate / core take over with a cyan glow
    const heatIn = smooth(span(p, PH.heatIn));
    const coolFlow = smooth(span(p, PH.coolFlow));
    copperMat.current.emissive.copy(EMBER);
    copperMat.current.emissiveIntensity = heatIn * (1 - coolFlow) * 0.7;
    plateMat.current.emissive.copy(ICE_DEEP);
    plateMat.current.emissiveIntensity = coolFlow * 0.8;

    // on-device digital readout cools down after the snap
    display.draw(42 - 13 * smooth(span(p, [0.905, 0.985])));

    // snap-on shockwave — a quick, quiet pulse right at contact
    const s = span(p, [0.925, 0.965]);
    shock.current.visible = s > 0 && s < 1;
    shock.current.scale.setScalar(0.7 + s * 2.2);
    shockMat.current.opacity = Math.sin(Math.min(s, 0.999) * Math.PI) * 0.3;

    // exploded-view technical labels
    const labelOp = e * (p < 0.78 ? 1 : 0) * smooth(span(p, [0.34, 0.42]));
    labelRefs.current.forEach((el) => {
      if (el) el.style.opacity = String(labelOp);
    });
  });

  // labels hug the stack on mobile so they never run off-screen
  const { size } = useThree();
  const narrow = size.width < size.height;
  const label = (i: number, side: 1 | -1, y = 0.3) => {
    // the outermost layers hug the screen edges on mobile — point their
    // labels inward so they stay on screen
    const s: 1 | -1 = narrow ? (i === 0 ? -1 : i === 3 ? 1 : side) : side;
    return (
    <Html
      position={[s * (narrow ? 0.8 : 1.5), narrow ? y + 0.55 : y, 0]}
      center
      style={{ pointerEvents: "none" }}
      zIndexRange={[5, 0]}
    >
      <div
        ref={(el) => {
          labelRefs.current[i] = el;
        }}
        className="flex items-center gap-1.5 opacity-0 whitespace-nowrap md:gap-2"
        style={{ flexDirection: s === 1 ? "row" : "row-reverse" }}
      >
        <span className={`block h-px bg-white/30 ${narrow ? "w-3" : "w-10"}`} />
        <span
          className={`font-mono tracking-[0.2em] text-white/60 md:tracking-[0.25em] ${
            narrow ? "text-[8px]" : "text-[10px]"
          }`}
        >
          {LAYER_LABELS[i]}
        </span>
      </div>
    </Html>
    );
  };

  return (
    <group ref={group}>
      {/* ── layer 1: front cover case — shell, face plate, display, decals ── */}
      <group ref={layers[0]}>
        <mesh geometry={shellGeo}>
          <meshPhysicalMaterial {...bodyMatProps} />
        </mesh>
        {/* face plate a step lighter than the shell so the X-frame reads */}
        <mesh geometry={faceGeo} position={[0, 0, 0.22]}>
          <meshPhysicalMaterial
            {...bodyMatProps}
            color="#3a4150"
          />
        </mesh>

        {/* digital display glass behind the window */}
        <mesh position={[0, 0.72, 0.225]}>
          <planeGeometry args={[0.58, 0.28]} />
          <meshBasicMaterial map={display.tex} toneMapped={false} />
        </mesh>

        {/* H&Y badge on the column crossover */}
        <mesh position={[0, 0.42, 0.315]}>
          <planeGeometry args={[0.34, 0.17]} />
          <meshBasicMaterial map={logoTex} transparent />
        </mesh>

        {/* control strip: MIN / AUTO / POWER + mode switch */}
        <mesh position={[0, -0.82, 0.315]}>
          <planeGeometry args={[0.52, 0.13]} />
          <meshBasicMaterial map={controlsTex} transparent />
        </mesh>

        {/* clip tabs (top + bottom) that grip the phone */}
        <RoundedBox args={[0.34, 0.18, 0.2]} radius={0.04} position={[0, 1.18, -0.02]}>
          <meshPhysicalMaterial {...bodyMatProps} />
        </RoundedBox>
        <RoundedBox args={[0.28, 0.14, 0.18]} radius={0.04} position={[0, -1.17, -0.04]}>
          <meshPhysicalMaterial {...bodyMatProps} />
        </RoundedBox>

        {/* exhaust OPENING cut into the left side wall at the waist: an
            unlit black void (reads as a hole) with diagonal slats sunk
            inside it — this is where the air leaves */}
        <RoundedBox args={[0.07, 1.05, 0.34]} radius={0.03} position={[-0.585, 0, 0.02]}>
          <meshBasicMaterial color="#000000" />
        </RoundedBox>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh
            key={i}
            position={[-0.587, -0.45 + i * 0.1, 0.02]}
            rotation={[0.65, 0, 0]}
          >
            <boxGeometry args={[0.018, 0.024, 0.3]} />
            <meshStandardMaterial color="#272c36" roughness={0.55} metalness={0.5} />
          </mesh>
        ))}
        {label(0, 1, 0.95)}
      </group>

      {/* ── layer 2: silent blower fan ──────────────────────────────────── */}
      <group ref={layers[1]}>
        <group ref={fan}>
          <BlowerFan />
        </group>
        {/* red H&Y dot on the hub */}
        <mesh position={[0, 0, 0.115]}>
          <planeGeometry args={[0.2, 0.1]} />
          <meshBasicMaterial map={logoTex} transparent />
        </mesh>
        {/* cyan core glow ring in front of the rotor disc */}
        <mesh position={[0, 0, 0.14]}>
          <ringGeometry args={[0.24, 0.58, 64]} />
          <meshBasicMaterial
            ref={coreGlowMat}
            color={ICE}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>
        {label(1, -1, 0.5)}
      </group>

      {/* ── layer 3: semiconductor cooling plate ────────────────────────── */}
      <group ref={layers[2]}>
        {/* carrier plate */}
        <RoundedBox args={[1.26, 1.9, 0.05]} radius={0.1}>
          <meshPhysicalMaterial color="#3a4150" metalness={0.7} roughness={0.4} />
        </RoundedBox>
        {/* white ceramic Peltier element */}
        <RoundedBox args={[0.92, 0.92, 0.06]} radius={0.03} position={[0, 0, 0.03]}>
          <meshPhysicalMaterial
            ref={plateMat}
            color="#d3d7dd"
            metalness={0.15}
            roughness={0.55}
          />
        </RoundedBox>
        {label(2, 1, 0.0)}
      </group>

      {/* ── layer 4: copper heat sheet (contacts the phone's back) ──────── */}
      <group ref={layers[3]}>
        <mesh geometry={copperGeo}>
          <meshPhysicalMaterial
            ref={copperMat}
            color="#b87333"
            metalness={1}
            roughness={0.32}
          />
        </mesh>
        {label(3, -1, -0.45)}
      </group>

      {/* activation halo */}
      <mesh position={[0, 0, 0.32]}>
        <ringGeometry args={[1.28, 1.33, 80]} />
        <meshBasicMaterial
          ref={ringMat}
          color={ICE}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* snap-on shockwave (clip engages the phone) */}
      <mesh ref={shock} position={[0, 0, 0.05]} visible={false}>
        <ringGeometry args={[0.96, 1.0, 80]} />
        <meshBasicMaterial ref={shockMat} color={ICE} transparent opacity={0} />
      </mesh>

      {/* flow particles live in cooler-local space so they track the layers */}
      <FlowParticles prog={prog} />

      {/* cool-air streamlines — only while active cooling runs */}
      <AirFlow prog={prog} />
    </group>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PARTICLES
   ════════════════════════════════════════════════════════════════════════════ */

const particleFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

/** Embers rising around the hot phone (scene 1). */
const emberVertex = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uPixelRatio;
  attribute vec4 aSeed; // x: angle, y: radius, z: speed, w: size
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float life = fract(uTime * (0.05 + aSeed.z * 0.09) + aSeed.x * 7.0);
    float ang = aSeed.x * 6.28318 + uTime * 0.12;
    float r = 0.5 + aSeed.y * 1.1 + life * 0.4;
    vec3 p = vec3(cos(ang) * r * 0.8, -1.7 + life * 3.8, sin(ang) * r * 0.45);
    p.x += sin(life * 9.0 + aSeed.y * 20.0) * 0.09;

    vAlpha = uIntensity * smoothstep(0.0, 0.18, life) * (1.0 - smoothstep(0.5, 1.0, life));
    vColor = mix(vec3(1.0, 0.30, 0.12), vec3(1.0, 0.72, 0.42), aSeed.y);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aSeed.w * 26.0) * uPixelRatio * (2.6 / -mv.z);
  }
`;

function HeatEmbers({ prog }: { prog: Prog }) {
  const points = useRef<THREE.Points>(null!);
  const COUNT = 520;
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT * 4; i++) seeds[i] = Math.random();
    return { positions, seeds };
  }, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uPixelRatio: { value: 1 },
    }),
    []
  );

  useFrame(({ clock, gl }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    // only alive while the hot phone is on stage — wide window so they
    // breathe out gradually instead of popping off
    const intensity = 1 - smooth(span(prog.s, [0.13, 0.32]));
    uniforms.uIntensity.value = intensity;
    points.current.visible = intensity > 0.002;
    // drift with the phone as it exits (same eased path → stays smooth)
    points.current.position.x = -smooth(span(prog.s, [0.18, 0.27])) * 8;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 4]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={emberVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * Heat-transfer flow (scenes 4–5), in cooler-local space.
 * Path: scattered behind the copper sheet → lands on the sheet →
 * (once uReach ramps) continues through the plate into the core, turning cyan.
 */
const flowVertex = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uReach;     // 0 = stop at the copper sheet, 1 = into the core
  uniform float uColorMix;  // 0 = heat red, 1 = cooling cyan
  uniform float uZFabric;
  uniform float uZCore;
  uniform float uPixelRatio;
  attribute vec4 aSeed;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float t = fract(uTime * (0.10 + aSeed.z * 0.12) + aSeed.x * 13.0);
    float s = t * (1.0 + uReach);          // total path progress
    float s1 = clamp(s, 0.0, 1.0);          // approach + spread on the sheet
    float s2 = clamp(s - 1.0, 0.0, 1.0);    // sheet → core

    float ang = aSeed.x * 6.28318;
    float landR = 0.12 + aSeed.y * 0.72;    // landing spot on the sheet

    vec3 start = vec3(cos(ang) * (1.6 + aSeed.w * 1.6),
                      sin(ang) * (1.6 + aSeed.w * 1.6) * 0.7,
                      uZFabric - 1.4 - aSeed.z * 0.8);
    vec3 onFabric = vec3(cos(ang + s1 * 2.2) * landR * 0.6,
                         sin(ang + s1 * 2.2) * landR * 0.9,
                         uZFabric - 0.02);
    vec3 core = vec3(cos(ang) * 0.12, sin(ang) * 0.12, uZCore);

    vec3 p = mix(start, onFabric, smoothstep(0.0, 1.0, s1));
    p = mix(p, core, smoothstep(0.0, 1.0, s2));

    vAlpha = uIntensity * smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.92, 1.0, t));
    float cool = uColorMix * smoothstep(0.05, 0.6, s2 + uColorMix * 0.25);
    vColor = mix(vec3(1.0, 0.30, 0.10), vec3(0.37, 0.83, 1.0), cool);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aSeed.w * 20.0) * uPixelRatio * (2.4 / -mv.z);
  }
`;

function FlowParticles({ prog }: { prog: Prog }) {
  const points = useRef<THREE.Points>(null!);
  const COUNT = 900;
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT * 4; i++) seeds[i] = Math.random();
    return { positions, seeds };
  }, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uReach: { value: 0 },
      uColorMix: { value: 0 },
      uZFabric: { value: -0.24 },
      uZCore: { value: 0.0 },
      uPixelRatio: { value: 1 },
    }),
    []
  );

  useFrame(({ clock, gl }) => {
    const p = prog.s;
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    // visible only during the transfer chapter
    const intensity =
      smooth(span(p, [0.45, 0.5])) * (1 - smooth(span(p, [0.76, 0.82])));
    uniforms.uIntensity.value = intensity;
    points.current.visible = intensity > 0.002;
    uniforms.uReach.value = smooth(span(p, [0.6, 0.7]));
    uniforms.uColorMix.value = smooth(span(p, PH.coolFlow));
    // track the exploded layer positions (EXPLODE distance in Cooler)
    const e = smooth(span(p, PH.open)) * (1 - smooth(span(p, PH.close)));
    uniforms.uZFabric.value = -0.24 - e * 1.7;
    uniforms.uZCore.value = 0.0 + e * 0.61;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 4]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={flowVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STAGE — atmosphere, camera choreography, lighting
   ════════════════════════════════════════════════════════════════════════════ */

function StageGlow({ prog }: { prog: Prog }) {
  const mat = useRef<THREE.SpriteMaterial>(null!);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.4, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const p = prog.s;
    // ambience drifts from ember red to ice cyan across the sequence
    const mix = smooth(span(p, [0.45, 0.8]));
    col.copy(EMBER).lerp(ICE_DEEP, mix);
    mat.current.color.copy(col);
    mat.current.opacity = 0.16 + 0.08 * Math.sin(p * Math.PI);
  });

  return (
    <sprite position={[0, -0.3, -3.5]} scale={[16, 11, 1]}>
      <spriteMaterial
        ref={mat}
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

/** Eases the raw scroll progress every frame — kills scroll-step jumpiness. */
function ProgressSmoother({ prog }: { prog: Prog }) {
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 7); // framerate-independent smoothing
    prog.s += (prog.p - prog.s) * k;
    if (Math.abs(prog.p - prog.s) < 0.0004) prog.s = prog.p;
  });
  return null;
}

function CameraRig({ prog }: { prog: Prog }) {
  const { camera, pointer, size } = useThree();
  useFrame(() => {
    const p = prog.s;
    const e = smooth(span(p, PH.open)) * (1 - smooth(span(p, PH.close)));
    // on narrow (portrait/mobile) screens, back the camera off so the
    // product never spills out of frame
    const aspect = size.width / size.height;
    const portrait = aspect < 1 ? (1 - aspect) * 7.2 : 0;
    const tx = Math.sin(p * Math.PI * 2) * 0.35 + pointer.x * 0.25;
    const ty = 0.12 + Math.cos(p * Math.PI) * 0.18 + pointer.y * 0.15;
    // pull BACK for the exploded view (the stack spreads wide), then push
    // in for the final composition
    const tz =
      6.3 + portrait - p * 0.5 + e * 2.1 - smooth(span(p, [0.88, 0.97])) * 1.5;
    camera.position.x += (tx - camera.position.x) * 0.06;
    camera.position.y += (ty - camera.position.y) * 0.06;
    camera.position.z += (tz - camera.position.z) * 0.06;
    // on mobile, aim slightly right of centre while exploded so the stack
    // sits a touch further left in frame
    camera.lookAt(aspect < 1 ? e * 0.22 : 0, 0, 0);
  });
  return null;
}

function Lights({ prog }: { prog: Prog }) {
  const warm = useRef<THREE.SpotLight>(null!);
  const cold = useRef<THREE.SpotLight>(null!);
  useFrame(() => {
    const p = prog.s;
    const coolMix = smooth(span(p, [0.5, 0.85]));
    warm.current.intensity = 90 * (1 - coolMix * 0.85);
    cold.current.intensity = 50 + coolMix * 140;
  });
  return (
    <>
      <ambientLight intensity={0.45} />
      <spotLight
        position={[5, 6, 4]}
        angle={0.5}
        penumbra={1}
        intensity={160}
        color="#dfe8ff"
      />
      <spotLight
        ref={warm}
        position={[-6, -2, 3]}
        angle={0.7}
        penumbra={1}
        intensity={90}
        color="#ff5a26"
      />
      <spotLight
        ref={cold}
        position={[6, -3, 2]}
        angle={0.7}
        penumbra={1}
        intensity={50}
        color="#46b8ff"
      />
    </>
  );
}

function Scene({ prog }: { prog: Prog }) {
  return (
    <>
      <color attach="background" args={["#06070a"]} />
      <fog attach="fog" args={["#06070a", 8.5, 16]} />
      <ProgressSmoother prog={prog} />
      <Lights prog={prog} />
      <StageGlow prog={prog} />
      <Phone prog={prog} />
      <Cooler prog={prog} />
      <HeatEmbers prog={prog} />
      <CameraRig prog={prog} />
      <EffectComposer>
        <Bloom intensity={0.8} luminanceThreshold={0.6} mipmapBlur radius={0.7} />
        <Noise opacity={0.035} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   OVERLAY COPY
   ════════════════════════════════════════════════════════════════════════════ */

const COPY = [
  {
    kicker: "01 — THE PROBLEM",
    title: "Heat builds fast.",
    sub: "Gaming, charging, and heavy apps push your phone into heat buildup.",
    align: "center" as const,
  },
  {
    kicker: "02 — THE ANSWER",
    title: "Cooling starts at contact.",
    sub: "Engineered to meet your phone exactly where heat concentrates.",
    align: "left" as const,
  },
  {
    kicker: "03 — INSIDE",
    title: "Four layers. One job.",
    sub: "X-frame cover. Silent blower fan. Semiconductor plate. Copper heat sheet.",
    align: "left" as const,
  },
  {
    kicker: "04 — THE TRANSFER",
    title: "Heat moves in. Cold moves through.",
    sub: "The copper sheet draws heat off your phone's back cover and hands it to the semiconductor core.",
    align: "right" as const,
  },
  {
    kicker: "05 — ACTIVATION",
    title: "Then active cooling takes over.",
    sub: "The silent fan spins up and pulls heat away — quietly, continuously.",
    align: "center" as const,
  },
] as const;

const alignClass = {
  center: "left-1/2 -translate-x-1/2 text-center items-center",
  left: "left-[7vw] text-left items-start",
  right: "right-[7vw] text-right items-end",
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */

export default function CoolingSequenceHero() {
  const section = useRef<HTMLElement>(null!);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finale = useRef<HTMLDivElement>(null!);
  const tempBadge = useRef<HTMLDivElement>(null!);
  const tempValue = useRef<HTMLSpanElement>(null!);
  const tempBar = useRef<HTMLDivElement>(null!);
  const scrollHint = useRef<HTMLDivElement>(null!);
  const railFill = useRef<HTMLDivElement>(null!);

  const prog = useRef<Prog>({ p: 0, s: 0 }).current;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const ctx = gsap.context(() => {
      const temp = { v: 42 };
      const setTemp = () => {
        const v = Math.round(temp.v);
        if (tempValue.current) tempValue.current.textContent = String(v);
        if (tempBar.current) {
          const f = (v - 24) / (46 - 24);
          tempBar.current.style.transform = `scaleX(${f})`;
          tempBar.current.style.background = v > 36 ? "#ff4d1f" : "#5fd4ff";
        }
        if (tempBadge.current) {
          tempBadge.current.dataset.state = v > 36 ? "hot" : "cool";
        }
      };
      setTemp();

      // One pinned timeline, 400vh long. tl time runs 0 → 1 with scroll.
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "+=400%",
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            prog.p = self.progress; // drives the entire Three.js scene
            if (railFill.current)
              railFill.current.style.transform = `scaleY(${self.progress})`;
          },
        },
      });

      // copy windows: [fadeInAt, fadeOutAt]
      const windows: [number, number][] = [
        [0.0, 0.15],
        [0.2, 0.29],
        [0.33, 0.46],
        [0.48, 0.75],
        [0.79, 0.87],
      ];
      copyRefs.current.forEach((el, i) => {
        if (!el) return;
        const [a, b] = windows[i];
        if (i === 0) {
          gsap.set(el, { autoAlpha: 1, y: 0 });
        } else {
          tl.fromTo(
            el,
            { autoAlpha: 0, y: 48 },
            { autoAlpha: 1, y: 0, duration: 0.035, ease: "power2.out" },
            a
          );
        }
        tl.to(el, { autoAlpha: 0, y: -40, duration: 0.03, ease: "power2.in" }, b);
      });

      // finale: headline + CTAs
      tl.fromTo(
        finale.current,
        { autoAlpha: 0, y: 56 },
        { autoAlpha: 1, y: 0, duration: 0.05, ease: "power2.out" },
        0.93
      );

      // temperature badge: hot at open, returns for the cool-down
      tl.to(tempBadge.current, { autoAlpha: 0, y: -24, duration: 0.03 }, 0.14);
      tl.to(tempBadge.current, { autoAlpha: 1, y: 0, duration: 0.03 }, 0.9);
      tl.to(temp, { v: 29, duration: 0.085, onUpdate: setTemp }, 0.905);

      // scroll hint
      tl.to(scrollHint.current, { autoAlpha: 0, duration: 0.02 }, 0.02);
    }, section);

    return () => ctx.revert();
  }, [mounted, prog]);

  return (
    <section
      ref={section}
      className="relative h-svh w-full overflow-hidden bg-[#06070a] text-white"
      aria-label="The Cooling Sequence — product story"
    >
      {/* ── Three.js stage ─────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {mounted && (
          <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 0.15, 6.3], fov: 38 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <Scene prog={prog} />
          </Canvas>
        )}
      </div>

      {/* film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── overlay UI ─────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-30">
        {/* top bar */}
        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-[7vw] py-7">
          <span className="text-sm font-semibold tracking-[0.32em] text-white/90">
            H&amp;Y
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-white/40">
            THE COOLING SEQUENCE
          </span>
        </header>

        {/* temperature readout */}
        <div
          ref={tempBadge}
          data-state="hot"
          className="group absolute right-5 top-20 w-32 rounded-xl border border-white/10 bg-white/4 p-3 backdrop-blur-md md:right-[7vw] md:top-24 md:w-44 md:rounded-2xl md:p-4"
        >
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[9px] tracking-[0.28em] text-white/45">
              SURFACE TEMP
            </span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60 group-data-[state=hot]:text-[#ff4d1f] group-data-[state=cool]:text-[#5fd4ff]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current group-data-[state=hot]:text-[#ff4d1f] group-data-[state=cool]:text-[#5fd4ff]" />
            </span>
          </div>
          <div className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums md:mt-2 md:text-3xl">
            <span ref={tempValue}>42</span>
            <span className="text-sm text-white/50 md:text-lg">°C</span>
          </div>
          <div className="mt-3 h-px w-full overflow-hidden rounded bg-white/10">
            <div
              ref={tempBar}
              className="h-full w-full origin-left transition-transform duration-150"
              style={{ background: "#ff4d1f", transform: "scaleX(0.82)" }}
            />
          </div>
          <p className="mt-2 font-mono text-[8px] tracking-[0.2em] text-white/30">
            SIMULATED DEMO
          </p>
        </div>

        {/* scene copy */}
        {COPY.map((c, i) => (
          <div
            key={c.kicker}
            ref={(el) => {
              copyRefs.current[i] = el;
            }}
            className={`invisible absolute bottom-[calc(env(safe-area-inset-bottom,0)+clamp(1rem,5svh,5rem))] flex w-[88vw] max-w-xl flex-col gap-3 opacity-0 md:bottom-[clamp(3rem,12vh,9rem)] md:gap-4 ${alignClass[c.align]}`}
          >
            <span className="font-mono text-[10px] tracking-[0.34em] text-[#5fd4ff]/80">
              {c.kicker}
            </span>
            <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              {c.title}
            </h2>
            <p className="max-w-[82vw] text-pretty text-base leading-relaxed text-white/55 md:max-w-md md:text-lg">
              {c.sub}
            </p>
          </div>
        ))}

        {/* finale + CTAs */}
        <div
          ref={finale}
          className="invisible absolute bottom-[calc(env(safe-area-inset-bottom,0)+clamp(1rem,5svh,5rem))] left-1/2 flex w-full max-w-2xl -translate-x-1/2 flex-col items-center gap-4 px-6 text-center opacity-0 md:bottom-[clamp(2.5rem,10vh,8rem)] md:gap-6"
        >
          <span className="font-mono text-[10px] tracking-[0.34em] text-[#5fd4ff]/80">
            06 — IN CONTROL
          </span>
          <h2 className="text-balance text-4xl font-semibold leading-[1.04] tracking-tight md:text-6xl">
            Snap on. Cool down.
            <br />
            <span className="bg-linear-to-r from-[#9be4ff] via-[#5fd4ff] to-[#1283c4] bg-clip-text text-transparent">
              Stay in control.
            </span>
          </h2>
          <div className="pointer-events-auto mt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#product"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
            >
              Explore the Product
            </a>
            <a
              href="#buy"
              className="rounded-full border border-[#5fd4ff]/40 bg-[#5fd4ff]/10 px-8 py-3.5 text-sm font-semibold text-[#9be4ff] backdrop-blur transition-colors duration-200 hover:bg-[#5fd4ff]/20"
            >
              Buy Now
            </a>
          </div>
        </div>

        {/* progress rail */}
        <div className="absolute right-[3vw] top-1/2 hidden h-40 w-px -translate-y-1/2 bg-white/10 md:block">
          <div
            ref={railFill}
            className="h-full w-full origin-top bg-linear-to-b from-[#ff4d1f] to-[#5fd4ff]"
            style={{ transform: "scaleY(0)" }}
          />
        </div>

        {/* scroll hint */}
        <div
          ref={scrollHint}
          className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <span className="font-mono text-[9px] tracking-[0.4em] text-white/35">
            SCROLL
          </span>
          <span className="block h-8 w-px animate-pulse bg-linear-to-b from-white/50 to-transparent" />
        </div>
      </div>
    </section>
  );
}
