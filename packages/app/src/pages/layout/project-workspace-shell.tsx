import { createMemo, onCleanup, Show, type ParentProps } from "solid-js"
import { createQuery, useQueryClient } from "@tanstack/solid-query"
import { CommentsProvider } from "@/context/comments"
import { FileProvider, useFile } from "@/context/file"
import { useGlobal } from "@/context/global"
import { useLanguage } from "@/context/language"
import { useLayout } from "@/context/layout"
import { ModelsProvider } from "@/context/models"
import { PromptProvider } from "@/context/prompt"
import { ServerConnection } from "@/context/server"
import { ServerSDKProvider } from "@/context/server-sdk"
import { ServerSyncProvider } from "@/context/server-sync"
import { SDKProvider, useSDK } from "@/context/sdk"
import { useSettings } from "@/context/settings"
import { useSync } from "@/context/sync"
import { useTabs, tabKey, type DraftTab } from "@/context/tabs"
import { DirectoryDataProvider } from "@/pages/directory-layout"
import { createSizing } from "@/pages/session/helpers"
import { SessionChatTabs } from "@/pages/session/session-chat-tabs"
import { SessionSidePanel } from "@/pages/session/session-side-panel"
import { GitChangesPanel } from "@/pages/layout/git-changes-panel"
import { createReviewPanelV2State } from "@/pages/session/v2/review-panel-v2-state"
import type { ServerConnection as ServerConnectionType } from "@/context/server"

type ProjectIdentity = {
  server: ServerConnectionType.Key
  directory: string
}

function projectKey(project: ProjectIdentity) {
  return `${project.server}\0${project.directory}`
}

export function ProjectWorkspaceShell(props: ParentProps) {
  const global = useGlobal()
  const layout = useLayout()
  const tabs = useTabs()

  const identity = createMemo<ProjectIdentity | undefined>(() => {
    const route = layout.route()

    if (route.type === "workspace") return { server: route.server, directory: route.directory }

    if (route.type === "draft") {
      const tab = tabs.store.find((item): item is DraftTab => item.type === "draft" && item.draftID === route.draftID)
      if (!tab) return
      return { server: tab.server, directory: tab.directory }
    }

    if (route.type !== "session" || !route.server) return

    const conn = global.servers.list().find((item) => ServerConnection.key(item) === route.server)
    if (!conn) return

    const tab = tabs.store.find(
      (item) => item.type === "session" && item.server === route.server && item.sessionId === route.sessionId,
    )
    const directory =
      (tab ? tabs.info[tabKey(tab)]?.directory : undefined) ??
      global.ensureServerCtx(conn).sync.session.lineage.peek(route.sessionId)?.session.directory ??
      global.ensureServerCtx(conn).sync.session.get(route.sessionId)?.directory

    if (!directory) return
    return { server: route.server, directory }
  })

  const identityKey = createMemo(() => {
    const project = identity()
    return project ? projectKey(project) : undefined
  })

  return (
    <Show when={identityKey()} keyed fallback={props.children}>
      {(_) => {
        const project = identity()!
        const conn = createMemo(() =>
          global.servers.list().find((item) => ServerConnection.key(item) === project.server),
        )
        const directory = () => project.directory
        const server = () => project.server

        return (
          <ServerSDKProvider server={conn}>
            <ServerSyncProvider server={conn}>
              <ModelsProvider directory={directory}>
                <SDKProvider directory={directory}>
                  <DirectoryDataProvider directory={directory} server={server}>
                    <FileProvider>
                      <PromptProvider>
                        <CommentsProvider>
                          <ProjectWorkspaceFrame server={project.server} directory={project.directory}>
                            {props.children}
                          </ProjectWorkspaceFrame>
                        </CommentsProvider>
                      </PromptProvider>
                    </FileProvider>
                  </DirectoryDataProvider>
                </SDKProvider>
              </ModelsProvider>
            </ServerSyncProvider>
          </ServerSDKProvider>
        )
      }}
    </Show>
  )
}

function ProjectWorkspaceFrame(
  props: ParentProps<{
    server: ServerConnectionType.Key
    directory: string
  }>,
) {
  const layout = useLayout()
  const settings = useSettings()
  const language = useLanguage()
  const sdk = useSDK()
  const sync = useSync()
  const file = useFile()
  const queryClient = useQueryClient()
  const state = createReviewPanelV2State()
  const size = createSizing()

  const vcsKey = createMemo(
    () =>
      [
        "project-shell-vcs",
        sdk().directory,
        sync().data.vcs?.branch ?? "",
        sync().data.vcs?.default_branch ?? "",
      ] as const,
  )
  const vcsQuery = createQuery(() => ({
    queryKey: vcsKey(),
    enabled: sync().project?.vcs === "git",
    queryFn: () =>
      sdk()
        .api.vcs.diff({
          location: { directory: sdk().directory },
          mode: "working",
        })
        .then((result) => result.data)
        .catch((error) => {
          console.debug("[project-shell] failed to load vcs diff", { error })
          return []
        }),
  }))

  const diffs = () => vcsQuery.data ?? []
  const ready = () => sync().project?.vcs !== "git" || !vcsQuery.isPending
  const count = () => diffs().length
  const hasReview = () => count() > 0

  const refresh = () => void queryClient.invalidateQueries({ queryKey: vcsKey() })
  const stop = sdk().event.listen((event) => {
    const details = event.details as { type: string; properties?: unknown }
    if (details.type !== "file.watcher.updated" && details.type !== "filesystem.changed") return
    const properties =
      typeof details.properties === "object" && details.properties
        ? (details.properties as Record<string, unknown>)
        : undefined
    const path = typeof properties?.file === "string" ? properties.file : undefined
    if (!path || path.startsWith(".git/")) return
    refresh()
  })
  onCleanup(stop)

  const activeFile = () => {
    const all = diffs()
    return all[0]?.file
  }

  const openDiff = (path: string) => {
    void file.load(path)
  }

  const reviewPanel = () => (
    <Show
      when={sync().project?.vcs === "git"}
      fallback={
        <div class="flex h-full items-center justify-center px-6 text-center text-13-regular text-v2-text-text-muted">
          {language.t("session.review.noVcs")}
        </div>
      }
    >
      <GitChangesPanel onSelectFile={openDiff} />
    </Show>
  )

  const panelOpen = createMemo(() => settings.visibility.fileTree() && layout.fileTree.opened())
  const width = createMemo(() => Math.max(320, Math.min(560, layout.fileTree.width())))

  return (
    <div class="flex size-full min-h-0 min-w-0 bg-project-canvas">
      <div class="flex min-w-0 flex-1 flex-col bg-project-surface">
        <SessionChatTabs server={props.server} directory={props.directory} />
        <div class="min-h-0 min-w-0 flex-1 overflow-hidden">{props.children}</div>
      </div>

      <Show when={panelOpen()}>
        <div class="hidden h-full shrink-0 md:flex pl-2" style={{ width: `${width() + 8}px` }}>
          <SessionSidePanel
            canReview={() => !!sync().project}
            diffs={diffs}
            diffsReady={ready}
            empty={() => language.t("session.review.noUncommittedChanges")}
            hasReview={hasReview}
            reviewHasFocusableContent={() => hasReview() || state.sidebarOpened()}
            reviewCount={count}
            reviewPanel={reviewPanel}
            fileBrowserState={state}
            activeDiff={activeFile()}
            focusReviewDiff={() => {}}
            reviewSnap={false}
            size={size}
          />
        </div>
      </Show>
    </div>
  )
}
