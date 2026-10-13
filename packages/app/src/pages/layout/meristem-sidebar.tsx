import type { Session } from "@opencode-ai/sdk/v2/client"
import { ProjectAvatar } from "@opencode-ai/ui/v2/project-avatar-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { IllusionSpinnerV2 } from "@opencode-ai/ui/v2/illusion-spinner-v2"
import { TooltipV2 } from "@opencode-ai/ui/v2/tooltip-v2"
import { ResizeHandle } from "@opencode-ai/ui/resize-handle"
import { useParams } from "@solidjs/router"
import { createMediaQuery } from "@solid-primitives/media"
import { createEffect, createMemo, createResource, createSignal, For, Show, type Accessor, type JSX } from "solid-js"
import { createStore } from "solid-js/store"
import { useCommand } from "@/context/command"
import { type LocalProject, useLayout } from "@/context/layout"
import { useProjectColor } from "@/utils/project-color"
import { pathKey } from "@/utils/path-key"
import { useLanguage } from "@/context/language"
import { useNotification } from "@/context/notification"
import { usePlatform } from "@/context/platform"
import { useSettings } from "@/context/settings"
import { ServerConnection, useServer } from "@/context/server"
import { useServerSync } from "@/context/server-sync"
import { useServerSDK } from "@/context/server-sdk"
import { tabKey, type Tab, type WorkspaceView, useTabs } from "@/context/tabs"
import { displayName, getProjectAvatarSource, sortedRootSessions } from "@/pages/layout/helpers"
import { droppedFolderPaths, folderDragItems } from "@/pages/layout/sidebar-folder-drop"
import { showToast } from "@/utils/toast"
import { createHomeController } from "@/pages/home/home-controller"
import { createHomeProjectsController } from "@/pages/home/home-projects-controller"
import { Persist, persisted } from "@/utils/persist"
import { createPathHelpers } from "@/context/file/path"
import { SessionRouteKey, SessionStateKey } from "@/utils/server-scope"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { getFilename } from "@opencode-ai/core/util/path"
import { ChannelIndicator } from "@/components/titlebar"
import "./meristem-sidebar.css"

const SECTION_LABEL = "px-2 text-[11px] font-[600] uppercase tracking-[0.06em] text-v2-text-text-faint"

const SHOW_CHANNEL_INDICATOR = ["beta", "dev"].includes(import.meta.env.VITE_OPENCODE_CHANNEL)

function Section(props: {
  title: string
  open: Accessor<boolean>
  onToggle: () => void
  action?: JSX.Element
  children: JSX.Element
}) {
  return (
    <section class="flex min-w-0 flex-col gap-1">
      <div class="flex h-7 items-center gap-1">
        <button
          type="button"
          class={`${SECTION_LABEL} flex min-w-0 flex-1 items-center gap-1 rounded-[8px] text-left hover:bg-v2-overlay-simple-overlay-hover`}
          data-slot="meristem-section-toggle"
          aria-expanded={props.open()}
          onClick={props.onToggle}
        >
          <span data-slot="meristem-section-chevron" class="flex size-4 shrink-0 items-center justify-center">
            <IconV2 name="chevron-right" size="small" />
          </span>
          <span class="truncate">{props.title}</span>
        </button>
        {props.action}
      </div>
      <Show when={props.open()}>
        <div data-slot="meristem-section-content">{props.children}</div>
      </Show>
    </section>
  )
}
function ProjectMark(props: { project: LocalProject; size?: "small" | "normal" }) {
  const projectColor = useProjectColor()
  const src = createMemo(() => getProjectAvatarSource(props.project.id, props.project.icon))
  const name = createMemo(() => displayName(props.project))
  const sizeClass = () => (props.size === "small" ? "size-5" : "size-7")

  return (
    <ProjectAvatar
      fallback={name()}
      src={src()}
      variant={projectColor.resolve(props.project)}
      shape={props.project.icon?.shape}
      class={`${sizeClass()} shrink-0`}
      aria-label={name()}
    />
  )
}

function SidebarRow(props: {
  icon?: JSX.Element
  label: string
  selected?: boolean
  muted?: boolean
  onClick: () => void
  trailing?: JSX.Element
}) {
  return (
    <button
      type="button"
      data-slot="meristem-sidebar-row"
      data-selected={props.selected ? "true" : undefined}
      class="group flex h-8 w-full min-w-0 items-center gap-2 rounded-[10px] px-2 text-left transition-colors hover:bg-project-hover focus-visible:bg-project-hover focus-visible:outline-none"
      classList={{
        "bg-project-selected text-v2-text-text-base shadow-soft-control": !!props.selected,
        "text-v2-text-text-muted": !props.selected,
        "opacity-70": !!props.muted,
      }}
      onClick={props.onClick}
    >
      <Show when={props.icon}>
        <span class="flex size-5 shrink-0 items-center justify-center">{props.icon}</span>
      </Show>
      <span class="min-w-0 flex-1 truncate text-[13px] [font-weight:440]">{props.label}</span>
      {props.trailing}
    </button>
  )
}

function ProjectSessions(props: {
  project: LocalProject
  expanded: Accessor<boolean>
  search: Accessor<string>
  onOpenSession: (session: Session) => void
  selectedSessionID?: Accessor<string | undefined>
  nested?: boolean
}) {
  const serverSync = useServerSync()
  const notification = useNotification()
  const projectColor = useProjectColor()
  const projectAccent = createMemo(() => projectColor.resolve(props.project))
  const [store, setStore] = serverSync().child(props.project.worktree, { bootstrap: false })
  const sessions = createMemo(() => sortedRootSessions(store, Date.now()))
  const [shown, setShown] = createSignal(5)
  const filtered = createMemo(() => {
    const query = props.search().trim().toLowerCase()
    if (!query) return sessions()
    return sessions().filter((session) => (session.title ?? "").toLowerCase().includes(query))
  })
  const visible = createMemo(() => filtered().slice(0, shown()))
  const hasMore = createMemo(() => store.sessionTotal > sessions().length || filtered().length > shown())

  createEffect(() => {
    if (!props.expanded()) return
    serverSync().child(props.project.worktree, { bootstrap: true })
  })

  const loadMore = async () => {
    const next = shown() + 5
    setShown(next)
    if (filtered().length >= next || store.sessionTotal <= sessions().length) return
    setStore("limit", (limit) => Math.max(limit ?? 0, next + 5))
    await serverSync().project.loadSessions(props.project.worktree)
  }

  return (
    <div
      data-slot="project-sessions"
      data-project-tint={projectAccent() ? "" : undefined}
      style={projectAccent() ? `--project-accent:${projectAccent()}` : undefined}
      class="flex min-w-0 flex-col gap-px"
      classList={{ "ml-5 border-l border-project-outline pl-2": props.nested !== false }}
    >
      <For each={visible()}>
        {(session) => (
          <SidebarRow
            label={session.title || session.id}
            selected={props.selectedSessionID?.() === session.id}
            onClick={() => props.onOpenSession(session)}
            icon={
              <Show
                when={serverSync().session.data.session_working(session.id)}
                fallback={
                  <IconV2
                    name={notification.session.unseenCount(session.id) > 0 ? "chat-filled" : "chat"}
                    size="small"
                  />
                }
              >
                <IllusionSpinnerV2 class="size-4" />
              </Show>
            }
          />
        )}
      </For>
      <Show when={hasMore()}>
        <button
          type="button"
          class="h-7 rounded-[5px] px-2 text-left text-[12px] text-v2-text-text-faint hover:bg-v2-overlay-simple-overlay-hover"
          onClick={() => void loadMore()}
        >
          Load more
        </button>
      </Show>
    </div>
  )
}

function ProjectTreeRow(props: {
  project: LocalProject
  expanded: Accessor<boolean>
  selected: Accessor<boolean>
  search: Accessor<string>
  onToggle: () => void
  onOpen: () => void
  onOpenSession: (session: Session) => void
  selectedSessionID?: Accessor<string | undefined>
  onNewSession: () => void
  onSettings: () => void
  onRemove: () => void
}) {
  const projectColor = useProjectColor()
  const name = () => displayName(props.project)
  const projectAccent = createMemo(() => projectColor.resolve(props.project))

  return (
    <div
      class="group/project flex min-w-0 flex-col gap-px rounded-[12px]"
      data-meristem-project
      data-expanded={props.expanded()}
      data-project-tint={projectAccent() ? "" : undefined}
      style={projectAccent() ? `--project-accent:${projectAccent()}` : undefined}
    >
      <div class="relative min-w-0">
        <button
          type="button"
          data-slot="project-row"
          data-selected={props.selected()}
          class="flex h-8 w-full min-w-0 items-center gap-1 rounded-[10px] py-0 pl-6 pr-1.5 text-left text-v2-text-text-muted transition-colors hover:bg-project-hover focus-visible:outline-none"
          classList={{
            "bg-project-selected text-v2-text-text-base shadow-soft-control": props.selected(),
          }}
          onClick={props.onOpen}
        >
          <ProjectMark project={props.project} size="small" />
          <span class="min-w-0 flex-1 truncate text-[13px] [font-weight:530]">{name()}</span>
        </button>

        <button
          type="button"
          data-slot="project-chevron"
          aria-expanded={props.expanded()}
          aria-label={`${props.expanded() ? "Collapse" : "Expand"} ${name()} chats`}
          class="absolute left-1 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-[4px] text-v2-icon-icon-muted hover:bg-v2-overlay-simple-overlay-hover focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:outline-none"
          onClick={props.onToggle}
        >
          <IconV2 name="chevron-right" size="small" />
        </button>

        {/* No -translate-y-1/2 here: this element's vertical centring is owned by the
            project-actions transform in meristem-sidebar.css. Tailwind v4 emits translate
            utilities to the `translate` property, which composes with `transform` rather than
            overriding it, so having both applied the -50% offset twice. */}
        <div
          data-slot="project-actions"
          class="pointer-events-none absolute right-1 top-1/2 z-10 flex items-center gap-px opacity-0 transition-opacity group-hover/project:opacity-100 group-focus-within/project:opacity-100"
        >
          <TooltipV2 placement="top" value="New chat">
            <button
              type="button"
              class="pointer-events-auto flex size-6 items-center justify-center rounded-[5px] text-v2-icon-icon-muted hover:bg-v2-overlay-simple-overlay-hover hover:text-v2-icon-icon-base focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:text-v2-icon-icon-base focus-visible:outline-none"
              aria-label={`New chat in ${name()}`}
              onClick={(event) => {
                event.stopPropagation()
                props.onNewSession()
              }}
            >
              <IconV2 name="new-chat" size="small" />
            </button>
          </TooltipV2>
          <TooltipV2 placement="top" value="Project settings">
            <button
              type="button"
              class="pointer-events-auto flex size-6 items-center justify-center rounded-[5px] text-v2-icon-icon-muted hover:bg-v2-overlay-simple-overlay-hover hover:text-v2-icon-icon-base focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:text-v2-icon-icon-base focus-visible:outline-none"
              aria-label={`Project settings for ${name()}`}
              onClick={(event) => {
                event.stopPropagation()
                props.onSettings()
              }}
            >
              <IconV2 name="settings-gear" size="small" />
            </button>
          </TooltipV2>
          <TooltipV2 placement="top" value="Remove from sidebar">
            <button
              type="button"
              class="pointer-events-auto flex size-6 items-center justify-center rounded-[5px] text-v2-icon-icon-muted hover:bg-v2-overlay-simple-overlay-hover hover:text-v2-icon-icon-base focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:text-v2-icon-icon-base focus-visible:outline-none"
              aria-label={`Remove ${name()} from sidebar`}
              onClick={(event) => {
                event.stopPropagation()
                props.onRemove()
              }}
            >
              <IconV2 name="xmark-small" size="small" />
            </button>
          </TooltipV2>
        </div>
      </div>

      <Show when={props.expanded()}>
        <ProjectSessions
          project={props.project}
          expanded={props.expanded}
          search={props.search}
          onOpenSession={props.onOpenSession}
          selectedSessionID={props.selectedSessionID}
          nested
        />
      </Show>
    </div>
  )
}
function CollapsedRail(props: {
  projects: Accessor<LocalProject[]>
  onToggle: () => void
  onNewSession: () => void
  onSettings: () => void
  onProject: (project: LocalProject) => void
  dropActive: Accessor<boolean>
  onDragOver: (event: DragEvent) => void
  onDragLeave: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
  debugTools?: { visible: boolean; toggle: () => void }
}) {
  return (
    <aside
      data-component="meristem-sidebar-rail"
      class="flex h-full w-12 shrink-0 flex-col items-center border-r border-v2-border-border-muted bg-v2-background-bg-deep"
      classList={{ "outline-solid outline-2 outline-v2-border-border-focus outline-offset-[-2px]": props.dropActive() }}
      onDragOver={props.onDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
    >
      <div class="flex h-9 w-full shrink-0 items-center justify-center border-b border-v2-border-border-muted">
        <TooltipV2 placement="right" value="Open sidebar">
          <IconButtonV2
            variant="ghost-muted"
            size="small"
            icon={<IconV2 name="sidebar-left" size="small" />}
            aria-label="Open sidebar"
            onClick={props.onToggle}
          />
        </TooltipV2>
      </div>
      <div class="flex min-h-0 w-full flex-1 flex-col items-center py-2">
        <TooltipV2 placement="right" value="New session">
          <IconButtonV2
            variant="ghost-muted"
            size="small"
            icon={<IconV2 name="new-chat" size="small" />}
            aria-label="New session"
            onClick={props.onNewSession}
          />
        </TooltipV2>
        <div class="my-2 h-px w-7 bg-v2-border-border-muted" />
        <div class="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto py-1">
          <For each={props.projects()}>
            {(project) => (
              <TooltipV2 placement="right" value={displayName(project)}>
                <button
                  type="button"
                  data-slot="collapsed-project-button"
                  class="flex size-8 items-center justify-center rounded-[10px] hover:bg-v2-overlay-simple-overlay-hover"
                  onClick={() => props.onProject(project)}
                  aria-label={displayName(project)}
                >
                  <ProjectMark project={project} />
                </button>
              </TooltipV2>
            )}
          </For>
        </div>
        <TooltipV2 placement="right" value="Settings">
          <IconButtonV2
            variant="ghost-muted"
            size="small"
            icon={<IconV2 name="settings-gear" size="small" />}
            aria-label="Settings"
            onClick={props.onSettings}
          />
        </TooltipV2>
        <Show when={SHOW_CHANNEL_INDICATOR}>
          <div class="mt-2 flex w-full justify-center">
            <ChannelIndicator debugTools={props.debugTools} />
          </div>
        </Show>
      </div>
    </aside>
  )
}

export function MeristemSidebar(props: { debugTools?: { visible: boolean; toggle: () => void } }) {
  const layout = useLayout()
  const command = useCommand()
  const tabs = useTabs()
  const server = useServer()
  const serverSync = useServerSync()
  const serverSDK = useServerSDK()
  const language = useLanguage()
  const platform = usePlatform()
  const settings = useSettings()
  const params = useParams<{ id?: string }>()
  const mobile = createMediaQuery("(max-width: 1279px)")
  const home = createHomeController()
  const projectsController = createHomeProjectsController(home)
  const [ui, setUi] = persisted(
    Persist.global("meristem.sidebar.v1"),
    createStore({
      search: "",
      sections: { workspace: true, projects: true },
    }),
  )
  const [folderDropActive, setFolderDropActive] = createSignal(false)
  const projects = createMemo(() => layout.projects.list())
  const projectByDirectory = createMemo(
    () =>
      new Map(
        projects().flatMap((project) =>
          [project.worktree, ...(project.sandboxes ?? [])].map((directory) => [directory, project] as const),
        ),
      ),
  )
  const currentTab = createMemo(() => {
    const route = layout.route()
    if (route.type === "session")
      return tabs.store.find(
        (tab) =>
          tab.type === "session" && tab.server === (route.server ?? server.key) && tab.sessionId === route.sessionId,
      )
    if (route.type === "draft") return tabs.store.find((tab) => tab.type === "draft" && tab.draftID === route.draftID)
    if (route.type === "workspace")
      return tabs.store.find(
        (tab) =>
          tab.type === "workspace" &&
          tab.server === route.server &&
          tab.directory === route.directory &&
          tab.view === route.view,
      )
  })
  const currentDirectory = createMemo(() => {
    const tab = currentTab()
    return (
      (params.id ? serverSync().session.get(params.id)?.directory : undefined) ??
      (tab?.type === "draft" || tab?.type === "workspace"
        ? tab.directory
        : tab
          ? tabs.info[tabKey(tab)]?.directory
          : undefined) ??
      layout.home.selection().directory ??
      home.project.newSession()?.worktree
    )
  })
  const openWorkspaceView = (view: WorkspaceView) => {
    const directory = currentDirectory()
    if (!directory) return
    const route = layout.route()
    const tab = currentTab()
    const targetServer = tab?.server ?? (route.type === "workspace" ? route.server : server.key)
    tabs.openWorkspaceTab({ server: targetServer, directory, view })
    if (mobile()) layout.mobileSidebar.hide()
  }
  const workspaceView = createMemo(() => {
    const route = layout.route()
    return route.type === "workspace" ? route.view : undefined
  })
  const searchQuery = createMemo(() => ui.search.trim())
  const [fileMatches] = createResource(
    () => {
      const directory = currentDirectory()
      const query = searchQuery()
      if (!params.id || !directory || query.length < 2) return
      return `${directory}\n${query}`
    },
    async (key) => {
      const split = key.lastIndexOf("\n")
      const directory = key.slice(0, split)
      const query = key.slice(split + 1)
      const result = await serverSDK().api.file.find({
        location: { directory },
        query,
        type: "file",
        limit: 8,
      })
      const paths = createPathHelpers(() => directory)
      return result.data.map((entry) => paths.normalize(entry.path))
    },
  )

  const currentRootSessionID = createMemo(() => {
    if (!params.id) return
    let id = params.id
    let session = serverSync().session.get(id)
    const seen = new Set<string>()
    while (session?.parentID && !seen.has(session.id)) {
      seen.add(session.id)
      id = session.parentID
      session = serverSync().session.get(id)
    }
    return id
  })
  const activeProject = createMemo<LocalProject | undefined>(() => {
    const directory = currentDirectory()
    if (!directory) return

    const listed = projectByDirectory().get(directory)
    if (listed) return listed

    const metadata = serverSync().data.project.find((project) => project.worktree === directory)
    return metadata ? { ...metadata, worktree: directory, expanded: false } : { worktree: directory, expanded: false }
  })
  const sidebarWidth = createMemo(() => Math.max(200, layout.sidebar.width()))
  const sidebarMax = () =>
    typeof window === "undefined" ? 720 : Math.max(320, Math.min(720, window.innerWidth * 0.45))

  const selectedProject = (project: LocalProject) => layout.home.selection().directory === project.worktree
  const expanded = (project: LocalProject) => layout.sidebar.workspaces(project.worktree)

  const closeMobile = () => {
    if (mobile()) layout.mobileSidebar.hide()
  }

  const collapseSidebar = () => {
    if (mobile()) {
      layout.mobileSidebar.hide()
      return
    }
    layout.sidebar.toggle()
  }

  const openSession = (session: Session) => {
    const tab = tabs.addSessionTab({ server: server.key, sessionId: session.id })
    tabs.select(tab)
    closeMobile()
  }

  const newSessionFor = (project: LocalProject) => {
    void tabs.newDraft({ server: server.key, directory: project.worktree })
    closeMobile()
  }

  const newSession = () => {
    const project = activeProject()
    if (project) {
      newSessionFor(project)
      return
    }
    home.project.openNewSession()
    closeMobile()
  }

  const toggleProject = (project: LocalProject) => {
    const next = !expanded(project)()
    layout.sidebar.setWorkspaces(project.worktree, next)
    layout.home.setSelection({ server: server.key, directory: project.worktree })
  }

  // Activating a project means "take me into its work": land on the tab already open for it,
  // or start one, and expand the project so its previous chats are visible alongside.
  const openProject = (project: LocalProject) => {
    const directories = new Set([project.worktree, ...(project.sandboxes ?? [])].map(pathKey))
    const directoryFor = (tab: Tab) =>
      tab.type === "draft" || tab.type === "workspace" ? tab.directory : tabs.info[tabKey(tab)]?.directory
    const matches = (tab: Tab) => {
      const directory = directoryFor(tab)
      return directory ? directories.has(pathKey(directory)) : false
    }
    const current = currentTab()
    const open = current && matches(current) ? current : tabs.store.find(matches)
    if (open) tabs.select(open)
    else void tabs.newDraft({ server: server.key, directory: project.worktree })
    layout.sidebar.setWorkspaces(project.worktree, true)
    layout.home.setSelection({ server: server.key, directory: project.worktree })
    closeMobile()
  }

  const openProjectFromRail = (project: LocalProject) => {
    layout.sidebar.open()
    openProject(project)
  }

  const canOpenDroppedProject = () =>
    platform.platform === "desktop" && !!platform.getPathForFile && ServerConnection.local(server.current)

  const handleSidebarDragOver = (event: DragEvent) => {
    const transfer = event.dataTransfer
    if (!transfer || !Array.from(transfer.types).includes("Files")) return
    event.preventDefault()
    if (!canOpenDroppedProject() || folderDragItems(transfer.items).length === 0) {
      transfer.dropEffect = "none"
      setFolderDropActive(false)
      return
    }
    transfer.dropEffect = "copy"
    setFolderDropActive(true)
  }

  const handleSidebarDragLeave = (event: DragEvent) => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget instanceof HTMLElement &&
      event.currentTarget.contains(event.relatedTarget)
    )
      return
    setFolderDropActive(false)
  }

  const handleSidebarDrop = (event: DragEvent) => {
    const transfer = event.dataTransfer
    if (!transfer || !Array.from(transfer.types).includes("Files")) return
    event.preventDefault()
    event.stopPropagation()
    setFolderDropActive(false)

    const connection = server.current
    if (platform.platform !== "desktop" || !connection) return
    const getPathForFile = platform.getPathForFile
    if (!getPathForFile || !ServerConnection.local(connection)) return

    const directories = droppedFolderPaths(transfer.items, getPathForFile)
    const directory = directories[0]
    if (!directory) {
      showToast({
        variant: "error",
        title: language.t("command.project.open"),
        description: language.t("sidebar.drop.folderOnly"),
      })
      return
    }

    void home.project
      .addExisting(connection, directories)
      .then((opened) => {
        if (!opened) {
          showToast({
            variant: "error",
            title: language.t("command.project.open"),
            description: language.t("sidebar.drop.emptyFolder"),
          })
          return
        }
        openProject({ worktree: directory, expanded: false })
      })
      .catch(() =>
        showToast({
          variant: "error",
          title: language.t("common.requestFailed"),
          description: language.t("dialog.directory.readError"),
        }),
      )
  }

  const toggleSection = (section: keyof typeof ui.sections) => {
    setUi("sections", section, (value) => !value)
  }

  const showWorkspacePanel = (target: "files" | "changes") => {
    // Files and Changes are project-scoped resources, so their visibility must
    // survive route changes into Models/Providers/Skills/Settings.
    const directory = currentDirectory()
    if (!directory) return

    if (params.id) {
      command.trigger("review.open")
    } else {
      const key = SessionStateKey.from(serverSDK().scope, SessionRouteKey.fromRoute(base64Encode(directory)))
      layout.view(key).reviewPanel.open()
    }

    settings.general.setShowFileTree(true)
    layout.fileTree.setTab(target === "changes" ? "changes" : "all")
    layout.fileTree.open()
    closeMobile()
  }

  const openFileMatch = async (path: string) => {
    const directory = currentDirectory()
    const sessionID = params.id
    if (!directory || !sessionID) return

    const key = SessionStateKey.from(server.scope(), SessionRouteKey.fromRoute(base64Encode(directory), sessionID))
    const resourceTabs = layout.tabs(key)
    const fileTab = createPathHelpers(() => directory).tab(path)

    showWorkspacePanel("files")
    await resourceTabs.open(fileTab)
    resourceTabs.setActive(fileTab)
    closeMobile()
  }

  return (
    <>
      <Show when={mobile() && layout.mobileSidebar.opened()}>
        <button
          type="button"
          class="fixed inset-0 z-40 bg-black/20"
          aria-label="Close navigation"
          onClick={layout.mobileSidebar.hide}
        />
      </Show>
      <Show
        when={mobile() ? layout.mobileSidebar.opened() : layout.sidebar.opened()}
        fallback={
          <Show when={!mobile()}>
            <CollapsedRail
              projects={projects}
              onToggle={layout.sidebar.toggle}
              onNewSession={newSession}
              onSettings={() => openWorkspaceView("settings")}
              onProject={openProjectFromRail}
              dropActive={folderDropActive}
              onDragOver={handleSidebarDragOver}
              onDragLeave={handleSidebarDragLeave}
              onDrop={handleSidebarDrop}
              debugTools={props.debugTools}
            />
          </Show>
        }
      >
        <aside
          data-component="meristem-sidebar"
          class="flex shrink-0 flex-col border-r border-v2-border-border-muted bg-v2-background-bg-deep"
          classList={{
            "relative h-full": !mobile(),
            "fixed inset-y-0 start-0 z-50 shadow-xl": mobile(),
            "outline-solid outline-2 outline-v2-border-border-focus outline-offset-[-2px]": folderDropActive(),
          }}
          onDragOver={handleSidebarDragOver}
          onDragLeave={handleSidebarDragLeave}
          onDrop={handleSidebarDrop}
          style={{
            width: mobile() ? "min(360px, calc(100vw - 24px))" : `${Math.min(sidebarWidth(), sidebarMax())}px`,
          }}
        >
          <div class="flex shrink-0 flex-col gap-2 px-2 pb-2">
            <div
              data-slot="project-context-header"
              class="flex h-9 min-w-0 items-center gap-2 border-b border-v2-border-border-muted px-1.5"
            >
              <Show
                when={activeProject()}
                fallback={
                  <span class="min-w-0 flex-1 truncate text-[13px] font-[600] text-v2-text-text-muted">Projects</span>
                }
              >
                {(project) => (
                  <>
                    <ProjectMark project={project()} size="small" />
                    <span class="min-w-0 flex-1 truncate text-[13px] font-[600] tracking-[-0.01em] text-v2-text-text-base">
                      {displayName(project())}
                    </span>
                  </>
                )}
              </Show>
              <TooltipV2 placement="right" value={mobile() ? "Close sidebar" : "Collapse sidebar"}>
                <IconButtonV2
                  variant="ghost-muted"
                  size="small"
                  icon={<IconV2 name="sidebar-left" size="small" />}
                  state={!mobile() && layout.sidebar.opened() ? "pressed" : undefined}
                  aria-label={mobile() ? "Close sidebar" : "Collapse sidebar"}
                  onClick={collapseSidebar}
                />
              </TooltipV2>
            </div>
            <label class="flex h-8 items-center gap-2 rounded-[12px] bg-v2-background-bg-layer-01 px-2 text-v2-icon-icon-muted shadow-[inset_1px_1px_3px_var(--v2-alpha-dark-10),inset_-1px_-1px_2px_var(--v2-alpha-light-6)]">
              <IconV2 name="magnifying-glass" size="small" />
              <input
                value={ui.search}
                onInput={(event) => setUi("search", event.currentTarget.value)}
                placeholder="Search chats & files"
                class="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-v2-text-text-base outline-none placeholder:text-v2-text-text-faint"
              />
            </label>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-3 [scrollbar-width:thin]">
            <div class="flex flex-col gap-3">
              <Section title="Workspace" open={() => ui.sections.workspace} onToggle={() => toggleSection("workspace")}>
                <div class="flex flex-col gap-px">
                  <SidebarRow
                    label="Files"
                    selected={
                      settings.visibility.fileTree() && layout.fileTree.opened() && layout.fileTree.tab() === "all"
                    }
                    onClick={() => showWorkspacePanel("files")}
                    icon={<IconV2 name="file-tree" size="small" />}
                  />
                  <SidebarRow
                    label="Changes"
                    selected={
                      settings.visibility.fileTree() && layout.fileTree.opened() && layout.fileTree.tab() === "changes"
                    }
                    onClick={() => showWorkspacePanel("changes")}
                    icon={<IconV2 name="branch" size="small" />}
                  />
                  <SidebarRow
                    label="Models"
                    selected={workspaceView() === "models"}
                    onClick={() => openWorkspaceView("models")}
                    icon={<IconV2 name="models" size="small" />}
                  />
                  <SidebarRow
                    label="Providers"
                    selected={workspaceView() === "providers"}
                    onClick={() => openWorkspaceView("providers")}
                    icon={<IconV2 name="providers" size="small" />}
                  />
                  <SidebarRow
                    label="Skills"
                    selected={workspaceView() === "skills"}
                    onClick={() => openWorkspaceView("skills")}
                    icon={<IconV2 name="skills" size="small" />}
                  />
                  <SidebarRow
                    label="Settings"
                    selected={workspaceView() === "settings"}
                    onClick={() => openWorkspaceView("settings")}
                    icon={<IconV2 name="settings-gear" size="small" />}
                  />
                </div>
              </Section>

              <Show when={searchQuery().length >= 2 && !!currentDirectory() && !!params.id}>
                <section class="flex min-w-0 flex-col gap-1">
                  <div class="flex h-7 items-center px-2">
                    <span class={SECTION_LABEL}>Files</span>
                  </div>
                  <Show
                    when={!fileMatches.loading}
                    fallback={<div class="px-2 py-1 text-[12px] text-v2-text-text-faint">Searching files…</div>}
                  >
                    <Show
                      when={(fileMatches() ?? []).length > 0}
                      fallback={<div class="px-2 py-1 text-[12px] text-v2-text-text-faint">No matching files</div>}
                    >
                      <div class="flex min-w-0 flex-col gap-px">
                        <For each={fileMatches() ?? []}>
                          {(path) => (
                            <button
                              type="button"
                              class="group flex min-h-9 w-full min-w-0 items-center gap-2 rounded-[10px] px-2 py-1 text-left text-v2-text-text-muted hover:bg-v2-overlay-simple-overlay-hover focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:outline-none"
                              title={path}
                              onClick={() => void openFileMatch(path)}
                            >
                              <span class="flex size-5 shrink-0 items-center justify-center">
                                <IconV2 name="file-tree" size="small" />
                              </span>
                              <span class="min-w-0 flex-1">
                                <span class="block truncate text-[13px] [font-weight:480] text-v2-text-text-base">
                                  {getFilename(path)}
                                </span>
                                <span class="block truncate text-[10px] text-v2-text-text-faint">{path}</span>
                              </span>
                            </button>
                          )}
                        </For>
                      </div>
                    </Show>
                  </Show>
                </section>
              </Show>

              <section class="flex min-w-0 flex-col gap-1">
                <div class="flex h-7 items-center px-2">
                  <span class={SECTION_LABEL}>Chats</span>
                </div>
                <SidebarRow label="New chat" onClick={newSession} icon={<IconV2 name="new-chat" size="small" />} />
                <Show
                  when={activeProject()}
                  keyed
                  fallback={<div class="px-2 py-1 text-[12px] text-v2-text-text-faint">No active project</div>}
                >
                  {(project) => (
                    <ProjectSessions
                      project={project}
                      expanded={() => true}
                      search={() => ui.search}
                      onOpenSession={openSession}
                      selectedSessionID={currentRootSessionID}
                      nested={false}
                    />
                  )}
                </Show>
              </section>

              <Section
                title="Projects"
                open={() => ui.sections.projects}
                onToggle={() => toggleSection("projects")}
                action={
                  <TooltipV2 placement="right" value="Open project">
                    <IconButtonV2
                      variant="ghost-muted"
                      size="small"
                      icon={<IconV2 name="folder-add-left" size="small" />}
                      aria-label="Open project"
                      onClick={() => {
                        const conn = server.current
                        if (conn) projectsController.project.choose(conn)
                      }}
                    />
                  </TooltipV2>
                }
              >
                <div class="flex flex-col gap-px">
                  <For each={projects()}>
                    {(project) => (
                      <ProjectTreeRow
                        project={project}
                        expanded={expanded(project)}
                        selected={() => selectedProject(project)}
                        search={() => ui.search}
                        onToggle={() => toggleProject(project)}
                        onOpen={() => openProject(project)}
                        onOpenSession={openSession}
                        selectedSessionID={currentRootSessionID}
                        onNewSession={() => newSessionFor(project)}
                        onSettings={() => {
                          const conn = server.current
                          if (conn) projectsController.project.edit(conn, project)
                        }}
                        onRemove={() => {
                          const conn = server.current
                          if (conn) projectsController.project.close(conn, project.worktree)
                        }}
                      />
                    )}
                  </For>
                </div>
              </Section>
            </div>
          </div>
          <Show when={SHOW_CHANNEL_INDICATOR}>
            <div class="flex h-9 shrink-0 items-center border-t border-v2-border-border-muted px-3">
              <ChannelIndicator debugTools={props.debugTools} />
            </div>
          </Show>
          <Show when={!mobile()}>
            <div class="absolute inset-y-0 end-0 z-30 w-0 overflow-visible">
              <ResizeHandle
                direction="horizontal"
                size={Math.min(sidebarWidth(), sidebarMax())}
                min={200}
                max={sidebarMax()}
                onResize={(width) => layout.sidebar.resize(width)}
              />
            </div>
          </Show>
        </aside>
      </Show>
    </>
  )
}
