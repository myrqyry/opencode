import type { Session } from "@opencode-ai/sdk/v2"
import { ProjectAvatar, type ProjectAvatarShape } from "@opencode-ai/ui/v2/project-avatar-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { IllusionSpinnerV2 } from "@opencode-ai/ui/v2/illusion-spinner-v2"
import { createEffect, createMemo, createResource, createSignal, For, onCleanup, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useCommand } from "@/context/command"
import { useGlobal, type ServerCtx } from "@/context/global"
import { ServerConnection } from "@/context/server"
import { tabKey, type SessionTab, type Tab, useTabs } from "@/context/tabs"
import { displayName, getProjectAvatarSource } from "@/pages/layout/helpers"
import { useProjectColor } from "@/utils/project-color"
import { pathKey } from "@/utils/path-key"
import { Persist, persisted } from "@/utils/persist"

type ResolvedTab = {
  directory: string
  title?: string
}

type ProjectGroup = {
  key: string
  server: ServerConnection.Key
  directory: string
  tabs: Tab[]
  project?: {
    id?: string
    name?: string
    worktree: string
    sandboxes?: string[]
    icon?: { color?: string; url?: string; override?: string; shape?: ProjectAvatarShape }
  }
}

function SessionProjectResolver(props: {
  tab: SessionTab
  serverCtx: () => ServerCtx | undefined
  onResolve: (value: ResolvedTab | undefined) => void
}) {
  const tabs = useTabs()
  const cached = createMemo(() => props.serverCtx()?.sync.session.peek(props.tab.sessionId))
  const [loaded] = createResource(
    () => {
      const ctx = props.serverCtx()
      return ctx ? { id: props.tab.sessionId, ctx } : undefined
    },
    ({ id, ctx }) => ctx.sync.session.resolve(id).catch(() => undefined),
  )
  const session = createMemo<Session | undefined>(() => cached() ?? loaded())

  createEffect(() => {
    const value = session()
    if (!value) {
      const info = tabs.info[tabKey(props.tab)]
      props.onResolve(info?.directory ? { directory: info.directory, title: info.title } : undefined)
      return
    }
    tabs.rememberSessionInfo(props.tab, value)
    props.onResolve({ directory: value.directory, title: value.title })
  })

  return null
}

export function TitlebarProjectStrip(props: {
  tabs: Tab[]
  currentTab: () => Tab | undefined
  onNavigate: (tab: Tab) => void
  onCloseGroup: (tabs: Tab[]) => void
  collapsedContextWidth?: number
}) {
  const global = useGlobal()
  const command = useCommand()
  const projectColor = useProjectColor()
  const [resolved, setResolved] = createStore<Record<string, ResolvedTab | undefined>>({})
  const [motionProject, setMotionProject] = createSignal<string>()
  let motionTimer: number | undefined
  const [recent, setRecent] = persisted(
    Persist.window("project-tabs.last-active"),
    createStore<Record<string, string | undefined>>({}),
  )

  const directoryFor = (tab: Tab) => {
    if (tab.type === "draft" || tab.type === "workspace") return tab.directory
    return resolved[tabKey(tab)]?.directory
  }

  const serverCtx = (key: ServerConnection.Key) => {
    const conn = global.servers.list().find((item) => ServerConnection.key(item) === key)
    return conn ? global.ensureServerCtx(conn) : undefined
  }

  const projectFor = (server: ServerConnection.Key, directory: string) => {
    const target = pathKey(directory)
    return serverCtx(server)
      ?.projects.list()
      .find(
        (project) =>
          pathKey(project.worktree) === target ||
          project.sandboxes?.some((sandbox) => pathKey(sandbox) === target),
      )
  }

  const groups = createMemo<ProjectGroup[]>(() => {
    const grouped = new Map<string, ProjectGroup>()
    for (const tab of props.tabs) {
      const directory = directoryFor(tab)
      if (!directory) continue
      const project = projectFor(tab.server, directory)
      const identity = project?.id ?? pathKey(project?.worktree ?? directory)
      const key = `${tab.server}\0${identity}`
      const existing = grouped.get(key)
      if (existing) {
        existing.tabs.push(tab)
        continue
      }
      grouped.set(key, {
        key,
        server: tab.server,
        directory: project?.worktree ?? directory,
        tabs: [tab],
        project,
      })
    }
    return [...grouped.values()]
  })

  const activeGroup = createMemo(() => {
    const current = props.currentTab()
    if (!current) return
    const key = tabKey(current)
    return groups().find((group) => group.tabs.some((tab) => tabKey(tab) === key))
  })

  createEffect(() => {
    const current = props.currentTab()
    const group = activeGroup()
    if (!current || !group) return
    const key = tabKey(current)
    if (recent[group.key] !== key) setRecent(group.key, key)

    setMotionProject(group.key)
    if (motionTimer !== undefined) window.clearTimeout(motionTimer)
    motionTimer = window.setTimeout(() => {
      motionTimer = undefined
      setMotionProject(undefined)
    }, 380)
  })
  onCleanup(() => {
    if (motionTimer !== undefined) window.clearTimeout(motionTimer)
  })

  const activeProjectName = createMemo(() => {
    const group = activeGroup()
    return group ? displayName(group.project ?? { worktree: group.directory }) : "Projects"
  })
  const activeProjectAccent = createMemo(() => {
    const group = activeGroup()
    return group ? projectColor.resolve(group.project ?? { worktree: group.directory }) : undefined
  })

  const navigateGroup = (group: ProjectGroup) => {
    const preferred = recent[group.key]
    const tab = group.tabs.find((item) => tabKey(item) === preferred) ?? group.tabs[group.tabs.length - 1]
    if (tab) props.onNavigate(tab)
  }

  const selectAdjacent = (offset: -1 | 1) => {
    const list = groups()
    if (list.length === 0) return
    const active = activeGroup()
    const index = active ? list.findIndex((group) => group.key === active.key) : -1
    const next = index < 0 ? list[0] : list[(index + offset + list.length) % list.length]
    if (next) navigateGroup(next)
  }

  command.register("project-tab-cycle", () => [
    {
      id: "tab.prev",
      category: "tab",
      title: "",
      keybind: "mod+option+ArrowLeft,ctrl+shift+tab",
      hidden: true,
      onSelect: () => selectAdjacent(-1),
    },
    {
      id: "tab.next",
      category: "tab",
      title: "",
      keybind: "mod+option+ArrowRight,ctrl+tab",
      hidden: true,
      onSelect: () => selectAdjacent(1),
    },
  ])

  return (
    <>
      <For each={props.tabs}>
        {(tab) => (
          <Show when={tab.type === "session"}>
            <SessionProjectResolver
              tab={tab as SessionTab}
              serverCtx={() => serverCtx(tab.server)}
              onResolve={(value) => setResolved(tabKey(tab), value)}
            />
          </Show>
        )}
      </For>

      <Show when={props.collapsedContextWidth && props.collapsedContextWidth > 0}>
        <div
          data-slot="collapsed-project-context"
          data-project-tint={activeProjectAccent() ? "" : undefined}
          style={{
            width: `${props.collapsedContextWidth}px`,
            "--project-accent": activeProjectAccent(),
          }}
          class="absolute inset-y-0 left-0 flex min-w-0 items-center gap-2 border-r border-v2-border-border-muted bg-v2-background-bg-deep px-2"
        >
          <Show when={activeGroup()} keyed>
            {(group) => (
              <ProjectAvatar
                fallback={activeProjectName()}
                src={getProjectAvatarSource(group.project?.id, group.project?.icon)}
                variant={activeProjectAccent()}
                shape={group.project?.icon?.shape}
                class="size-4 shrink-0"
              />
            )}
          </Show>
          <span class="min-w-0 flex-1 truncate text-[13px] font-[600] tracking-[-0.01em] text-v2-text-text-base">
            {activeProjectName()}
          </span>
        </div>
      </Show>

      <div
        data-slot="titlebar-project-tabs"
        class="relative min-w-0 overflow-x-auto no-scrollbar [app-region:no-drag]"
      >
        <div class="flex min-w-0 flex-row items-center gap-1.5">
          <For each={groups()}>
            {(group, index) => {
              const name = createMemo(() => displayName(group.project ?? { worktree: group.directory }))
              const accent = createMemo(() => projectColor.resolve(group.project ?? { worktree: group.directory }))
              const active = createMemo(() => activeGroup()?.key === group.key)
              // A project tab spans several chats, so it reports "work in flight" when any of
              // its open session tabs is mid-turn. Presence of the mark is the working signal;
              // an unmarked tab is idle. Draft and workspace tabs have no session to be busy.
              const working = createMemo(() => {
                const sync = serverCtx(group.server)?.sync
                if (!sync) return false
                return group.tabs.some((tab) => tab.type === "session" && sync.session.data.session_working(tab.sessionId))
              })

              command.register(() => {
                const number = index() + 1
                if (number < 1 || number > 9) return []
                return [
                  {
                    id: `tab.${number}`,
                    category: "tab",
                    title: "",
                    keybind: `mod+${number}`,
                    hidden: true,
                    onSelect: () => navigateGroup(group),
                  },
                ]
              })

              return (
                <div
                  data-titlebar-project-tab
                  data-project-key={group.key}
                  data-active={active()}
                  data-motion={motionProject() === group.key ? "settle" : undefined}
                  data-project-tint={accent() ? "" : undefined}
                  style={accent() ? `--project-accent:${accent()}` : undefined}
                  class="group relative flex h-7 w-52 min-w-28 max-w-52 shrink items-center gap-1.5 overflow-hidden rounded-[10px] px-1.5 text-v2-text-text-faint hover:bg-project-hover data-[active=true]:bg-project-selected-strong data-[active=true]:text-v2-text-text-base data-[active=true]:shadow-soft-control"
                >
                  <button
                    type="button"
                    class="flex h-full min-w-0 flex-1 items-center gap-1.5 text-left"
                    onMouseDown={(event) => {
                      if (event.button !== 0) return
                      navigateGroup(group)
                    }}
                    aria-current={active() ? "page" : undefined}
                    aria-busy={working()}
                    aria-label={`Open project ${name()}`}
                  >
                    <ProjectAvatar
                      fallback={name()}
                      src={getProjectAvatarSource(group.project?.id, group.project?.icon)}
                      variant={accent()}
                      shape={group.project?.icon?.shape}
                      class="size-4 shrink-0"
                    />
                    <span class="min-w-0 flex-1 truncate text-[13px] font-medium">{name()}</span>
                    <Show when={working()}>
                      <IllusionSpinnerV2 class="size-4 shrink-0" />
                    </Show>
                    <Show when={group.tabs.length > 1}>
                      <span class="shrink-0 text-[10px] text-v2-text-text-faint">{group.tabs.length}</span>
                    </Show>
                  </button>
                  <IconButtonV2
                    size="small"
                    variant="ghost-muted"
                    class="relative z-10 opacity-0 group-hover:opacity-100 group-data-[active=true]:opacity-100"
                    icon={<IconV2 name="xmark-small" />}
                    aria-label={`Close project tab ${name()}`}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                    }}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      props.onCloseGroup(group.tabs)
                    }}
                  />
                </div>
              )
            }}
          </For>
        </div>
      </div>
    </>
  )
}
