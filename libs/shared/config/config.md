# @sanad/config

**Purpose:** the design-token system — the U6 root that every surface resolves color/space/type/radius from, so no app hardcodes a literal. Values are **locked from the imported Claude designs** (`docs/design/design-spec.md`). Also the home for shared tsconfig/eslint/prettier presets as they're added.

**Tags:** `scope:shared`, `type:util`. **Deps:** none (pure data).

## Concepts (`src/lib/`)

| File                 | Exports                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.ts`          | `websiteTokens` (dark signature theme, base `#05080d`), `pageAccents` (landing cyan / about teal / services sky / detail indigo / contact emerald / ambient cyan — P8.D), `landingWorlds`+`landingWorldOrder` (the 9 WEB10 worlds), `universeSystems` (P8.D one-universe: per-route star-system accent key + palette triplet + fog, WEB12), `radius`, `spacing`, `fonts` (IBM Plex Sans Arabic + Mono), `contentMaxWidth` |
| `portal-theme.ts`    | `portalDark`, `portalLight` (dual-theme CSS-var sets), `renderPortalThemeCss()`                                                                                                                                                                                                                                                                                                                                           |
| `tailwind-preset.ts` | `sanadTailwindPreset` (`TailwindPreset`) — apps spread this so utilities resolve brand tokens                                                                                                                                                                                                                                                                                                                             |

**Consumed by:** website (P8, single fixed theme WEB7), admin + client portals (P7, dark+light), via Tailwind preset + portal theme CSS.
**Events/settings:** none (brand-configurable overrides resolve at runtime later via the settings service).
**Tests:** `tokens.spec.ts` (locked values, preset shape, theme parity + render).
