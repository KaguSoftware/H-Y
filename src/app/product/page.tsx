import type { Metadata } from "next";
import CoolingSequenceHero from "@/components/CoolingSequenceHero";

export const metadata: Metadata = {
  title: "Product — H&Y Mobile Phone Cooler",
  description:
    "Snap on. Cool down. Stay in control. The H&Y mobile phone cooler: semiconductor cooling, copper heat sheet, and a silent 7-blade fan.",
};

export default function ProductPage() {
  return (
    <main className="bg-[#06070a] text-white">
      {/* Pinned, scroll-driven Three.js hero (≈400vh of scroll) */}
      <CoolingSequenceHero />

      {/* ── Content below the sequence — replace with the real product page ── */}
      <section
        id="product"
        className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col items-center justify-center gap-6 px-6 py-32 text-center"
      >
        <span className="font-mono text-[10px] tracking-[0.34em] text-[#5fd4ff]/80">
          THE H&amp;Y MOBILE PHONE COOLER
        </span>
        <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Built for the moments your phone works hardest.
        </h2>
        <p className="max-w-xl text-pretty text-white/55">
          Semiconductor cooling, a copper heat sheet, and a silent 7-blade fan —
          in a 145&nbsp;g snap-on shell that fits phones from 67 to 88&nbsp;mm
          wide. USB-C powered, with automatic speed and temperature control.
        </p>
        <a
          id="buy"
          href="#"
          className="mt-4 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.04]"
        >
          Buy Now
        </a>
      </section>
    </main>
  );
}
