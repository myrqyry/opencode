/**
 * Source-aware Colorway OBS palette -> OpenCode desktop adapter.
 * OBS OVT variables can be indirect; generated palette comments are not data.
 * UI renderer consumes compact palettes but allows exact surface overrides.
 */
import { contrastRatio, hexToOklch, oklchToHex } from "./color"
import type { HexColor, ThemePaletteColors, ThemeVariant } from "./types"

export type ColorwayOvt = { name: string; dark: boolean; vars: Record<string, string> }

const ROLES = {
  neutral: "--bg_window",
  ink: "--text",
  primary: "--primary",
  accent: "--primary_lighter",
  warning: "--warning",
  error: "--danger",
  info: "--primary_light",
} as const

/**
 * The source palette name and OpenCode's stable theme id need not slugify
 * alike (e.g. OpenCode -> opencode; EarthBound — Dusty Dunes -> dusty-dunes).
 * Match existing display identity before deciding whether to replace an owned
 * file or skip an upstream one. Never manufacture duplicate picker entries.
 */
export function canonicalThemeIdentity(
  name: string,
  existing: readonly { file: string; theme: { id: string; name: string } }[],
): { id: string; file: string } {
  const slug = (text: string) =>
    text.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  const normalized = slug(name)
  const identities = new Set([normalized])
  // Existing EarthBound ports predate the full Colorway source names:
  // "EarthBound — Dusty Dunes" was registered as "Dusty Dunes".
  if (normalized === "earth-bound") identities.add("earthbound")
  if (normalized.startsWith("earth-bound-")) {
    const suffix = normalized.slice("earth-bound-".length)
    identities.add(suffix)
    identities.add(`earthbound-${suffix}`)
  }
  const matches = existing.filter((entry) => identities.has(slug(entry.theme.name)))
  if (matches.length > 1) throw new Error(`Ambiguous desktop theme identity: ${name} (${matches.map((x) => x.file).join(", ")})`)
  return matches[0] ? { id: matches[0].theme.id, file: matches[0].file } : { id: normalized, file: `${normalized}.json` }
}

export function parseOvt(text: string, inherited: Record<string, string> = {}): ColorwayOvt {
  const name = text.match(/name:\s*['"]([^'"]+)['"]/)?.[1] ?? ""
  const darkMatch = text.match(/dark:\s*['"]([^'"]+)['"]/)
  const dark = darkMatch ? darkMatch[1]?.toLowerCase() === "true" : true
  const block = text.match(/@OBSThemeVars\s*\{([\s\S]*?)\n\}/)?.[1]
  if (!block) throw new Error(`Colorway theme ${name} has no @OBSThemeVars block`)
  const uncommented = block.replace(/\/\*[\s\S]*?\*\//g, "")
  const declarations: Record<string, string> = { ...inherited }
  for (const match of uncommented.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)) {
    declarations[match[1]!] = match[2]!.trim().replace(/^(['"])(.*)\1$/, "$2")
  }
  const vars: Record<string, string> = {}
  const resolve = (name: string, visited: string[] = []): string | undefined => {
    const raw = declarations[name]
    if (raw === undefined) return undefined
    if (visited.includes(name)) throw new Error(`Colorway variable cycle: ${[...visited, name].join(" -> ")}`)
    if (/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(raw)) return raw.toLowerCase()
    const ref = /^var\((--[\w-]+)\)$/.exec(raw)
    if (!ref) return undefined // noncolor CSS tokens are unrelated to palette mapping
    const result = resolve(ref[1]!, [...visited, name])
    if (!result) throw new Error(`Unresolved Colorway variable ${ref[1]} referenced by ${name}`)
    return result
  }
  const required = new Set([...Object.values(ROLES), "--success"])
  for (const key of Object.keys(declarations)) {
    const raw = declarations[key]!
    if (!raw.startsWith("#") && !raw.startsWith("var(")) continue
    try {
      const color = resolve(key)
      if (color) vars[key] = color
    } catch (error) {
      // OBS has runtime-only references (e.g. --obsFontScale). They are not
      // palette colors and should not make exporting a theme impossible.
      // But an unresolved color *role* must fail loudly, never use a lie.
      if (required.has(key)) throw error
    }
  }
  return { name, dark, vars }
}

export function darkPalette(vars: Record<string, string>, defaultSuccess = "#37d247"): ThemePaletteColors {
  const read = (name: string) => {
    const value = vars[name]
    if (!value || !/^#[0-9a-f]{6}$/i.test(value))
      throw new Error(`Required Colorway color ${name} is missing or invalid`)
    return value.toLowerCase() as HexColor
  }
  const palette = Object.fromEntries(Object.entries(ROLES).map(([role, token]) => [role, read(token)]))
  const success = (vars["--success"] ?? defaultSuccess).toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(success)) throw new Error("Colorway success color must be a six-digit hex color")
  return { ...palette, success } as ThemePaletteColors
}

export function desktopVariant(vars: Record<string, string>, defaultSuccess = "#37d247"): ThemeVariant {
  const palette = darkPalette(vars, defaultSuccess)
  // A seed-only import silently darkens the background through OpenCode's
  // neutral scale. Preserve authored OBS canvas/text without global renderer changes.
  return {
    palette,
    overrides: {
      "background-base": palette.neutral,
      "text-base": palette.ink,
    },
  }
}

export function lightPalette(dark: ThemePaletteColors): ThemePaletteColors {
  const neutralOklch = hexToOklch(dark.neutral)
  const neutral = oklchToHex({
    l: 0.965,
    c: Math.min(neutralOklch.c * 0.25, 0.02),
    h: neutralOklch.h,
  })
  const inkOklch = hexToOklch(dark.ink)
  const ink = oklchToHex({
    l: 0.22,
    c: Math.min(inkOklch.c * 0.5, 0.04),
    h: inkOklch.h,
  })
  const accessibleAccent = (hex: HexColor): HexColor => {
    const base = hexToOklch(hex)
    let l = Math.min(base.l, 0.62)
    for (let i = 0; i < 110; i++) {
      const result = oklchToHex({ l, c: base.c, h: base.h })
      if (contrastRatio(result, neutral) >= 4.5) return result
      l = Math.max(0.05, l - 0.005)
    }
    throw new Error(`Cannot derive a legible light-mode accent from ${hex} on ${neutral}`)
  }
  return {
    neutral,
    ink,
    primary: accessibleAccent(dark.primary),
    accent: accessibleAccent(dark.accent ?? dark.primary),
    success: accessibleAccent(dark.success),
    warning: accessibleAccent(dark.warning),
    error: accessibleAccent(dark.error),
    info: accessibleAccent(dark.info),
  }
}
