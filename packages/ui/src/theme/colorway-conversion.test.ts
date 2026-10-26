import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { contrastRatio } from "./color"
import { resolveThemeVariant } from "./resolve"
import { parseOvt, darkPalette, lightPalette, desktopVariant, canonicalThemeIdentity } from "./colorway-conversion"

const source = `@OBSThemeMeta {
 name: 'Sample — Green';
 dark: 'true';
}
@OBSThemeVars {
 /* An old generated palette comment must NOT override active values:
    --success: #ee4477;
    --bg_window: #ffffff;
 */
 --sibling_base: #232136;
 --sibling_text: #e0def4;
 --sibling_green: #b5dfa5;
 --bg_window: var(--sibling_base);
 --text: var(--sibling_text);
 --primary: #f6c177;
 --primary_lighter: #e0def4;
 --primary_dark: #eb6f92;
 --success: var(--sibling_green);
 --warning: #f6c177;
 --danger: #eb6f92;
 --primary_light: #ea9a97;
}`

describe("Colorway to OpenCode desktop", () => {
  test("reuses existing desktop theme IDs by identity instead of creating naming duplicates", () => {
    const existing = [
      { file: "opencode.json", theme: { id: "opencode", name: "OpenCode" } },
      { file: "nightowl.json", theme: { id: "nightowl", name: "Night Owl" } },
      { file: "earthbound.json", theme: { id: "earthbound", name: "Earthbound" } },
      { file: "dusty-dunes.json", theme: { id: "dusty-dunes", name: "Dusty Dunes" } },
    ]
    expect(canonicalThemeIdentity("OpenCode", existing)).toEqual({ id: "opencode", file: "opencode.json" })
    expect(canonicalThemeIdentity("EarthBound — Dusty Dunes", existing)).toEqual({
      id: "dusty-dunes", file: "dusty-dunes.json",
    })
    expect(canonicalThemeIdentity("EarthBound", existing)).toEqual({ id: "earthbound", file: "earthbound.json" })
    expect(canonicalThemeIdentity("New Palette", existing)).toEqual({ id: "new-palette", file: "new-palette.json" })
  })

  test("resolves actual variable declarations rather than comment snapshots", () => {
    const ovt = parseOvt(source)
    expect(ovt.vars["--bg_window"]).toBe("#232136")
    expect(ovt.vars["--success"]).toBe("#b5dfa5")
    expect(ovt.vars["--text"]).toBe("#e0def4")
  })

  test("ignores Qt-only runtime aliases without hiding missing color references", () => {
    const withQtRuntime = source.replace("--sibling_base: #232136;", "--font_base_value: var(--obsFontScale);\n --sibling_base: #232136;")
    expect(parseOvt(withQtRuntime).vars["--bg_window"]).toBe("#232136")
  })

  test("maps success semantically instead of treating primary_dark as success", () => {
    const palette = darkPalette(parseOvt(source).vars)
    expect(palette.success).toBe("#b5dfa5")
    expect(palette.error).toBe("#eb6f92")
    expect(palette.neutral).toBe("#232136")
  })

  test("uses the real Colorway base success when a variant does not override it", () => {
    const vars = parseOvt(source.replace("--success: var(--sibling_green);", "")).vars
    const palette = darkPalette(vars, "#37d247")
    expect(palette.success).toBe("#37d247")
    expect(palette.success).not.toBe(palette.error)
  })

  test("preserves OBS background and text at the actual OpenCode rendering boundary", () => {
    const variant = desktopVariant(parseOvt(source).vars, "#37d247")
    const rendered = resolveThemeVariant(variant, true)
    expect(rendered["background-base"]).toBe("#232136")
    expect(rendered["text-base"]).toBe("#e0def4")
    expect(rendered["surface-success-base"]).not.toBe(rendered["surface-critical-base"])
  })

  test("light colors actually clear 4.5 contrast including the final quantized hex", () => {
    const dark = darkPalette(parseOvt(source).vars)
    for (const seed of [dark, { ...dark, neutral: "#181825" as const, primary: "#147e66" as const, success: "#2b8111" as const }]) {
      const light = lightPalette(seed)
      for (const role of ["primary", "accent", "success", "warning", "error", "info"] as const) {
        expect(contrastRatio(light[role]!, light.neutral), `${role} ${light[role]} on ${light.neutral}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  test("every registered Colorway desktop theme resolves to its authored background with distinct status roles", () => {
    const folder = import.meta.dir
    const registry = readFileSync(join(folder, "default-themes.ts"), "utf8")
    const filenames = [...registry.matchAll(/import colorway\w+ThemeJson from "\.\/themes\/([^"]+\.json)"/g)].map((match) => match[1]!)
    expect(filenames.length).toBeGreaterThan(90)
    expect(new Set(filenames).size).toBe(filenames.length)
    for (const filename of filenames) {
      const theme = JSON.parse(readFileSync(join(folder, "themes", filename), "utf8"))
      const dark = theme.dark.palette
      const light = theme.light.palette
      expect(dark, filename).toBeDefined()
      expect(light, filename).toBeDefined()
      expect(theme.id, filename).toBe(filename.replace(/\.json$/, ""))
      const painted = resolveThemeVariant(theme.dark, true)
      expect(painted["background-base"], filename).toBe(dark.neutral)
      expect(painted["text-base"], filename).toBe(dark.ink)
      expect(painted["surface-success-base"], filename).not.toBe(painted["surface-critical-base"])
      for (const role of ["primary", "accent", "success", "warning", "error", "info"] as const) {
        expect(contrastRatio(light[role], light.neutral), `${filename} ${role}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  test("rejects undefined and cyclic source roles instead of silently inventing palettes", () => {
    const broken = source.replace("--sibling_base: #232136;", "--sibling_base: var(--missing);")
    expect(() => parseOvt(broken)).toThrow(/missing|unresolved/i)
    const cycle = source.replace("--sibling_base: #232136;", "--sibling_base: var(--bg_window);")
    expect(() => parseOvt(cycle)).toThrow(/cycle/i)
  })
})
