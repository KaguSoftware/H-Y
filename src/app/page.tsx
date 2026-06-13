import Link from "next/link";
import ParticleField from "@/components/ParticleField";

/**
 * Home — the discovery of the cooling TECHNOLOGY (the product lives at /product).
 * Full-width framed glass panels on near-black; a floating pill navbar; wide
 * Michroma display type; dither markers; ice (#5fd4ff) as the single accent.
 * The hero visual is a canvas particle field (ParticleField): many crisp
 * cold particles whose density forms the blue glow, with a constellation mesh;
 * the cluster nearest the pointer magnets to it and follows. Three pillar cards
 * (Absorb / Pump / Exhaust) carry distinct mini-visualisations. Claims trace
 * to the spec PDF.
 */

function Panel({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden rounded-[26px] border border-white/10 bg-[#090c12]/55 backdrop-blur-2xl ${className}`}
    >
      {children}
    </section>
  );
}

function Stat({
  value,
  label,
  accent = false,
  className = "",
}: {
  value: string;
  label: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative flex flex-col justify-between p-8 sm:p-10 ${className}`}>
      <span className="checker self-end" />
      <div className="mt-12">
        <p
          className={`font-display text-5xl leading-none sm:text-6xl ${
            accent ? "text-[#5fd4ff]" : "text-white"
          }`}
        >
          {value}
        </p>
        <div className="mt-5 h-px w-16 bg-white/25" />
        <p className="mt-4 max-w-[24ch] text-sm leading-relaxed text-white/55">
          {label}
        </p>
      </div>
    </div>
  );
}

/* ── small icons ─────────────────────────────────────────────────────────── */
function Snowflake({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 2v20M3.6 7l16.8 10M20.4 7L3.6 17" />
    </svg>
  );
}
function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* ── hero-only animated backdrop: a blue gradient built from many particles ── */
function HeroAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* near-black base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 118%, rgba(13,67,102,0.20), transparent 72%)," +
            "linear-gradient(180deg, #04060a 0%, #05080f 55%, #04060b 100%)",
        }}
      />

      {/* particles + their glow are both drawn in the canvas, so the glow
          sits directly behind the points and drifts together with them */}
      <ParticleField />
    </div>
  );
}

/* ── three pillar cards, each with a distinct mini-visualisation ─────────── */
function PillarCard({
  step,
  icon,
  title,
  body,
  children,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      <span className="checker absolute right-5 top-5" />
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#5fd4ff]/12 text-[#5fd4ff] ring-1 ring-[#5fd4ff]/25">
          {icon}
        </span>
        <div>
          <p className="font-mono text-[9px] tracking-[0.24em] text-white/35">
            {step}
          </p>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-white/55">{body}</p>
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}

/* heat sources converging into a cold contact node */
function AbsorbViz() {
  const ys = [30, 75, 120];
  return (
    <svg viewBox="0 0 300 150" className="w-full" aria-hidden>
      {ys.map((y, i) => (
        <path
          key={i}
          d={`M 56 ${y} C 120 ${y}, 150 75, 214 75`}
          fill="none"
          stroke="#5fd4ff"
          strokeOpacity="0.5"
          strokeWidth="1.2"
          strokeDasharray="3 5"
          className="heat-flow"
        />
      ))}
      {ys.map((y, i) => (
        <g key={i} stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" fill="none">
          <rect x="22" y={y - 15} width="34" height="30" rx="8" fill="#10141b" stroke="#ffffff" strokeOpacity="0.12" />
          {i === 0 && (
            <>
              <rect x="34" y={y - 8} width="10" height="16" rx="2" />
              <line x1="36.5" y1={y + 5} x2="41.5" y2={y + 5} />
            </>
          )}
          {i === 1 && (
            <>
              <rect x="34" y={y - 6} width="11" height="12" rx="1.5" />
              <line x1="37" y1={y - 9} x2="37" y2={y - 6} />
              <line x1="42" y1={y - 9} x2="42" y2={y - 6} />
              <line x1="37" y1={y + 6} x2="37" y2={y + 9} />
              <line x1="42" y1={y + 6} x2="42" y2={y + 9} />
            </>
          )}
          {i === 2 && (
            <>
              <rect x="34" y={y - 7} width="11" height="14" rx="2" />
              <line x1="37.5" y1={y - 9} x2="41.5" y2={y - 9} />
            </>
          )}
        </g>
      ))}
      <circle cx="214" cy="75" r="34" fill="#5fd4ff" opacity="0.12" />
      <rect x="194" y="55" width="40" height="40" rx="11" fill="#0a0d13" stroke="#5fd4ff" strokeOpacity="0.5" />
      <g transform="translate(214 75)" stroke="#5fd4ff" strokeWidth="1.5" strokeLinecap="round">
        <line x1="0" y1="-9" x2="0" y2="9" />
        <line x1="-8" y1="-4.5" x2="8" y2="4.5" />
        <line x1="8" y1="-4.5" x2="-8" y2="4.5" />
      </g>
    </svg>
  );
}

/* temperature dropping across the junction, with a -6 °C readout */
function PumpViz() {
  return (
    <svg viewBox="0 0 300 150" className="w-full" aria-hidden>
      <defs>
        <linearGradient id="cool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fd4ff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#5fd4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[40, 75, 110].map((y) => (
        <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#ffffff" strokeOpacity="0.05" />
      ))}
      <path d="M0 38 C 60 42, 92 58, 138 70 S 224 120, 286 126 L 286 150 L 0 150 Z" fill="url(#cool)" />
      <path d="M0 38 C 60 42, 92 58, 138 70 S 224 120, 286 126" fill="none" stroke="#5fd4ff" strokeWidth="1.8" />
      <circle cx="286" cy="126" r="11" fill="#5fd4ff" opacity="0.2" />
      <circle cx="286" cy="126" r="3.6" fill="#5fd4ff" />
      <g>
        <rect x="222" y="94" width="58" height="22" rx="6" fill="#0b0f15" stroke="#5fd4ff" strokeOpacity="0.4" />
        <text x="251" y="109" textAnchor="middle" fill="#5fd4ff" fontSize="12" className="font-mono">
          -6 °C
        </text>
      </g>
    </svg>
  );
}

/* heat thrown off the sink, radar-style airflow rings around the fan */
function ExhaustViz() {
  const dots = [20, 95, 160, 250, 310];
  return (
    <svg viewBox="0 0 300 150" className="w-full" aria-hidden>
      <g transform="translate(150 76)">
        {[66, 47, 29].map((r, i) => (
          <circle key={r} r={r} fill="none" stroke="#5fd4ff" strokeOpacity={0.1 + i * 0.04} strokeWidth="1" />
        ))}
        {dots.map((a) => {
          const rad = (a * Math.PI) / 180;
          return <circle key={a} cx={Math.cos(rad) * 66} cy={Math.sin(rad) * 66} r="2.4" fill="#5fd4ff" opacity="0.8" />;
        })}
        <circle r="22" fill="#5fd4ff" opacity="0.12" />
        <circle r="15" fill="#0a0d13" stroke="#5fd4ff" strokeOpacity="0.5" />
        <g stroke="#5fd4ff" strokeWidth="1.4" strokeLinecap="round">
          <line x1="0" y1="-8" x2="0" y2="8" />
          <line x1="-7" y1="-4" x2="7" y2="4" />
          <line x1="7" y1="-4" x2="-7" y2="4" />
        </g>
      </g>
    </svg>
  );
}

/* ── Peltier junction: phone on top, heat pumped down and out ───────────── */
function PeltierDiagram() {
  const pillars = Array.from({ length: 7 }, (_, i) => ({
    x: 92 + i * 54,
    n: i % 2 === 0,
  }));
  return (
    <svg
      viewBox="0 0 560 380"
      role="img"
      aria-label="Diagram of the cooling stack: heat leaves the phone's back cover through a copper sheet into the cold face of a semiconductor element, is pumped to the hot face, and is exhausted through a finned heat sink by the fan."
      className="w-full max-w-[560px]"
    >
      <rect x="60" y="18" width="440" height="30" rx="6" fill="#2b303c" />
      <text x="280" y="38" textAnchor="middle" className="fill-white/55 font-mono" fontSize="10" letterSpacing="2">
        PHONE BACK COVER
      </text>

      {[150, 280, 410].map((x) => (
        <line key={x} x1={x} y1={52} x2={x} y2={94} stroke="#8a8088" strokeWidth="2" className="heat-flow" opacity="0.85" />
      ))}

      <rect x="72" y="96" width="416" height="11" rx="2" fill="#9b8b7e" />
      <text x="500" y="105" className="fill-[#9b8b7e] font-mono" fontSize="9" letterSpacing="1">
        COPPER
      </text>

      <rect x="72" y="112" width="416" height="14" rx="2" fill="#1283c4" />
      <text x="60" y="123" textAnchor="end" className="fill-[#5fd4ff] font-mono" fontSize="9" letterSpacing="1">
        COLD FACE -6°C
      </text>

      {pillars.map(({ x, n }) => (
        <g key={x}>
          <rect x={x} y={130} width="28" height="52" rx="2" fill={n ? "#3a4252" : "#4a4650"} />
          <text x={x + 14} y={161} textAnchor="middle" className="fill-white/50 font-mono" fontSize="9">
            {n ? "N" : "P"}
          </text>
        </g>
      ))}

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

      <rect x="72" y="216" width="416" height="14" rx="2" fill="#4a4248" />
      <text x="60" y="227" textAnchor="end" className="fill-white/55 font-mono" fontSize="9" letterSpacing="1">
        HOT FACE
      </text>

      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={88 + i * 30} y={238} width="12" height="58" rx="2" fill="#2b303c" />
      ))}
      <text x="280" y="316" textAnchor="middle" className="fill-white/50 font-mono" fontSize="9" letterSpacing="2">
        BCT-COATED HEAT SINK
      </text>

      {[
        { x1: 96, x2: 26 },
        { x1: 464, x2: 534 },
      ].map(({ x1, x2 }) => (
        <g key={x1}>
          <line x1={x1} y1={266} x2={x2} y2={266} stroke="#8a8088" strokeWidth="2" className="heat-flow" opacity="0.75" />
          <line x1={x1} y1={282} x2={x2} y2={282} stroke="#8a8088" strokeWidth="2" className="heat-flow" opacity="0.45" />
        </g>
      ))}
      <text x="280" y="352" textAnchor="middle" className="fill-white/40 font-mono" fontSize="9" letterSpacing="2">
        7-BLADE FAN EXHAUST
      </text>
    </svg>
  );
}

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

// the technology itself, distilled — physics and materials, not product logistics
const TECH: [string, string][] = [
  ["Method", "Semiconductor heat pump (Peltier effect)"],
  ["Cold-side reach", "Down to -6 °C at the contact plate"],
  ["Heat path", "Copper-alloy spreader into a BCT-coated heat sink"],
  ["Exhaust", "Quiet 7-blade fan, automatic speed control"],
  ["Drive", "DC 5 V — no refrigerant, no compressor, no moving liquid"],
];

export default function Home() {
  return (
    <main className="relative min-h-screen min-w-0 overflow-x-clip bg-[#04060a] px-3 pb-10 pt-3 text-white sm:px-5 sm:pt-5">
      <div className="relative z-10 mx-auto w-full">
        {/* floating pill navbar */}
        <nav className="sticky top-3 z-50 mb-4">
          <div className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-xl sm:px-4">
            <Link href="/" className="flex items-center gap-2.5 pl-1.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5fd4ff]/15 ring-1 ring-[#5fd4ff]/30">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#5fd4ff" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M12 2v20M3.6 7l16.8 10M20.4 7L3.6 17" />
                </svg>
              </span>
              <span className="font-display text-sm tracking-wide">
                H<span className="text-[#c8102e]">&amp;</span>Y
              </span>
            </Link>

            <div className="hidden items-center gap-7 md:flex">
              {[
                ["The problem", "#problem"],
                ["How it works", "#peltier"],
                ["The stack", "#stack"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-white/65 transition-colors hover:text-white"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/product"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.04]"
              >
                <span className="sm:hidden">Product →</span>
                <span className="hidden sm:inline">Explore the product →</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="space-y-4">
          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <Panel className="isolate flex min-h-[86svh] flex-col">
            <HeroAtmosphere />

            {/* empty space — the particle field carries the hero visual */}
            <div className="flex-1" />

            <div className="px-6 pb-12 sm:px-10">
              <div className="flex items-center gap-4">
                <span className="checker" />
                <div className="h-px flex-1 bg-white/12" />
                <span className="checker" />
              </div>
              <h1 className="font-display mt-7 text-[1.9rem] leading-none sm:text-5xl md:text-7xl">
                COLD IS A
                <br />
                TECHNOLOGY
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-white/55">
                A semiconductor heat pump, a copper spreader, and a silent fan:
                the physics that lets a phone shed the heat it makes faster than
                it can throttle.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-5">
                <a
                  href="#peltier"
                  className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.04]"
                >
                  See how it works →
                </a>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {["No refrigerant", "No compressor", "No moving liquid"].map(
                    (t) => (
                      <span
                        key={t}
                        className="flex items-center gap-2 text-xs text-white/45"
                      >
                        <Check className="h-3.5 w-3.5 text-[#5fd4ff]" />
                        {t}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* ── THREE PILLARS (heat's one-way path, with mini-visuals) ────── */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PillarCard
              step="01 · CONTACT"
              icon={<Snowflake className="h-5 w-5" />}
              title="Absorb"
              body="A copper-alloy plate meets the hottest point of the back glass and pulls heat off it evenly, not just at one spot."
            >
              <AbsorbViz />
            </PillarCard>
            <PillarCard
              step="02 · PUMP"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              }
              title="Pump"
              body="A semiconductor junction drives that heat across itself, holding the contact side as low as -6 °C on five volts of DC."
            >
              <PumpViz />
            </PillarCard>
            <PillarCard
              step="03 · EXHAUST"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="2.4" />
                  <path d="M12 9.6c2-4 6-4 6-1 0 2.4-3.4 2.4-6 3.4M12 14.4c-2 4-6 4-6 1 0-2.4 3.4-2.4 6-3.4" />
                </svg>
              }
              title="Exhaust"
              body="A quiet 7-blade fan lifts the heat off the BCT-coated sink and throws it out through the side vents."
            >
              <ExhaustViz />
            </PillarCard>
          </section>

          {/* ── PROBLEM + CAPABILITY ──────────────────────────────────────── */}
          <Panel className="scroll-mt-20" id="problem">
            <div className="grid lg:grid-cols-2">
              <div className="relative overflow-hidden p-8 sm:p-12">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-24 top-4 h-72 w-72 rounded-full border border-white/[0.07]"
                />
                <h2 className="font-display text-2xl leading-[1.1] sm:text-3xl md:text-4xl">
                  HEAT IS
                  <br />
                  THE THROTTLE
                </h2>
                <p className="mt-8 max-w-md text-pretty text-sm leading-relaxed text-white/55">
                  Silicon slows down as it heats up. A long gaming session,
                  fast charging, or 4K capture pushes the chip past its comfort
                  zone and the system quietly pulls clock speeds: dropped
                  frames, slower charging, a hand-warmer in your palm. A case
                  traps that heat; blowing air at the outside barely touches
                  it. The heat has to be pumped out of the device, and that
                  takes a different kind of physics.
                </p>
              </div>

              <div className="grid border-t border-white/10 sm:grid-cols-2 lg:border-l lg:border-t-0">
                <Stat
                  value="-6°C"
                  label="contact-plate temperature, far below anything passive cooling reaches"
                  accent
                  className="bg-white/[0.03]"
                />
                <Stat
                  value="5V"
                  label="of direct current pumps the heat across the junction, no refrigerant or compressor anywhere in the loop"
                  className="border-t border-white/10 bg-white/[0.05] sm:border-l sm:border-t-0"
                />
              </div>
            </div>
          </Panel>

          {/* ── THE PELTIER EFFECT ────────────────────────────────────────── */}
          <Panel className="scroll-mt-20" id="peltier">
            <div className="grid items-center gap-4 lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <p className="font-mono text-[10px] tracking-[0.3em] text-[#5fd4ff]/80">
                  THE PELTIER EFFECT
                </p>
                <h2 className="font-display mt-5 text-2xl leading-[1.1] sm:text-3xl md:text-4xl">
                  ELECTRICITY IN.
                  <br />
                  HEAT OUT.
                </h2>
                <p className="mt-8 max-w-md text-pretty text-sm leading-relaxed text-white/55">
                  Run a direct current through a junction of paired
                  semiconductors and it physically carries heat from one face
                  to the other. No refrigerant, no compressor. The cold face
                  presses against your phone and pulls heat in; the hot face
                  hands it to the heat sink, where the fan throws it away. Feed
                  it five volts and one side simply becomes cold.
                </p>
              </div>
              <div className="border-t border-white/10 p-8 sm:p-12 lg:border-l lg:border-t-0">
                <PeltierDiagram />
              </div>
            </div>
          </Panel>

          {/* ── THE STACK ─────────────────────────────────────────────────── */}
          <Panel className="scroll-mt-20" id="stack">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="relative overflow-hidden p-8 sm:p-12">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full border border-white/[0.07]"
                />
                <h2 className="font-display text-2xl leading-[1.1] sm:text-3xl md:text-4xl">
                  FOUR LAYERS
                  <br />
                  ONE DIRECTION
                </h2>
                <p className="mt-8 max-w-sm text-pretty text-sm leading-relaxed text-white/55">
                  Heat only ever travels one way through the cooler: off the
                  phone, into the copper, across the junction, and out through
                  the fins.
                </p>
              </div>

              <div className="border-t border-white/10 lg:border-l lg:border-t-0">
                {STACK.map(({ n, name, body }, i) => (
                  <div
                    key={n}
                    className="relative grid grid-cols-[72px_1fr] border-b border-white/10 last:border-b-0"
                  >
                    <div
                      className="flex items-start justify-center pt-6"
                      style={{
                        background: `rgba(255,255,255,${0.07 - i * 0.014})`,
                      }}
                    >
                      <span className="font-display text-sm text-white/80">
                        {n}
                      </span>
                    </div>
                    <div className="p-6">
                      {i % 2 === 0 && (
                        <span className="checker absolute right-5 top-5" />
                      )}
                      <h3 className="text-base font-semibold tracking-tight">
                        {name}
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* ── FROM TECHNOLOGY TO DEVICE (bridge to the product) ─────────── */}
          <Panel className="scroll-mt-20" id="device">
            <div className="p-8 sm:p-12">
              <div className="max-w-2xl">
                <p className="font-mono text-[10px] tracking-[0.3em] text-[#5fd4ff]/80">
                  THE DISCOVERY, ENGINEERED
                </p>
                <h2 className="font-display mt-5 text-2xl leading-[1.1] sm:text-3xl md:text-4xl">
                  FROM A MATERIAL
                  <br />
                  TO A DEVICE
                </h2>
                <p className="mt-8 text-pretty text-sm leading-relaxed text-white/55">
                  This is the technology, not the gadget. The same semiconductor
                  junction, copper spreader, and BCT-coated sink you have just
                  followed were engineered into one object small enough to ride
                  on the back of a phone. That object is where the physics meets
                  your hand.
                </p>
              </div>

              <dl className="mt-14 max-w-3xl">
                {TECH.map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[140px_1fr] gap-6 border-t border-white/10 py-4 last:border-b sm:grid-cols-[220px_1fr]"
                  >
                    <dt className="font-mono text-[10px] uppercase leading-6 tracking-[0.22em] text-white/40">
                      {k}
                    </dt>
                    <dd className="text-sm leading-6 text-white/75">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-14">
                <Link
                  href="/product"
                  className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.04]"
                >
                  Meet the product →
                </Link>
              </div>
            </div>
          </Panel>
        </div>

        <footer className="mt-6 flex items-center gap-4 px-2">
          <span className="font-mono text-[10px] tracking-[0.22em] text-white/35">
            H&amp;Y · ACTIVE THERMAL TECHNOLOGY
          </span>
          <div className="h-px flex-1 bg-white/10" />
          <span className="checker" />
        </footer>
      </div>
    </main>
  );
}
