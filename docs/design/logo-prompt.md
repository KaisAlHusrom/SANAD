# Sanad Tech — Logo prompt for ideogram.ai

> ✅ **SUPERSEDED — the final logo is delivered** and lives in [`logo/`](./logo/) (the cyan
> `سَنَد التقنية` wordmark). Use those files; this prompt is kept only as a historical record of
> the generation workflow.

The Claude-generated logo was discarded. Use these prompts at <https://ideogram.ai> to design the real
mark. The brand: **سَنَد التقنية (Sanad Tech)** — a premium Arabic-first software house. _"Sanad" =
support / backing / a pillar you lean on → trust, mastery, craft._ It must feel like a serious
engineering studio, not a sci-fi or crypto startup.

> ⚠️ **Arabic text in image generators is often garbled.** Recommended workflow:
>
> 1. Generate the **symbol/monogram** with Prompt A (no text, or Latin "S" only — reliable).
> 2. Set the Arabic wordmark `سَنَد التقنية` separately in real type (**IBM Plex Sans Arabic**, the
>    brand font) and lock it up beside the symbol. Don't rely on the model to spell Arabic.
> 3. If you do want the model to attempt the wordmark, use Prompt C and generate many variants, then
>    pick the one with correct letterforms — verify every glyph.
>    In ideogram: pick a **square (1:1)** for the icon, **16:9** for the lockup; set the style toward
>    **Design / Typography**, and paste the negative list into the "Exclude" field.

---

## Prompt A — Symbol / app icon (recommended, no Arabic text)

```
A minimalist geometric logo mark for a premium software engineering studio called "Sanad" (Arabic for
"support / a pillar you lean on"). The mark is an abstract symbol combining a strong vertical pillar /
support beam with a subtle upward-pointing keystone or anchor, suggesting stability and backing.
Built from precise straight lines and one elegant rotated-square (diamond) accent at the center.
Single luminous accent: cyan-to-teal gradient (#22d3ee to #2dd4bf) with a soft inner glow, on a deep
near-black background (#05080d). Flat vector, clean 2px geometric strokes, generous negative space,
hairline precision, balanced and timeless. Tech-brand quality like Linear, Vercel, Stripe — restrained
and confident. Centered, icon-only, no text.
```

## Prompt B — Monogram variant (Latin "S", reliable text)

```
A modern monogram logo for a software house, the letter "S" constructed from two interlocking
structural beams forming a pillar, with a small glowing diamond node where they meet. Geometric,
engineered, grid-based. Cyan-teal emissive gradient (#22d3ee → #2dd4bf) on near-black (#05080d), single
accent color, soft bloom. Flat vector, crisp edges, premium fintech/devtools aesthetic, lots of
breathing room. Icon only.
```

## Prompt C — Full Arabic wordmark lockup (verify every glyph)

```
A premium horizontal logo lockup for an Arabic technology company. Arabic wordmark reading
"سَنَد التقنية" in a clean contemporary Kufi/Naskh style (like IBM Plex Sans Arabic), right-to-left,
bold weight for "سَنَد" and a lighter dimmed weight for "التقنية". To its right, a small geometric pillar
symbol with a glowing diamond accent. Near-black background (#05080d), off-white text (#e7eaf0), single
cyan-teal accent (#22d3ee → #2dd4bf) with a subtle glow on the symbol only. Flat vector, elegant
spacing, corporate-grade, minimalist. Accurate Arabic letterforms.
```

---

## Direction notes (so iterations stay on-brand)

- **Concept anchors:** pillar / column / keystone / anchor / a hand under a structure ("سند" = to
  support). Avoid generic "cloud", "circuit board", or globe clichés.
- **One accent only:** cyan→teal (`#22d3ee → #2dd4bf`). No rainbow gradients, no purple/orange.
- **Background:** deep near-black `#05080d` (matches the website). Also export a version that works on
  white for the dashboards' light theme.
- **Geometry:** straight lines + a single rotated-square (diamond) accent echoes the site's motif and
  keeps the icon recognizable at 16px.
- **Must scale:** legible as a 16px favicon and a large hero mark. Test mono (single-color) too.
- **Deliverables to ask ideogram for / recreate in vector:** square icon, horizontal lockup, mono
  (white) and mono (black) versions, and the accent-on-dark primary.

## Negative prompt / exclude

```
no 3D render, no glossy bevels, no drop shadows, no photorealism, no mascots, no human faces, no globe,
no circuit-board texture, no gears, no generic cloud icon, no stock swoosh, no lens flare, no neon
cyberpunk, no sci-fi HUD, no busy detail, no rainbow gradient, no garbled or misspelled Arabic letters,
no extra text, no watermark, not crowded.
```
