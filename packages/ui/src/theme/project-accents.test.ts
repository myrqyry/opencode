import { describe, expect, test } from "bun:test"
import { projectAccentColor, projectAccentEntries } from "./project-accents"
import type { DesktopTheme } from "./types"

const theme: DesktopTheme = {
  name: "Test",
  id: "test",
  projectAccents: {
    pink: { light: "#aa1122", dark: "#bb2233" },
    mauve: { light: "#663399", dark: "#442266" },
  },
  light: {
    palette: {
      neutral: "#eeeeee",
      ink: "#111111",
      primary: "#7755cc",
      success: "#33aa66",
      warning: "#ddaa33",
      error: "#dd4455",
      info: "#3399cc",
      interactive: "#3366dd",
    },
  },
  dark: {
    palette: {
      neutral: "#111111",
      ink: "#eeeeee",
      primary: "#aa88ee",
      success: "#66cc88",
      warning: "#eebb66",
      error: "#ee6677",
      info: "#66bbdd",
      interactive: "#7799ee",
    },
  },
}

describe("project accents", () => {
  test("uses curated light/dark values when supplied", () => {
    expect(projectAccentColor(theme, "light", "pink")).toBe("#aa1122")
    expect(projectAccentColor(theme, "dark", "pink")).toBe("#bb2233")
  })

  test("fills uncurated canonical slots from the theme palette", () => {
    const entries = projectAccentEntries(theme, "dark")
    expect(entries).toHaveLength(8)
    expect(entries.find((entry) => entry.id === "pink")?.color).toBe("#bb2233")
    expect(entries.find((entry) => entry.id === "green")?.color).toBe("#66cc88")
    expect(projectAccentColor(theme, "dark", "blue")).toBe("#7799ee")
  })

  test("a theme without projectAccents still exposes the canonical set", () => {
    const fallback = { ...theme, projectAccents: undefined }
    expect(projectAccentEntries(fallback, "light")).toHaveLength(8)
    expect(projectAccentEntries(fallback, "light").map((entry) => entry.id)).toContain("teal")
  })
})
