import { describe, expect, test } from "bun:test"
import type { HexColor, ProjectAccent } from "@opencode-ai/ui/theme"
import {
  autoProjectAccent,
  projectThemeAccentID,
  resolveProjectColor,
  themeProjectColor,
} from "./project-color"

const accents: ProjectAccent[] = [
  { id: "pink", color: "#111111" },
  { id: "mauve", color: "#222222" },
  { id: "green", color: "#333333" },
]

const accentColor = (id: string): HexColor =>
  ({ pink: "#aaaaaa", mauve: "#bbbbbb", green: "#cccccc" } as Record<string, HexColor>)[id] ?? "#dddddd"

describe("project color resolution", () => {
  test("auto assignment is deterministic for a worktree", () => {
    const project = { worktree: "/repo/aster" }
    expect(autoProjectAccent(project, accents)).toEqual(autoProjectAccent(project, accents))
  })

  test("theme slots persist semantically", () => {
    const project = { worktree: "/repo/aster", icon: { color: themeProjectColor("mauve") } }
    expect(projectThemeAccentID(project.icon.color)).toBe("mauve")
    expect(resolveProjectColor(project, accents, accentColor)).toBe("#bbbbbb")
  })

  test("legacy project colors map onto theme slots", () => {
    const project = { worktree: "/repo/aster", icon: { color: "purple" } }
    expect(projectThemeAccentID(project.icon.color)).toBe("mauve")
    expect(resolveProjectColor(project, accents, accentColor)).toBe("#bbbbbb")
  })

  test("custom hex remains independent of the theme", () => {
    const project = { worktree: "/repo/aster", icon: { color: "#C084FC" } }
    expect(resolveProjectColor(project, accents, accentColor)).toBe("#c084fc")
  })
})
