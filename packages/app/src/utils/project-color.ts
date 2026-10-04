import { useTheme, type HexColor, type ProjectAccent } from "@opencode-ai/ui/theme"

export const PROJECT_COLOR_THEME_PREFIX = "theme:"

const LEGACY_PROJECT_COLOR_SLOT: Record<string, string> = {
  pink: "pink",
  purple: "mauve",
  red: "red",
  orange: "peach",
  yellow: "yellow",
  lime: "green",
  green: "green",
  mint: "teal",
  cyan: "teal",
  blue: "blue",
}

export type ProjectColorSource = {
  id?: string
  worktree: string
  icon?: {
    color?: string
  }
}

function stableHash(value: string) {
  let result = 0x811c9dc5
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 0x01000193)
  }
  return result >>> 0
}

function identity(project: ProjectColorSource) {
  // worktree is available before project metadata finishes loading, so using it
  // avoids a visible color swap when an id arrives a moment later.
  return project.worktree
}

export function themeProjectColor(id: string) {
  return `${PROJECT_COLOR_THEME_PREFIX}${id}`
}

export function projectThemeAccentID(value?: string) {
  if (!value) return
  if (value.startsWith(PROJECT_COLOR_THEME_PREFIX)) {
    const id = value.slice(PROJECT_COLOR_THEME_PREFIX.length)
    return id || undefined
  }
  return LEGACY_PROJECT_COLOR_SLOT[value]
}

export function autoProjectAccent(project: ProjectColorSource, accents: readonly ProjectAccent[]) {
  if (accents.length === 0) return
  return accents[stableHash(identity(project)) % accents.length]
}

export function resolveProjectColor(
  project: ProjectColorSource,
  accents: readonly ProjectAccent[],
  accentColor: (id: string) => HexColor,
  value: string | undefined = project.icon?.color,
): HexColor | undefined {
  if (value && /^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase() as HexColor

  const explicit = projectThemeAccentID(value)
  if (explicit) return accentColor(explicit)

  // Theme authors may use additional semantic slot names beyond the built-ins.
  if (value && accents.some((accent) => accent.id === value)) return accentColor(value)

  return autoProjectAccent(project, accents)?.color
}

export function useProjectColor() {
  const theme = useTheme()

  return {
    accents: theme.projectAccents,
    selected: projectThemeAccentID,
    value: themeProjectColor,
    resolve(project: ProjectColorSource, value?: string) {
      return resolveProjectColor(project, theme.projectAccents(), theme.projectAccent, value)
    },
  }
}
