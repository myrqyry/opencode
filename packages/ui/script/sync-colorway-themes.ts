#!/usr/bin/env bun

/**
 * Generate OpenCode desktop themes from the Colorway `.ovt` corpus.
 *
 * `colorway/themes/*.ovt` is the source of truth for the palettes. Colorway themes are
 * single-mode; the desktop theme schema requires both `light` and `dark`. The dark half is a
 * faithful, mechanical mapping of the Colorway token set. The light half did not exist upstream
 * (the hand-authored light variants in the existing themes are not derivable from the OVTs), so
 * it is derived here: same hues, flipped lightness, with accents darkened until they clear a
 * contrast floor against the derived light background.
 *
 * Usage: bun run script/sync-colorway-themes.ts [--check]
 *   COLORWAY_DIR overrides the corpus location (default ~/loam/colorway).
 */

import { homedir } from "node:os"
import { join } from "node:path"
import { contrastRatio, hexToOklch, oklchToHex } from "../src/theme/color"
import type { DesktopTheme, HexColor, ThemePaletteColors } from "../src/theme/types"

const colorwayDir = process.env.COLORWAY_DIR ?? join(homedir(), "loam", "colorway")
const sourceDir = join(colorwayDir, "themes")
const targetDir = import.meta.dir + "/../src/theme/themes"
const registryPath = import.meta.dir + "/../src/theme/default-themes.ts"

const MIN_CONTRAST = 4.5
const check = process.argv.includes("--check")

// The confirmed Colorway -> desktop mapping. Five `--primary*` slots carry the theme's accent
// set; OBS's generic `--success` is a placeholder in most themes and is deliberately unused.
const MAPPING = {
  neutral: "--bg_window",
  ink: "--text",
  primary: "--primary",
  accent: "--primary_lighter",
  success: "--primary_dark",
  warning: "--warning",
  error: "--danger",
  info: "--primary_light",
} as const

type Ovt = { name: string; dark: boolean; vars: Record<string, string> }

function parseOvt(text: string): Ovt {
  const name = text.match(/name:\s*['"]([^'"]+)['"]/)?.[1] ?? ""
  const darkMatch = text.match(/dark:\s*['"]([^'"]+)['"]/)
  // An absent `dark:` key means dark; only an explicit 'false' is light.
  const dark = darkMatch ? darkMatch[1]?.toLowerCase() === "true" : true
  const vars: Record<string, string> = {}
  const block = text.match(/@OBSThemeVars\s*\{([\s\S]*?)\n\}/)
  if (block) {
    for (const line of block[1]!.split("\n")) {
      const match = line.match(/^\s*(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/)
      if (match) vars[match[1]!] = match[2]!.toLowerCase()
    }
  }
  return { name, dark, vars }
}

function slug(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function title(name: string) {
  return name.replace(/\s*—\s*/g, " — ").replace(/\s+/g, " ").trim()
}

// Dark palette: direct read of the mapped Colorway tokens.
function darkPalette(vars: Record<string, string>): ThemePaletteColors {
  const read = (token: string, fallback: string) => (vars[token] ?? fallback).toLowerCase() as HexColor
  return {
    neutral: read(MAPPING.neutral, "#1e1e1e"),
    ink: read(MAPPING.ink, "#e6e6e6"),
    primary: read(MAPPING.primary, "#7aa2f7"),
    accent: read(MAPPING.accent, "#bb9af7"),
    success: read(MAPPING.success, "#9ece6a"),
    warning: read(MAPPING.warning, "#e0af68"),
    error: read(MAPPING.error, "#f7768e"),
    info: read(MAPPING.info, "#7dcfff"),
  }
}

// Light palette: same hues, flipped lightness. Accents are darkened until they clear the
// contrast floor so a bright dark-mode accent does not become unreadable on a pale surface.
function lightPalette(dark: ThemePaletteColors): ThemePaletteColors {
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

  const accent = (hex: HexColor): HexColor => {
    const base = hexToOklch(hex)
    let l = Math.min(base.l, 0.62)
    let out = oklchToHex({ l, c: base.c, h: base.h })
    while (contrastRatio(out, neutral) < MIN_CONTRAST && l > 0.26) {
      l -= 0.03
      out = oklchToHex({ l, c: base.c, h: base.h })
    }
    return out
  }

  return {
    neutral,
    ink,
    primary: accent(dark.primary),
    accent: accent(dark.accent ?? dark.primary),
    success: accent(dark.success),
    warning: accent(dark.warning),
    error: accent(dark.error),
    info: accent(dark.info),
  }
}

function paletteKey(palette: ThemePaletteColors) {
  return [
    palette.neutral,
    palette.ink,
    palette.primary,
    palette.accent,
    palette.success,
    palette.warning,
    palette.error,
    palette.info,
  ].join("|")
}

const existing = new Map<string, string>()
for (const file of new Bun.Glob("*.json").scanSync(targetDir)) {
  const theme = (await Bun.file(join(targetDir, file)).json()) as DesktopTheme
  if (theme.dark && "palette" in theme.dark && theme.dark.palette) {
    existing.set(file, paletteKey(theme.dark.palette))
  }
}
const registry = await Bun.file(registryPath).text()
const ownedFiles = new Set(
  [...registry.matchAll(/import colorway\w+ThemeJson from "\.\/themes\/([^\"]+\.json)"/g)].map((match) => match[1]!),
)

const seen = new Set<string>()
const generated: { file: string; theme: DesktopTheme }[] = []
let skippedLight = 0
let skippedDuplicate = 0
const idCollisions: string[] = []
let checkFailed = false

for (const file of [...new Bun.Glob("*.ovt").scanSync(sourceDir)].sort()) {
  const ovt = parseOvt(await Bun.file(join(sourceDir, file)).text())
  const id = slug(ovt.name)
  if (!id) continue

  const dark = darkPalette(ovt.vars)
  const key = paletteKey(dark)
  const jsonFile = `${id}.json`
  const isOwned = ownedFiles.has(jsonFile)

  // Light Colorway themes are out of scope: only the dark corpus is ported.
  if (!ovt.dark) {
    skippedLight++
    continue
  }
  // Leave existing hand-authored themes alone. Previously generated Colorway themes are owned
  // by this script and may be refreshed when their source OVT changes.
  if (!isOwned && (existing.has(jsonFile) || [...existing.values()].includes(key) || seen.has(key))) {
    skippedDuplicate++
    continue
  }
  if (seen.has(key)) {
    skippedDuplicate++
    continue
  }
  seen.add(key)

  if (generated.some((g) => g.file === jsonFile)) {
    idCollisions.push(jsonFile)
    continue
  }

  generated.push({
    file: jsonFile,
    theme: {
      $schema: "https://opencode.ai/desktop-theme.json",
      name: title(ovt.name),
      id,
      light: { palette: lightPalette(dark) },
      dark: { palette: dark },
    },
  })
}

let written = 0
for (const { file, theme } of generated) {
  const path = join(targetDir, file)
  const next = JSON.stringify(theme, null, 2) + "\n"
  const current = (await Bun.file(path).exists()) ? await Bun.file(path).text() : undefined
  if (current === next) continue
  if (check) {
    console.error(`out of date: ${file}`)
    checkFailed = true
    continue
  }
  await Bun.write(path, next)
  written++
}

await updateRegistry(generated.map((item) => item.theme))

console.log(
  [
    `generated ${generated.length} dark themes from ${sourceDir}`,
    `wrote ${written}`,
    `skipped ${skippedLight} light-only`,
    `skipped ${skippedDuplicate} already present`,
    idCollisions.length ? `id collisions: ${idCollisions.join(", ")}` : undefined,
  ]
    .filter(Boolean)
    .join("\n"),
)

if (check && checkFailed) process.exit(1)

/**
 * Keep the registry in sync. Imports and record entries are inserted in sorted position so the
 * file stays diff-stable across runs.
 */
async function updateRegistry(themes: DesktopTheme[]) {
  if (check) return
  const source = await Bun.file(registryPath).text()

  const additions = new Map<string, { importName: string; exportName: string }>()
  for (const theme of themes) {
    if (source.includes(`./themes/${theme.id}.json`)) continue
    const stem = `colorway${theme.id
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")}`
    additions.set(theme.id, { importName: `${stem}ThemeJson`, exportName: `${stem}Theme` })
  }
  if (additions.size === 0) return

  const lines = source.split("\n")
  const lastThemeImport = lines.reduce(
    (acc, line, index) => (line.startsWith("import ") && line.includes("./themes/") ? index : acc),
    -1,
  )
  if (lastThemeImport < 0) throw new Error("Could not locate theme imports in default-themes.ts")
  const imports = [...additions.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, names]) => `import ${names.importName} from "./themes/${id}.json"`)
  lines.splice(lastThemeImport + 1, 0, ...imports)

  const exports = [...additions.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, names]) => `export const ${names.exportName} = ${names.importName} as DesktopTheme`)
  const lastThemeExport = lines.reduce(
    (acc, line, index) => (line.startsWith("export const ") && line.includes("ThemeJson as DesktopTheme") ? index : acc),
    -1,
  )
  if (lastThemeExport < 0) throw new Error("Could not locate theme exports in default-themes.ts")
  lines.splice(lastThemeExport + 1, 0, ...exports)

  const recordStart = lines.findIndex((line) => line.startsWith("export const DEFAULT_THEMES:"))
  const recordEnd = lines.findIndex((line, index) => index > recordStart && line.trim() === "}")
  if (recordStart < 0 || recordEnd < 0) throw new Error("Could not locate DEFAULT_THEMES record")
  const entries = [...additions.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, names]) => `  ${JSON.stringify(id)}: ${names.exportName},`)
  lines.splice(recordEnd, 0, ...entries)
  await Bun.write(registryPath, lines.join("\n"))
}
