import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@opencode-ai/ui/v2/dialog-v2"
import { DividerV2 } from "@opencode-ai/ui/v2/divider-v2"
import { Field } from "@opencode-ai/ui/v2/field-v2"
import { Icon, iconDataUri, type IconName } from "@opencode-ai/ui/v2/icon"
import {
  ProjectAvatar,
  PROJECT_AVATAR_SHAPES,
  type ProjectAvatarShape,
} from "@opencode-ai/ui/v2/project-avatar-v2"
import { TextareaV2 } from "@opencode-ai/ui/v2/textarea-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { type LocalProject } from "@/context/layout"
import { useProjectColor } from "@/utils/project-color"
import { ServerConnection } from "@/context/server"
import { getProjectAvatarSource } from "@/pages/layout/helpers"
import { createEditProjectModel } from "./edit-project"

const EMOJI_CHOICES = [
  "🌱", "✨", "⭐", "🔥", "💡", "🧠", "🤖", "🎨", "🎵", "🎧", "🎛️", "🎮",
  "🕹️", "📻", "📚", "📝", "🧪", "🔬", "🔭", "🔧", "⚙️", "🧩", "🪄", "🛰️",
  "🚀", "💻", "🖥️", "📱", "💾", "📦", "🗂️", "🌙", "☀️", "☁️", "🌊", "🍄",
  "🌿", "🌸", "🍒", "🐈", "🐕", "🦊", "🐸", "🐙", "🦋", "👾", "❤️", "💜",
] as const

const SVG_ICON_CHOICES = [
  ["folder", "Folder"],
  ["branch", "Branch"],
  ["workspace", "Workspace"],
  ["workspace-new", "New workspace"],
  ["workspace-isolated", "Isolated workspace"],
  ["filetree", "Files"],
  ["grid-plus", "Grid"],
  ["monitor", "Monitor"],
  ["status", "Server"],
  ["edit", "Edit"],
  ["review", "Review"],
  ["outline-sliders", "Controls"],
  ["outline-copy", "Copy"],
  ["outline-share", "Share"],
  ["magnifying-glass", "Search"],
  ["settings-gear", "Settings"],
  ["reset", "Reset"],
  ["archive", "Archive"],
  ["help", "Help"],
  ["menu", "Menu"],
  ["check", "Check"],
  ["plus", "Plus"],
  ["split", "Split"],
  ["unified", "Unified"],
] as const satisfies ReadonlyArray<readonly [IconName, string]>

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function emojiDataUri(value: string) {
  const text = escapeXml(value)
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="42" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">' +
    text +
    "</text></svg>"
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

// Mounted only when the user asks for it. The picker pulls the full emojibase dataset, so
// building it eagerly made the dialog tall enough to push the Color row out of view.
function FullEmojiPicker(props: { onSelect: (emoji: string) => void }) {
  let host: HTMLDivElement | undefined
  let disposePicker: (() => void) | undefined
  let cancelled = false

  onMount(() => {
    void (async () => {
      const [, dataModule] = await Promise.all([
        import("emoji-picker-element/picker"),
        import("emoji-picker-element-data/en/emojibase/data.json"),
      ])
      if (cancelled || !host) return

      const dataSource = URL.createObjectURL(
        new Blob([JSON.stringify(dataModule.default)], { type: "application/json" }),
      )
      const picker = document.createElement("emoji-picker") as HTMLElement & { dataSource: string }
      picker.dataSource = dataSource
      picker.style.width = "100%"
      picker.style.maxWidth = "100%"
      picker.style.setProperty("--background", "var(--v2-background-bg-layer-01)")
      picker.style.setProperty("--border-color", "var(--v2-border-border-muted)")
      picker.style.setProperty("--border-radius", "12px")
      picker.style.setProperty("--button-active-background", "var(--v2-overlay-simple-overlay-pressed)")
      picker.style.setProperty("--button-hover-background", "var(--v2-overlay-simple-overlay-hover)")
      picker.style.setProperty("--indicator-color", "var(--v2-background-bg-accent)")
      picker.style.setProperty("--input-border-color", "var(--v2-border-border-muted)")
      picker.style.setProperty("--input-font-color", "var(--v2-text-text-base)")
      picker.style.setProperty("--input-placeholder-color", "var(--v2-text-text-faint)")
      picker.style.setProperty("--outline-color", "var(--v2-border-border-focus)")
      picker.style.setProperty("--category-font-color", "var(--v2-text-text-muted)")
      picker.style.setProperty("--emoji-size", "1.25rem")
      picker.style.setProperty("--emoji-padding", "0.375rem")
      picker.style.setProperty("--input-border-radius", "0.625rem")
      picker.style.setProperty("--skintone-border-radius", "0.75rem")

      const syncTheme = () => {
        const dark = document.documentElement.dataset.colorScheme === "dark"
        picker.classList.toggle("dark", dark)
        picker.classList.toggle("light", !dark)
      }
      const onEmoji = (event: Event) => {
        const emoji = (event as CustomEvent<{ unicode?: string }>).detail?.unicode
        if (emoji) props.onSelect(emoji)
      }
      const observer = new MutationObserver(syncTheme)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-color-scheme"] })
      picker.addEventListener("emoji-click", onEmoji)
      host.replaceChildren(picker)
      syncTheme()

      disposePicker = () => {
        observer.disconnect()
        picker.removeEventListener("emoji-click", onEmoji)
        picker.remove()
        URL.revokeObjectURL(dataSource)
      }
    })()
  })

  onCleanup(() => {
    cancelled = true
    disposePicker?.()
  })

  return (
    <div
      ref={(element) => (host = element)}
      class="max-h-[min(280px,38vh)] min-w-0 overflow-y-auto overflow-x-hidden rounded-[12px]"
    />
  )
}

type IconMode = "letter" | "emoji" | "svg" | "upload"

const ICON_MODE_LABEL = {
  letter: "dialog.project.edit.iconMode.letter",
  emoji: "dialog.project.edit.iconMode.emoji",
  svg: "dialog.project.edit.iconMode.svg",
  upload: "dialog.project.edit.iconMode.upload",
} as const satisfies Record<IconMode, string>

const SHAPE_LABELS: Record<ProjectAvatarShape, string> = {
  circle: "Circle",
  squircle: "Squircle",
  rounded: "Rounded",
  arch: "Arch",
  leaf: "Leaf",
  gem: "Gem",
}

export function DialogEditProjectV2(props: { project: LocalProject; server: ServerConnection.Any }) {
  const language = useLanguage()
  const projectColor = useProjectColor()
  const model = createEditProjectModel(props)
  const [iconMode, setIconMode] = createSignal<IconMode>(model.store.iconOverride ? "upload" : "letter")
  const [customEmoji, setCustomEmoji] = createSignal("")
  const [browseEmoji, setBrowseEmoji] = createSignal(false)
  const resolvedColor = createMemo(() => projectColor.resolve(props.project, model.store.color) ?? "#5c5c5c")
  const [hexColor, setHexColor] = createSignal<string>(resolvedColor())

  createEffect(() => {
    if (model.store.color && !projectColor.selected(model.store.color)) return
    setHexColor(resolvedColor())
  })

  const chooseEmoji = (emoji: string) => {
    model.setStore("iconOverride", emojiDataUri(emoji))
    model.setStore("iconHover", false)
    setIconMode("emoji")
  }

  const chooseSvg = (name: IconName) => {
    model.setStore("iconOverride", iconDataUri(name))
    model.setStore("iconHover", false)
    setIconMode("svg")
  }

  const setProjectColor = (value: string) => {
    const normalized = value.trim().toLowerCase()
    setHexColor(normalized)
    if (/^#[0-9a-f]{6}$/i.test(normalized)) model.setStore("color", normalized)
  }

  const tabClass =
    "h-7 rounded-[5px] px-2 text-[12px] font-[500] transition-colors hover:bg-v2-overlay-simple-overlay-hover focus-visible:outline-none focus-visible:bg-v2-overlay-simple-overlay-hover"

  return (
    <Dialog fit>
      <form onSubmit={model.submit} class="contents">
        <DialogHeader>
          <DialogTitle>{language.t("dialog.project.edit.title")}</DialogTitle>
        </DialogHeader>
        <DividerV2 />
        <DialogBody class="flex max-h-[min(620px,calc(100vh-120px))] w-full flex-col gap-5 overflow-y-auto px-4 pt-4 pb-1">
          <Field>
            <Field.Label>{language.t("dialog.project.edit.name")}</Field.Label>
            <TextInputV2
              autofocus
              appearance="large"
              class="!w-full"
              value={model.store.name}
              placeholder={model.folderName()}
              onInput={(event) => model.setStore("name", event.currentTarget.value)}
            />
          </Field>

          <div class="flex w-full flex-col gap-2.5">
            <div class="select-none text-[13px] font-[530] leading-none tracking-[-0.04px] text-v2-text-text-base">
              {language.t("dialog.project.edit.icon")}
            </div>

            <div class="flex items-center gap-3">
              <div
                class="relative flex size-16 shrink-0 items-center justify-center rounded-[18px] bg-v2-background-bg-layer-01 p-1.5 shadow-[var(--v2-elevation-raised)] outline outline-1 outline-v2-border-border-muted"
                classList={{
                  "bg-v2-overlay-simple-overlay-hover outline-v2-border-border-focus": model.store.dragOver,
                }}
                onDrop={model.drop}
                onDragOver={model.dragOver}
                onDragLeave={model.dragLeave}
              >
                <ProjectAvatar
                  fallback={model.store.name || model.defaultName()}
                  src={getProjectAvatarSource(props.project.id, {
                    color: model.store.color,
                    url: props.project.icon?.url,
                    override: model.store.iconOverride,
                  })}
                  variant={resolvedColor()}
                  shape={model.store.shape}
                  class="!size-13 [&_[data-slot=project-avatar-surface]]:!text-[28px]"
                />
              </div>

              <input
                ref={(element) => {
                  model.setIconInput(element)
                }}
                type="file"
                accept="image/*"
                class="hidden"
                onChange={(event) => {
                  model.inputChange(event)
                  setIconMode("upload")
                }}
              />

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap gap-1">
                  <For each={["letter", "emoji", "svg", "upload"] as const}>
                    {(mode) => (
                      <button
                        type="button"
                        class={tabClass}
                        classList={{
                          "bg-v2-overlay-simple-overlay-pressed text-v2-text-text-base": iconMode() === mode,
                          "text-v2-text-text-muted": iconMode() !== mode,
                        }}
                        onClick={() => {
                          setIconMode(mode)
                          if (mode === "letter") model.setStore("iconOverride", "")
                          if (mode === "upload") model.setStore("color", undefined)
                        }}
                      >
                        {language.t(ICON_MODE_LABEL[mode])}
                      </button>
                    )}
                  </For>
                </div>
                <div class="mt-2 text-[11px] leading-4 text-v2-text-text-faint">
                  {language.t("dialog.project.edit.iconMode.hint")}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-6 gap-1.5 rounded-[14px] bg-v2-background-bg-layer-01 p-1.5 shadow-[inset_0_1px_2px_var(--v2-alpha-dark-10),inset_0_-1px_1px_var(--v2-alpha-light-8)]">
              <For each={PROJECT_AVATAR_SHAPES}>
                {(shape) => (
                  <button
                    type="button"
                    aria-label={language.t("dialog.project.edit.color.shape", { shape: SHAPE_LABELS[shape] })}
                    aria-pressed={model.store.shape === shape}
                    class="flex min-w-0 flex-col items-center gap-1 rounded-[10px] px-1 py-1.5 text-[10px] leading-none text-v2-text-text-faint transition-[background-color,box-shadow,color] hover:bg-v2-overlay-simple-overlay-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-border-border-focus"
                    classList={{
                      "bg-v2-background-bg-button-neutral text-v2-text-text-base shadow-[var(--v2-elevation-button-neutral)]":
                        model.store.shape === shape,
                    }}
                    onClick={() => model.setStore("shape", shape)}
                  >
                    <ProjectAvatar
                      fallback={model.store.name || model.defaultName()}
                      src={getProjectAvatarSource(props.project.id, {
                        color: model.store.color,
                        url: props.project.icon?.url,
                        override: model.store.iconOverride,
                      })}
                      variant={resolvedColor()}
                      shape={shape}
                      class="!size-7 [&_[data-slot=project-avatar-surface]]:!text-[13px]"
                    />
                    <span class="w-full truncate text-center">{SHAPE_LABELS[shape]}</span>
                  </button>
                )}
              </For>
            </div>

            <Show when={iconMode() === "emoji"}>
              <div class="flex min-w-0 flex-col gap-2 rounded-[12px] bg-v2-background-bg-layer-01 p-2">
                <div class="flex items-center gap-2 px-0.5">
                  <span class="text-[11px] font-[530] text-v2-text-text-muted">
                    {language.t("dialog.project.edit.emoji.quickPicks")}
                  </span>
                  <div class="h-px min-w-0 flex-1 bg-v2-border-border-muted" />
                </div>
                <div class="grid grid-cols-8 gap-1">
                  <For each={EMOJI_CHOICES.slice(0, 16)}>
                    {(emoji) => (
                      <button
                        type="button"
                        class="grid size-8 place-items-center rounded-[7px] text-[18px] leading-none transition-colors hover:bg-v2-overlay-simple-overlay-hover focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:outline-2 focus-visible:outline-v2-border-border-focus focus-visible:outline-offset-[-2px]"
                        aria-label={language.t("dialog.project.edit.emoji.select", { emoji })}
                        onClick={() => chooseEmoji(emoji)}
                      >
                        <span class="block leading-none">{emoji}</span>
                      </button>
                    )}
                  </For>
                </div>
                <div class="flex items-center gap-2 px-0.5 pt-0.5">
                  <span class="text-[11px] font-[530] text-v2-text-text-muted">
                    {language.t("dialog.project.edit.emoji.all")}
                  </span>
                  <div class="h-px min-w-0 flex-1 bg-v2-border-border-muted" />
                  <ButtonV2
                    type="button"
                    variant="ghost-muted"
                    size="small"
                    aria-expanded={browseEmoji()}
                    onClick={() => setBrowseEmoji((value) => !value)}
                  >
                    {language.t("dialog.project.edit.emoji.browse")}
                  </ButtonV2>
                </div>
                <Show when={browseEmoji()}>
                  <FullEmojiPicker onSelect={chooseEmoji} />
                </Show>
                <div class="flex items-center gap-1.5">
                  <input
                    value={customEmoji()}
                    maxlength={32}
                    placeholder={language.t("dialog.project.edit.emoji.pastePlaceholder")}
                    class="h-8 min-w-0 flex-1 rounded-[7px] border border-v2-border-border-muted bg-v2-background-bg-base px-2 text-[13px] text-v2-text-text-base outline-none focus:border-v2-border-border-focus focus-visible:outline-2 focus-visible:outline-v2-border-border-focus focus-visible:outline-offset-[-2px]"
                    onInput={(event) => setCustomEmoji(event.currentTarget.value)}
                  />
                  <ButtonV2
                    type="button"
                    variant="neutral"
                    disabled={!customEmoji().trim()}
                    onClick={() => chooseEmoji(customEmoji().trim())}
                  >
                    {language.t("dialog.project.edit.emoji.use")}
                  </ButtonV2>
                </div>
              </div>
            </Show>

            <Show when={iconMode() === "svg"}>
              <div class="grid grid-cols-8 gap-1 rounded-[7px] bg-v2-background-bg-layer-01 p-2">
                <For each={SVG_ICON_CHOICES}>
                  {([name, label]) => (
                    <button
                      type="button"
                      title={label}
                      aria-label={language.t("dialog.project.edit.svg.select", { label })}
                      class="flex size-8 items-center justify-center rounded-[5px] text-v2-icon-icon-base hover:bg-v2-overlay-simple-overlay-hover focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:outline-none"
                      onClick={() => chooseSvg(name)}
                    >
                      <Icon name={name} size="normal" />
                    </button>
                  )}
                </For>
              </div>
            </Show>

            <Show when={iconMode() === "upload"}>
              <button
                type="button"
                class="flex h-9 w-full items-center justify-center gap-2 rounded-[6px] border border-v2-border-border-muted text-[12px] text-v2-text-text-muted hover:bg-v2-overlay-simple-overlay-hover focus-visible:outline-none"
                onClick={() => model.iconClick()}
              >
                <Icon name="outline-share" size="small" />
                {language.t("dialog.project.edit.upload.choose")}
              </button>
            </Show>
          </div>

          {/* Sits above the worktree field so it stays in view for every icon mode. Color is
              meaningless for an uploaded image, so the row is hidden there. */}
          <Show when={iconMode() !== "upload"}>
            <div class="flex w-full flex-col gap-2">
            <div class="select-none text-[13px] font-[530] leading-none tracking-[-0.04px] text-v2-text-text-base">
              {language.t("dialog.project.edit.color")}
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                class="h-8 rounded-[6px] border px-2 text-[11px] transition-colors focus-visible:outline-none"
                classList={{
                  "border-v2-border-border-focus bg-v2-overlay-simple-overlay-pressed text-v2-text-text-base":
                    !model.store.color,
                  "border-v2-border-border-muted text-v2-text-text-muted hover:bg-v2-overlay-simple-overlay-hover":
                    !!model.store.color,
                }}
                onClick={() => {
                  model.setStore("color", undefined)
                  setHexColor(projectColor.resolve(props.project, undefined) ?? "#5c5c5c")
                }}
              >
                {language.t("dialog.project.edit.color.auto")}
              </button>
              <For each={projectColor.accents()}>
                {(accent) => (
                  <button
                    type="button"
                    class="relative size-8 rounded-[7px] border border-v2-border-border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-border-border-focus"
                    classList={{
                      "ring-2 ring-v2-border-border-focus ring-offset-1 ring-offset-v2-background-bg-base":
                        projectColor.selected(model.store.color) === accent.id,
                    }}
                    style={{ background: accent.color }}
                    title={accent.id}
                    aria-label={language.t("dialog.project.edit.color.accent", { color: accent.id })}
                    aria-pressed={projectColor.selected(model.store.color) === accent.id}
                    onClick={() => {
                      model.setStore("color", projectColor.value(accent.id))
                      setHexColor(accent.color)
                    }}
                  />
                )}
              </For>
            </div>

            <div class="flex items-center gap-2">
              <label
                class="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-[7px] border border-v2-border-border-muted"
                style={{ background: hexColor() }}
                title={language.t("dialog.project.edit.color.custom")}
              >
                <input
                  type="color"
                  value={hexColor()}
                  class="absolute inset-0 size-full cursor-pointer opacity-0"
                  aria-label={language.t("dialog.project.edit.color.custom")}
                  onInput={(event) => setProjectColor(event.currentTarget.value)}
                />
              </label>
              <input
                value={hexColor()}
                spellcheck={false}
                maxlength={7}
                aria-label={language.t("dialog.project.edit.color.hex")}
                class="h-9 w-[108px] rounded-[6px] border border-v2-border-border-muted bg-v2-background-bg-base px-2 font-mono text-[12px] text-v2-text-text-base outline-none focus:border-v2-border-border-focus"
                onInput={(event) => setProjectColor(event.currentTarget.value)}
              />
              <span class="text-[11px] text-v2-text-text-faint">
                {language.t("dialog.project.edit.color.autoHint")}
              </span>
            </div>
          </div>
          </Show>

          <Field>
            <Field.Label>{language.t("dialog.project.edit.worktree.startup")}</Field.Label>
            <Field.Prefix>{language.t("dialog.project.edit.worktree.startup.description")}</Field.Prefix>
            <TextareaV2
              class="!w-full [&_[data-slot=textarea-v2-textarea]]:font-mono"
              rows={3}
              value={model.store.startup}
              placeholder={language.t("dialog.project.edit.worktree.startup.placeholder")}
              spellcheck={false}
              onInput={(event) => model.setStore("startup", event.currentTarget.value)}
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <ButtonV2 type="button" variant="neutral" disabled={model.save.isPending} onClick={model.close}>
            {language.t("common.cancel")}
          </ButtonV2>
          <ButtonV2 type="submit" variant="contrast" disabled={model.save.isPending}>
            {model.save.isPending ? language.t("common.saving") : language.t("common.save")}
          </ButtonV2>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
