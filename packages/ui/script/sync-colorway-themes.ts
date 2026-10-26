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
import { parseOvt, darkPalette, desktopVariant, lightPalette, canonicalThemeIdentity } from "../src/theme/colorway-conversion"
import type { DesktopTheme, ThemePaletteColors } from "../src/theme/types"

const colorwayDir = process.env.COLORWAY_DIR ?? join(homedir(), "loam", "colorway")
const sourceDir = join(colorwayDir, "themes")
const targetDir = import.meta.dir + "/../src/theme/themes"
const registryPath = import.meta.dir + "/../src/theme/default-themes.ts"

const check = process.argv.includes("--check")
const baseColors = parseOvt(await Bun.file(join(sourceDir, "Colorway.obt")).text()).vars

function title(name: string) {
  return name.replace(/\s*—\s*/g, " — ").replace(/\s+/g, " ").trim()
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
const existingThemes: { file: string; theme: DesktopTheme }[] = []
for (const file of new Bun.Glob("*.json").scanSync(targetDir)) {
  const theme = (await Bun.file(join(targetDir, file)).json()) as DesktopTheme
  existingThemes.push({ file, theme })
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
  const ovt = parseOvt(await Bun.file(join(sourceDir, file)).text(), baseColors)
  const { id, file: jsonFile } = canonicalThemeIdentity(ovt.name, existingThemes)
  if (!id) continue

  const dark = darkPalette(ovt.vars, baseColors["--success"])
  const key = paletteKey(dark)
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
      dark: desktopVariant(ovt.vars, baseColors["--success"]),
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
