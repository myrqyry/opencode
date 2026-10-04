import { createMemo, Show } from "solid-js"
import type { JSX } from "solid-js"
import { useSortable } from "@dnd-kit/solid/sortable"
import { KeybindV2 } from "@opencode-ai/ui/v2/keybind-v2"
import { useFile } from "@/context/file"
import { useLanguage } from "@/context/language"
import { useCommand } from "@/context/command"
import { ProjectTab } from "./project-tab"
import { FileVisual } from "./session-sortable-tab"

export function SortableTabV2(props: {
  tab: string
  index: () => number
  active: boolean
  temporary?: boolean
  onSelect: (tab: string) => void
  onTabClose: (tab: string) => void
  onTabDoubleClick?: (tab: string) => void
}): JSX.Element {
  const file = useFile()
  const language = useLanguage()
  const command = useCommand()
  const closeTabKeybind = createMemo(() => command.keybindParts("tab.close"))
  const sortable = useSortable({
    get id() {
      return props.tab
    },
    get index() {
      return props.index()
    },
  })
  const path = createMemo(() => file.pathFromTab(props.tab))
  const content = createMemo(() => {
    const value = path()
    if (!value) return
    return <FileVisual path={value} temporary={props.temporary} />
  })

  return (
    <ProjectTab
      tabRef={sortable.ref}
      role="tab"
      active={props.active}
      onSelect={() => props.onSelect(props.tab)}
      onClose={() => props.onTabClose(props.tab)}
      closeLabel={language.t("common.closeTab")}
      closeTooltip={
        <>
          {language.t("common.closeTab")}
          <Show when={closeTabKeybind().length > 0}>
            <KeybindV2 keys={closeTabKeybind()} variant="neutral" />
          </Show>
        </>
      }
      onMiddleClick={() => props.onTabClose(props.tab)}
      onDoubleClick={() => props.onTabDoubleClick?.(props.tab)}
    >
      <Show when={content()}>{(value) => value()}</Show>
    </ProjectTab>
  )
}
