import { mixColors } from "./color"
import { PROJECT_ACCENT_SLOTS, type DesktopTheme, type HexColor, type ProjectAccentSlot, type ThemeVariant } from "./types"

export type ProjectAccent = {
  id: string
  color: HexColor
}

function variantSeed(variant: ThemeVariant) {
  if ("palette" in variant && variant.palette) {
    const palette = variant.palette
    return {
      primary: palette.primary,
      accent: palette.accent ?? palette.primary,
      success: palette.success,
      warning: palette.warning,
      error: palette.error,
      info: palette.info,
      interactive: palette.interactive ?? palette.primary,
    }
  }

  const seeds = variant.seeds
  return {
    primary: seeds.primary,
    accent: seeds.primary,
    success: seeds.success,
    warning: seeds.warning,
    error: seeds.error,
    info: seeds.info,
    interactive: seeds.interactive,
  }
}

/**
 * Every theme gets a usable project palette, even before it has been manually
 * curated. Explicit projectAccents replace these generated values slot-by-slot.
 */
export function generatedProjectAccents(theme: DesktopTheme, mode: "light" | "dark"): Record<ProjectAccentSlot, HexColor> {
  const seed = variantSeed(mode === "dark" ? theme.dark : theme.light)

  return {
    pink: mixColors(seed.error, seed.accent, 0.45),
    mauve: seed.primary,
    red: seed.error,
    peach: mixColors(seed.error, seed.warning, 0.58),
    yellow: seed.warning,
    green: seed.success,
    teal: mixColors(seed.success, seed.info, 0.55),
    blue: seed.interactive,
  }
}

export function projectAccentEntries(theme: DesktopTheme, mode: "light" | "dark"): ProjectAccent[] {
  const generated = generatedProjectAccents(theme, mode)
  const explicit = theme.projectAccents

  const known = PROJECT_ACCENT_SLOTS.map((id) => ({
    id,
    color: explicit?.[id]?.[mode] ?? generated[id],
  }))
  const extras = Object.entries(explicit ?? {})
    .filter(([id]) => !(PROJECT_ACCENT_SLOTS as readonly string[]).includes(id))
    .map(([id, value]) => ({ id, color: value[mode] }))

  return [...known, ...extras]
}

function hash(value: string) {
  let result = 0x811c9dc5
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 0x01000193)
  }
  return result >>> 0
}

export function projectAccentColor(
  theme: DesktopTheme,
  mode: "light" | "dark",
  id: string,
): HexColor {
  const explicit = theme.projectAccents?.[id]
  if (explicit) return explicit[mode]

  const generated = generatedProjectAccents(theme, mode)
  if ((PROJECT_ACCENT_SLOTS as readonly string[]).includes(id)) {
    return generated[id as ProjectAccentSlot]
  }

  const fallback = PROJECT_ACCENT_SLOTS[hash(id) % PROJECT_ACCENT_SLOTS.length]
  return generated[fallback]
}
