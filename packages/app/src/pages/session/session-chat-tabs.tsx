import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { For, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js"
import { useLayout } from "@/context/layout"
import { type ServerConnection } from "@/context/server"
import { tabKey, type Tab, useTabs } from "@/context/tabs"
import { useSync } from "@/context/sync"
import { useLanguage } from "@/context/language"
import { pathKey } from "@/utils/path-key"
import { ProjectTab, ProjectTabStrip } from "@/components/session"

export function SessionChatTabs(props: {
  server: ServerConnection.Key
  directory: string
}) {
  const tabs = useTabs()
  const layout = useLayout()
  const sync = useSync()
  const language = useLanguage()
  const [motionKey, setMotionKey] = createSignal<string>()
  let motionTimer: number | undefined

  const directoryFor = (tab: Tab) => {
    if (tab.type === "draft" || tab.type === "workspace") return tab.directory
    return tabs.info[tabKey(tab)]?.directory ?? sync().session.get(tab.sessionId)?.directory
  }

  const projectDirectories = createMemo(() => {
    const project = sync().project
    return new Set(
      [project?.worktree ?? props.directory, ...(project?.sandboxes ?? [])].map((directory) => pathKey(directory)),
    )
  })

  const projectTabs = createMemo(() =>
    tabs.store.filter((tab) => {
      if (tab.server !== props.server) return false
      const directory = directoryFor(tab)
      return !!directory && projectDirectories().has(pathKey(directory))
    }),
  )

  const activeKey = createMemo(() => {
    const route = layout.route()
    if (route.type === "draft") return "draft:" + route.draftID
    if (route.type === "workspace") {
      const current = projectTabs().find(
        (tab) =>
          tab.type === "workspace" &&
          tab.server === route.server &&
          pathKey(tab.directory) === pathKey(route.directory) &&
          tab.view === route.view,
      )
      return current ? tabKey(current) : undefined
    }
    if (route.type === "session") {
      let rootID = route.sessionId
      let session = sync().session.get(rootID)
      const seen = new Set<string>()
      while (session?.parentID && !seen.has(session.id)) {
        seen.add(session.id)
        rootID = session.parentID
        session = sync().session.get(rootID)
      }
      const current = projectTabs().find((tab) => tab.type === "session" && tab.sessionId === rootID)
      return current ? tabKey(current) : undefined
    }
    return undefined
  })

  createEffect(() => {
    const key = activeKey()
    if (!key) return
    setMotionKey(key)
    if (motionTimer !== undefined) window.clearTimeout(motionTimer)
    motionTimer = window.setTimeout(() => {
      motionTimer = undefined
      setMotionKey(undefined)
    }, 320)
  })
  onCleanup(() => {
    if (motionTimer !== undefined) window.clearTimeout(motionTimer)
  })

  const workspaceIcon = (tab: Tab) => {
    if (tab.type !== "workspace") return
    if (tab.view === "settings") return "settings-gear" as const
    if (tab.view === "models") return "models" as const
    if (tab.view === "providers") return "providers" as const
    return "skills" as const
  }

  const title = (tab: Tab) => {
    if (tab.type === "draft") return language.t("command.session.new")
    if (tab.type === "workspace") {
      if (tab.view === "settings") return "Settings"
      if (tab.view === "models") return "Models"
      if (tab.view === "providers") return "Providers"
      return "Skills"
    }
    return tabs.info[tabKey(tab)]?.title ?? sync().session.get(tab.sessionId)?.title ?? tab.sessionId
  }

  const select = (tab: Tab) => {
    if (typeof document === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tabs.select(tab)
      return
    }

    const start = (
      document as Document & {
        startViewTransition?: (callback: () => void | Promise<void>) => { finished: Promise<void> }
      }
    ).startViewTransition
    if (!start) {
      tabs.select(tab)
      return
    }
    start.call(document, () => tabs.select(tab))
  }

  const close = (tab: Tab) => {
    const index = tabs.store.findIndex((item) => tabKey(item) === tabKey(tab))
    if (index !== -1) tabs.closeTab(index)
  }

  return (
    <ProjectTabStrip
      end={
        <div class="flex shrink-0 items-center gap-1">
          <Show when={props.directory}>
            <IconButtonV2
              size="small"
              variant="ghost-muted"
              class="shrink-0"
              icon={<IconV2 name="plus" />}
              aria-label={language.t("command.session.new")}
              onClick={() => void tabs.newDraft({ server: props.server, directory: props.directory })}
            />
          </Show>
          <div id="opencode-chat-tab-actions" class="contents" />
        </div>
      }
    >
      <For each={projectTabs()}>
        {(tab) => {
          const key = tabKey(tab)
          const active = () => activeKey() === key
          return (
            <ProjectTab
              active={active()}
              motion={motionKey() === key ? "settle" : undefined}
              title={title(tab)}
              onSelect={() => select(tab)}
              onClose={() => close(tab)}
              closeLabel={language.t("common.closeTab")}
            >
              <Show when={workspaceIcon(tab)}>
                {(icon) => (
                  <span
                    class="flex size-5 shrink-0 items-center justify-center rounded-[7px]"
                    classList={{
                      "bg-project-selected-strong text-v2-icon-icon-base": active(),
                      "bg-project-hover text-v2-icon-icon-muted": !active(),
                    }}
                    aria-hidden="true"
                  >
                    <IconV2 name={icon()} size="small" />
                  </span>
                )
}
              </Show>
              <span class="min-w-0 truncate">{title(tab)}</span>
            </ProjectTab>
          )
        }}
      </For>
    </ProjectTabStrip>
  )
}
