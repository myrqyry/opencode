import { Show, type JSX, type ParentProps } from "solid-js"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { TooltipV2 } from "@opencode-ai/ui/v2/tooltip-v2"

export function ProjectTabStrip(
  props: ParentProps<{
    end?: JSX.Element
    listRef?: (element: HTMLDivElement) => void
    role?: "tablist"
    ariaLabel?: string
  }>,
) {
  return (
    <div
      data-slot="project-tab-strip"
      class="flex h-9 shrink-0 items-center border-b border-project-outline bg-project-surface-high px-1.5"
    >
      <div
        ref={props.listRef}
        data-slot="project-tab-list"
        role={props.role}
        aria-label={props.ariaLabel}
        class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar"
      >
        {props.children}
      </div>
      <Show when={props.end}>
        <div data-slot="project-tab-strip-end" class="ml-1 shrink-0">
          {props.end}
        </div>
      </Show>
    </div>
  )
}

export function ProjectTab(
  props: ParentProps<{
    active: boolean
    title?: string
    motion?: "settle"
    role?: "tab"
    ariaControls?: string
    onSelect: VoidFunction
    onClose?: VoidFunction
    closeLabel?: string
    closeTooltip?: JSX.Element
    onDoubleClick?: VoidFunction
    onMiddleClick?: VoidFunction
    tabRef?: (element: HTMLDivElement) => void
  }>,
) {
  const selectAdjacent = (event: KeyboardEvent & { currentTarget: HTMLButtonElement }) => {
    if (props.role !== "tab") return
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return

    const list = event.currentTarget.closest('[data-slot="project-tab-list"]')
    if (!list) return

    const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-slot="project-tab-button"]'))
    if (buttons.length === 0) return

    const current = buttons.indexOf(event.currentTarget)
    const target =
      event.key === "Home"
        ? buttons[0]
        : event.key === "End"
          ? buttons.at(-1)
          : buttons[(current + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length]

    if (!target) return
    event.preventDefault()
    target.focus()
    target.click()
  }

  const closeButton = () => (
    <IconButtonV2
      size="small"
      variant="ghost-muted"
      class="shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      icon={<IconV2 name="xmark-small" />}
      aria-label={props.closeLabel}
      onClick={(event) => {
        event.stopPropagation()
        props.onClose?.()
      }}
    />
  )

  return (
    <div
      ref={props.tabRef}
      data-slot="project-tab"
      data-active={props.active}
      data-motion={props.motion}
      class="group flex h-7 min-w-24 max-w-56 shrink-0 items-center rounded-[10px] px-1"
      classList={{
        "bg-project-selected shadow-soft-control": props.active,
        "hover:bg-project-hover": !props.active,
      }}
      onAuxClick={(event) => {
        if (event.button !== 1 || !props.onMiddleClick) return
        event.preventDefault()
        props.onMiddleClick()
      }}
      onDblClick={() => props.onDoubleClick?.()}
    >
      <button
        type="button"
        data-slot="project-tab-button"
        role={props.role}
        aria-selected={props.role === "tab" ? props.active : undefined}
        aria-controls={props.ariaControls}
        aria-current={props.role ? undefined : props.active ? "page" : undefined}
        tabIndex={props.role === "tab" ? (props.active ? 0 : -1) : undefined}
        class="flex min-w-0 flex-1 items-center gap-1.5 px-1 text-left text-[12px] font-[500]"
        classList={{
          "text-v2-text-text-base": props.active,
          "text-v2-text-text-muted": !props.active,
        }}
        title={props.title}
        onClick={props.onSelect}
        onKeyDown={selectAdjacent}
      >
        {props.children}
      </button>

      <Show when={props.onClose}>
        <Show when={props.closeTooltip} fallback={closeButton()}>
          {(tooltip) => (
            <TooltipV2 value={tooltip()} placement="bottom" gutter={10}>
              {closeButton()}
            </TooltipV2>
          )}
        </Show>
      </Show>
    </div>
  )
}
