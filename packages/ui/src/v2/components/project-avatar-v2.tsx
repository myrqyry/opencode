import { type ComponentProps, splitProps, Show } from "solid-js"
import "./project-avatar-v2.css"

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : undefined

function first(value: string) {
  if (!value) return ""
  if (!segmenter) return Array.from(value)[0] ?? ""
  return segmenter.segment(value)[Symbol.iterator]().next().value?.segment ?? Array.from(value)[0] ?? ""
}

export const PROJECT_AVATAR_VARIANTS = [
  "orange",
  "yellow",
  "cyan",
  "green",
  "red",
  "pink",
  "blue",
  "purple",
  "gray",
] as const

export type ProjectAvatarVariant = (typeof PROJECT_AVATAR_VARIANTS)[number]

export const PROJECT_AVATAR_SHAPES = ["circle", "squircle", "rounded", "arch", "leaf", "gem"] as const
export type ProjectAvatarShape = (typeof PROJECT_AVATAR_SHAPES)[number]

// "outline" is a neutral, muted style (e.g. recently closed projects) and is not part of the color rotation.
export type ProjectAvatarStyle = ProjectAvatarVariant | "outline" | `#${string}`

export interface ProjectAvatarProps extends ComponentProps<"div"> {
  fallback: string
  src?: string
  variant?: ProjectAvatarStyle
  shape?: ProjectAvatarShape
  unread?: boolean
}

export function ProjectAvatar(props: ProjectAvatarProps) {
  const [split, rest] = splitProps(props, ["fallback", "src", "variant", "shape", "unread", "class", "classList", "style"])
  const customColor = () => {
    const value = split.variant
    if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) return
    return value.toLowerCase()
  }
  const surfaceStyle = () => {
    const base = typeof split.style === "object" ? split.style : {}
    const color = customColor()
    if (!color) return base
    return {
      ...base,
      "--project-avatar-custom-bg": color,
      "--project-avatar-custom-border": `color-mix(in srgb, ${color} 88%, #000000)`,
    } as typeof base
  }
  return (
    <div
      {...rest}
      data-component="project-avatar-v2"
      data-unread={split.unread ? "" : undefined}
      classList={{
        ...split.classList,
        [split.class ?? ""]: !!split.class,
      }}
      style={surfaceStyle()}
    >
      <div
        data-slot="project-avatar-surface"
        data-variant={customColor() ? "custom" : (split.variant ?? "gray")}
        data-shape={split.shape ?? "circle"}
        data-has-image={split.src ? "" : undefined}
      >
        <Show when={split.src} fallback={first(split.fallback)}>
          {(value) => <img src={value()} draggable={false} data-slot="project-avatar-image" />}
        </Show>
      </div>
      <Show when={split.unread}>
        <span data-slot="project-avatar-unread-dot" aria-hidden="true" />
      </Show>
    </div>
  )
}
