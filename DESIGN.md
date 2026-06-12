# Design

## Theme

Dark stage, matching the Three.js hero: a near-black blue-tinted void where the product and diagrams are lit like objects in a lab. Light theme is never used.

## Color

- Background: `#06070a` (stage black, blue-tinted)
- Foreground: `#f4f6f9`
- Ice (cold, solution, accent): `#5fd4ff`, deep variant `#1283c4`
- Ember (heat, problem): `#ff4d1f`
- Gunmetal (device body, panels): `#2b303c`
- Brand red (logo accents only, sparingly): `#c8102e`
- Muted text: white at 55-70% opacity

Strategy: committed dark monochrome with a two-pole accent system. Ember and ice are semantic (hot vs cold), not decorative; sections shift from ember-tinted glows to ice-tinted glows as the narrative moves from problem to solution.

## Typography

- Sans: Geist (`--font-geist-sans`), used for headlines and body.
- Mono: Geist Mono (`--font-geist-mono`), used for technical labels, spec values, kickers with wide tracking (`tracking-[0.3em]` range, 10-11px).
- Headlines: tight tracking, semibold, large scale (text-4xl to text-7xl, fluid).

## Components & Patterns

- Kicker label: mono, 10px, 0.3em+ tracking, ice at ~80% opacity.
- Primary CTA: white pill button, black text, subtle scale on hover.
- Spec rows: mono values, hairline `white/10` dividers, no cards.
- Diagrams: thin-stroke SVG on the stage, ice/ember semantic strokes.
- Imagery: product renders in `public/` (`phone_cooler_exploded_transparent.png`, `_overview_`, `_renders_`).

## Motion

- Scroll-driven 3D sequence on `/product` (GSAP ScrollTrigger + R3F).
- Elsewhere: CSS-only staged reveals, ease-out, wrapped in `motion-safe:`.
- Smooth scrolling enabled globally.
