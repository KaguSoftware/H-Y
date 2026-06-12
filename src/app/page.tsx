import Image from "next/image";
import Link from "next/link";

/**
 * Home — the technology page.
 * Reads like H&Y's thermal-engineering dossier: the page starts ember-warm
 * (the heat problem) and cools to ice as the stack solves it. All product
 * claims trace to public/MOBILE PHONE COOLER.pdf.
 */

/* ── Peltier junction diagram: phone on top, heat pumped down and out ───── */
function PeltierDiagram() {
  // alternating p/n semiconductor pillars between the two ceramic faces
  const pillars = Array.from({ length: 7 }, (_, i) => ({
    x: 92 + i * 54,
    n: i % 2 === 0,
  }));
  return (
    <svg
      viewBox="0 0 560 380"
      role="img"
      aria-label="Diagram of the Peltier cooling stack: heat leaves the phone's back cover through a copper sheet into the cold face of a semiconductor element, is pumped to the hot face, and is exhausted through a finned heat sink by the fan."
      className="w-full max-w-[560px]"
    >
      {/* phone back cover */}
      <rect x="60" y="18" width="440" height="30" rx="6" fill="#2b303c" />
      <text x="280" y="38" textAnchor="middle" className="fill-white/60 font-mono" fontSize="10" letterSpacing="2">
        PHONE BACK COVER
      </text>

      {/* heat drawn out of the phone */}
      {[150, 280, 410].map((x) => (
        <line key={x} x1={x} y1={52} x2={x} y2={94} stroke="#ff4d1f" strokeWidth="2" className="heat-flow" opacity="0.8" />
      ))}

      {/* copper heat sheet */}
      <rect x="72" y="96" width="416" height="11" rx="2" fill="#c97b4a" />
      <text x="500" y="105" className="fill-[#c97b4a] font-mono" fontSize="9" letterSpacing="1">
        COPPER
      </text>

      {/* cold ceramic face */}
      <rect x="72" y="112" width="416" height="14" rx="2" fill="#1283c4" />
      <text x="60" y="123" textAnchor="end" className="fill-[#5fd4ff] font-mono" fontSize="9" letterSpacing="1">
        COLD FACE -6°C
      </text>

      {/* semiconductor pillars */}
      {pillars.map(({ x, n }) => (
        <g key={x}>
          <rect x={x} y={130} width="28" height="52" rx="2" fill={n ? "#1d4d70" : "#3a4252"} />
          <text x={x + 14} y={161} textAnchor="middle" className="fill-white/50 font-mono" fontSize="9">
            {n ? "N" : "P"}
          </text>
        </g>
      ))}

      {/* DC current snaking through the junction */}
      <path
        d={[
          "M 64 188",
          ...pillars.map(({ x }, i) =>
            i % 2 === 0 ? `L ${x + 14} 188 L ${x + 14} 124` : `L ${x + 14} 124 L ${x + 14} 188`,
          ),
          "L 496 188",
        ].join(" ")}
        fill="none"
        stroke="#5fd4ff"
        strokeWidth="1.5"
        className="current-flow"
        opacity="0.9"
      />
      <text x="280" y="208" textAnchor="middle" className="fill-[#5fd4ff]/70 font-mono" fontSize="9" letterSpacing="2">
        DC 5V CURRENT
      </text>

      {/* hot ceramic face */}
      <rect x="72" y="216" width="416" height="14" rx="2" fill="#7a2b14" />
      <text x="60" y="227" textAnchor="end" className="fill-[#ff4d1f]/80 font-mono" fontSize="9" letterSpacing="1">
        HOT FACE
      </text>

      {/* BCT-coated heat sink fins */}
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={88 + i * 30} y={238} width="12" height="58" rx="2" fill="#2b303c" />
      ))}
      <text x="280" y="316" textAnchor="middle" className="fill-white/50 font-mono" fontSize="9" letterSpacing="2">
        BCT-COATED HEAT SINK
      </text>

      {/* fan exhaust, out both sides */}
      {[
        { x1: 96, x2: 26 },
        { x1: 464, x2: 534 },
      ].map(({ x1, x2 }) => (
        <g key={x1}>
          <line x1={x1} y1={266} x2={x2} y2={266} stroke="#ff4d1f" strokeWidth="2" className="heat-flow" opacity="0.7" />
          <line x1={x1} y1={282} x2={x2} y2={282} stroke="#ff4d1f" strokeWidth="2" className="heat-flow" opacity="0.45" />
        </g>
      ))}
      <text x="280" y="352" textAnchor="middle" className="fill-white/40 font-mono" fontSize="9" letterSpacing="2">
        7-BLADE FAN EXHAUST
      </text>
    </svg>
  );
}

/* ── the four layers of the stack, in heat-flow order ────────────────────── */
const STACK = [
  {
    n: "01",
    name: "Copper heat sheet",
    body: "A copper-alloy sheet sits flush against the back cover and spreads heat evenly into the cold plate, so the whole junction works, not just a hotspot.",
  },
  {
    n: "02",
    name: "Semiconductor cooler",
    body: "The Peltier element pumps that heat across the junction and holds its contact side as low as -6 °C, far below anything passive cooling can reach.",
  },
  {
    n: "03",
    name: "BCT heat-sink coating",
    body: "The hot face hands everything to a heat sink whose BCT coating is engineered for fast dissipation into the airstream.",
  },
  {
    n: "04",
    name: "Silent 7-blade fan",
    body: "Seven blades tuned for maximum airflow with minimal noise carry the heat out through the side vents. You hear your game, not the fan.",
  },
];

const SPECS: [string, string][] = [
  ["Cooling", "Semiconductor heat sink (Peltier effect)"],
  ["Contact plate", "Down to -6 °C"],
  ["Fan", "Quiet 7-blade, automatic speed and temperature control"],
  ["Display", "Onboard digital temperature readout"],
  ["Materials", "PC, copper alloy, silicone"],
  ["Power", "DC 5 V / 1.5 A, USB-C cable included"],
  ["Weight", "Approx. 145 g"],
  ["Fit", "Clamps onto 67-88 mm wide phones, silicone padded"],
  ["Colors", "Black, white, blue, red"],
];

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-[#06070a] text-white">
      {/* nav */}
      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight">
          H<span className="text-[#c8102e]">&amp;</span>Y
        </span>
        <Link
          href="/product"
          className="font-mono text-[11px] tracking-[0.22em] text-white/60 transition-colors hover:text-white"
        >
          THE PRODUCT →
        </Link>
      </header>

      {/* ── hero: the problem is warm, the promise is cold ─────────────────── */}
      <section className="relative mx-auto grid min-h-[92svh] w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-32 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ember glow bleeding in from the top, ice waiting below */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/4 h-[480px] w-[640px] rounded-full bg-[#ff4d1f]/[0.07] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-0 h-[420px] w-[560px] rounded-full bg-[#5fd4ff]/[0.06] blur-3xl"
        />

        <div className="relative">
          <p className="rise font-mono text-[10px] tracking-[0.34em] text-[#5fd4ff]/80">
            H&amp;Y · THERMAL ENGINEERING
          </p>
          <h1 className="rise rise-2 mt-6 text-balance text-5xl font-semibold leading-[1.04] tracking-tight md:text-7xl">
            Cold is a technology.
          </h1>
          <p className="rise rise-3 mt-7 max-w-xl text-pretty text-lg leading-relaxed text-white/55">
            Modern phones throttle the moment they run hot. The H&amp;Y cooler
            pumps heat out through a semiconductor stack whose contact plate
            reaches minus six degrees Celsius, so your phone keeps its peak.
          </p>
          <div className="rise rise-4 mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/product"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.04]"
            >
              See the product
            </Link>
            <a
              href="#peltier"
              className="font-mono text-[11px] tracking-[0.22em] text-white/50 transition-colors hover:text-[#5fd4ff]"
            >
              HOW IT WORKS ↓
            </a>
          </div>
        </div>

        <div className="rise rise-3 relative hidden lg:block">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-[#5fd4ff]/[0.05] blur-2xl"
          />
          <Image
            src="/phone_cooler_overview_transparent.png"
            alt="The H&Y mobile phone cooler with its USB-C cable and silicone pads, beside the black, blue, and red colorways"
            width={2556}
            height={1179}
            priority
            className="w-full"
          />
          <p className="mt-4 text-right font-mono text-[10px] tracking-[0.28em] text-white/40">
            CONTACT PLATE <span className="text-[#5fd4ff]">-6 °C</span>
          </p>
        </div>
      </section>

      {/* ── 01 · the problem ───────────────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-10 h-[360px] w-[480px] rounded-full bg-[#ff4d1f]/[0.05] blur-3xl"
        />
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] tracking-[0.34em] text-[#ff4d1f]/80">
            01 · THE PROBLEM
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
            Heat is the throttle.
          </h2>
          <p className="mt-6 text-pretty leading-relaxed text-white/55">
            Silicon slows down as it heats up. A long gaming session, fast
            charging, or 4K capture pushes the chip past its comfort zone and
            the operating system quietly pulls clock speeds: dropped frames,
            slower charging, a hand-warmer in your palm. A case traps that
            heat. Blowing air at the outside barely touches it. The heat has
            to be actively pumped out of the device, and that takes a
            different kind of physics.
          </p>
        </div>
      </section>

      {/* ── 02 · the peltier effect ────────────────────────────────────────── */}
      <section
        id="peltier"
        className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 py-28 lg:grid-cols-2"
      >
        <div>
          <p className="font-mono text-[10px] tracking-[0.34em] text-[#5fd4ff]/80">
            02 · THE PELTIER EFFECT
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
            Electricity in. Heat out.
          </h2>
          <p className="mt-6 text-pretty leading-relaxed text-white/55">
            Run a direct current through a junction of paired semiconductors
            and it physically carries heat from one face to the other. No
            refrigerant, no compressor, nothing to wear out in the element
            itself. The cold face presses against your phone and pulls heat
            in; the hot face hands it to the heat sink, where the fan throws
            it away. Feed it five volts and one side simply becomes cold.
          </p>
        </div>
        <PeltierDiagram />
      </section>

      {/* ── 03 · the stack ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/3 top-1/3 h-[400px] w-[560px] rounded-full bg-[#5fd4ff]/[0.05] blur-3xl"
        />
        <p className="font-mono text-[10px] tracking-[0.34em] text-[#5fd4ff]/80">
          03 · THE STACK
        </p>
        <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
          Four layers, one direction.
        </h2>

        <Image
          src="/phone_cooler_exploded_transparent.png"
          alt="Exploded view of the cooler: copper sheet, semiconductor element, fan assembly, and the X-frame front cover"
          width={1536}
          height={709}
          className="mx-auto mt-14 w-full max-w-4xl"
        />

        <div className="mt-12 grid gap-x-16 lg:grid-cols-2">
          {STACK.map(({ n, name, body }) => (
            <div key={n} className="flex gap-6 border-t border-white/10 py-7">
              <span className="font-mono text-[11px] leading-7 text-[#5fd4ff]/70">{n}</span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 04 · control ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] tracking-[0.34em] text-[#5fd4ff]/80">
            04 · CONTROL
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
            It thinks about temperature so you don&apos;t.
          </h2>
          <p className="mt-6 text-pretty leading-relaxed text-white/55">
            An onboard digital display reads out live temperature while fan
            speed adjusts itself automatically to the heat it finds. Flick the
            switch to OFF, AUTO, or TURBO and plug into any USB-C source at
            DC 5 V / 1.5 A: a power bank in your pocket works as well as a
            wall charger.
          </p>
        </div>

        {/* spec sheet */}
        <dl className="mt-16 max-w-3xl">
          {SPECS.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-[140px_1fr] gap-6 border-t border-white/10 py-4 last:border-b sm:grid-cols-[200px_1fr]"
            >
              <dt className="font-mono text-[10px] uppercase leading-6 tracking-[0.22em] text-white/40">
                {k}
              </dt>
              <dd className="text-sm leading-6 text-white/75">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── closing CTA ────────────────────────────────────────────────────── */}
      <section className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-6 pb-36 pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/4 h-[320px] w-[640px] rounded-full bg-[#5fd4ff]/[0.07] blur-3xl"
        />
        <h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          Now watch it take the heat.
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/product"
            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.04]"
          >
            Explore the product
          </Link>
          <Link
            href="/product#buy"
            className="font-mono text-[11px] tracking-[0.22em] text-white/50 transition-colors hover:text-[#5fd4ff]"
          >
            BUY NOW →
          </Link>
        </div>
      </section>
    </main>
  );
}
