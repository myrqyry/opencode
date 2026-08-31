import { createMemo, For, Show } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { ProjectAvatar } from "@opencode-ai/ui/v2/project-avatar-v2"
import { useDirectoryPicker } from "@/components/directory-picker"
import { getProjectAvatarVariant, type LocalProject, useLayout } from "@/context/layout"
import { useServer } from "@/context/server"
import { useServerSync } from "@/context/server-sync"
import { useTabs } from "@/context/tabs"
import { createHomeController } from "@/pages/home/home-controller"
import { displayName, getProjectAvatarSource, sortedRootSessions } from "@/pages/layout/helpers"

const collapsedWidth = 52
const minimumWidth = 240
const maximumWidth = 420

export function ProjectSessionSidebar() {
  const layout = useLayout()
  const server = useServer()
  const navigate = useNavigate()
  const dialog = useDialog()
  const pickDirectory = useDirectoryPicker()
  const home = createHomeController()

  const width = createMemo(() => {
    if (!layout.sidebar.opened()) return collapsedWidth
    return Math.min(maximumWidth, Math.max(minimumWidth, layout.sidebar.width()))
  })

  const openProject = () => {
    const conn = server.current
    if (!conn) return

    pickDirectory({
      server: conn,
      title: "Open project",
      multiple: true,
      onSelect: (result) => {
        if (!result) return
        const directories = Array.isArray(result) ? result : [result]
        if (directories.length === 0) return
        home.project.add(conn, directories)
        navigate("/")
      },
    })
  }

  const openSettings = () => {
    void import("@/components/settings-v2").then((module) => {
      void dialog.show(() => <module.DialogSettings />)
    })
  }

  return (
    <aside
      class="hidden md:flex shrink-0 min-h-0 border-r border-v2-border-border-base bg-v2-background-bg-base transition-[width] duration-150"
      style={{ width: `${width()}px` }}
      aria-label="Projects and sessions"
    >
      <div class="flex h-full w-full min-w-0 flex-col">
        <div
          class="flex h-11 shrink-0 items-center border-b border-v2-border-border-base"
          classList={{
            "justify-center px-1.5": !layout.sidebar.opened(),
            "justify-between gap-2 px-2": layout.sidebar.opened(),
          }}
        >
          <Show when={layout.sidebar.opened()}>
            <button
              type="button"
              class="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-[12px] font-[530] text-v2-text-text-muted hover:bg-v2-overlay-simple-overlay-hover hover:text-v2-text-text-base"
              onClick={() => navigate("/")}
            >
              Projects
            </button>
            <IconButtonV2
              type="button"
              variant="ghost-muted"
              size="large"
              class="!w-9 shrink-0"
              icon={<IconV2 name="plus" />}
              onClick={openProject}
              aria-label="Open project"
              title="Open project"
            />
          </Show>
          <IconButtonV2
            type="button"
            variant="ghost-muted"
            size="large"
            class="!w-9 shrink-0"
            icon={<IconV2 name={layout.sidebar.opened() ? "collapse" : "menu"} />}
            onClick={layout.sidebar.toggle}
            aria-label={layout.sidebar.opened() ? "Collapse project sidebar" : "Expand project sidebar"}
          />
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1.5">
          <For each={layout.projects.list()}>
            {(project) => <ProjectSection project={project} expanded={layout.sidebar.opened()} />}
          </For>
        </div>

        <div
          class="shrink-0 border-t border-v2-border-border-base p-1.5"
          classList={{
            "flex flex-col items-center gap-1": !layout.sidebar.opened(),
            "flex items-center justify-end": layout.sidebar.opened(),
          }}
        >
          <Show when={!layout.sidebar.opened()}>
            <IconButtonV2
              type="button"
              variant="ghost-muted"
              size="large"
              class="!w-9 shrink-0"
              icon={<IconV2 name="plus" />}
              onClick={openProject}
              aria-label="Open project"
              title="Open project"
            />
          </Show>
          <IconButtonV2
            type="button"
            variant="ghost-muted"
            size="large"
            class="!w-9 shrink-0"
            icon={<IconV2 name="settings-gear" />}
            onClick={openSettings}
            aria-label="Settings"
          />
        </div>
      </div>
    </aside>
  )
}

function ProjectSection(props: { project: LocalProject; expanded: boolean }) {
  const layout = useLayout()
  const server = useServer()
  const serverSync = useServerSync()
  const tabs = useTabs()

  const store = createMemo(() => serverSync().child(props.project.worktree, { bootstrap: false })[0])
  const sessions = createMemo(() => sortedRootSessions(store(), Date.now()).slice(0, 24))
  const route = layout.route
  const activeSession = createMemo(() => {
    const current = route()
    return current.type === "session" ? current.sessionId : undefined
  })
  const activeProject = createMemo(() => {
    const id = activeSession()
    return !!id && (store().session ?? []).some((session) => session.id === id)
  })

  const toggle = () => {
    if (!props.expanded) {
      layout.sidebar.open()
      layout.projects.expand(props.project.worktree)
      return
    }
    if (props.project.expanded) layout.projects.collapse(props.project.worktree)
    else layout.projects.expand(props.project.worktree)
  }

  const openSession = (sessionID: string) => {
    server.projects.touch(props.project.worktree)
    const tab = tabs.addSessionTab({ server: server.key, sessionId: sessionID })
    tabs.select(tab)
  }

  return (
    <div class="px-1.5">
      <button
        type="button"
        class="group flex h-9 w-full min-w-0 items-center rounded-md transition-colors hover:bg-v2-overlay-simple-overlay-hover"
        classList={{
          "justify-center px-0": !props.expanded,
          "gap-2 px-2": props.expanded,
          "bg-v2-overlay-simple-overlay-hover": activeProject(),
        }}
        onClick={toggle}
        title={displayName(props.project)}
        aria-expanded={props.expanded ? props.project.expanded : undefined}
      >
        <ProjectAvatar
          fallback={displayName(props.project)}
          src={getProjectAvatarSource(props.project.id, props.project.icon)}
          variant={getProjectAvatarVariant(props.project.icon?.color)}
          class="!size-7 shrink-0 [&_[data-slot=project-avatar-surface]]:!rounded-[6px]"
        />
        <Show when={props.expanded}>
          <span class="min-w-0 flex-1 truncate text-left text-[13px] font-[500] text-v2-text-text-base">
            {displayName(props.project)}
          </span>
          <IconV2
            name="chevron-down"
            class="shrink-0 text-v2-icon-icon-muted transition-transform"
            classList={{ "-rotate-90": !props.project.expanded }}
          />
        </Show>
      </button>

      <Show when={props.expanded && props.project.expanded}>
        <div class="mb-1 ml-9 flex min-w-0 flex-col border-l border-v2-border-border-base pl-1.5">
          <Show
            when={sessions().length > 0}
            fallback={
              <div class="px-2 py-1.5 text-[11px] text-v2-text-text-muted">No sessions yet</div>
            }
          >
            <For each={sessions()}>
              {(session) => (
                <button
                  type="button"
                  class="flex h-7 min-w-0 items-center rounded-md px-2 text-left text-[12px] transition-colors hover:bg-v2-overlay-simple-overlay-hover"
                  classList={{
                    "bg-v2-overlay-simple-overlay-hover text-v2-text-text-strong": activeSession() === session.id,
                    "text-v2-text-text-muted": activeSession() !== session.id,
                  }}
                  onClick={() => openSession(session.id)}
                  title={session.title || session.id}
                >
                  <span class="truncate">{session.title || session.id.slice(0, 8)}</span>
                </button>
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  )
}
