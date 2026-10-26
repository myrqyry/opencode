# Colorway → OpenCode Desktop color conversion

**Source of truth:** `~/loam/colorway/themes/Colorway.obt` supplies inherited
roles and `Colorway-*.ovt` supplies the selected palette. Run from
`packages/ui` with `bun run script/sync-colorway-themes.ts --check`, or
without `--check` to reconcile generated desktop themes and registry entries.

The adapter in `src/theme/colorway-conversion.ts` resolves *active* OBS color
aliases rather than comment snapshots. It rejects unresolved color roles and
cycles, but ignores OBS runtime-only references such as `--obsFontScale`.

| OpenCode palette role | Colorway source |
| --- | --- |
| neutral | `--bg_window` |
| ink | `--text` |
| primary | `--primary` |
| accent | `--primary_lighter` |
| success | `--success`, otherwise inherited base `#37d247` |
| warning | `--warning` |
| error | `--danger` |
| info | `--primary_light` |

In particular, **`--primary_dark` is an accent, not a success signal**.
The dark variant carries explicit `background-base` and `text-base` overrides
so OpenCode's neutral-scale resolver doesn't inadvertently darken the authored
OBS background or replace its foreground. Other surfaces still use OpenCode's
native palette-derived scale; this is not pixel-level parity with OBS.

Source Colorway themes are single-mode. The paired OpenCode light palettes
remain *derived adaptations*: related hues, a pale neutral, dark ink, and
contrast-refined accent seeds. Every generated light accent seed is checked
against its light background at a minimum **4.5:1** ratio *after sRGB
quantization*. This does not assert every rendered UI pair has that contrast.

Existing theme identity wins over new slug generation so legacy names like
"EarthBound — Dusty Dunes" continue using `dusty-dunes` and vendor themes
such as `OpenCode` remain untouched. Registered Colorway-owned outputs may
be updated; unowned desktop themes must not be overwritten. Dark-only output
selection and duplicate detection remain deliberate.

**Checks:** `bun test src`, `bun run typecheck`, `bun run build`, and
`bun run script/sync-colorway-themes.ts --check`. The permanent
`src/theme/colorway-conversion.test.ts` suite verifies source alias handling,
semantic state separation, ID stability, resolved dark base/text colors,
and light-seed contrast across all generated, registered Colorway themes.

All work is scoped to `packages/ui`. It must not change terminal themes,
active OpenCode settings, user files, or another developer's ongoing edits.
