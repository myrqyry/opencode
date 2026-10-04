import { createMemo, createSignal, createUniqueId, Show } from "solid-js"
import { createQuery, keepPreviousData } from "@tanstack/solid-query"
import { Icon } from "@opencode-ai/ui/icon"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { SessionFilePanelV2, SessionFilePanelV2Empty } from "@opencode-ai/session-ui/v2/session-file-panel-v2"
import { SessionReviewV2Sidebar } from "@opencode-ai/session-ui/v2/session-review-v2"
import FileTreeV2, { type Kind } from "@/components/file-tree-v2"
import { useFile } from "@/context/file"
import { useLanguage } from "@/context/language"
import { useLayout } from "@/context/layout"
import { usePlatform } from "@/context/platform"
import { useSDK } from "@/context/sdk"
import { useServer } from "@/context/server"
import { displayName } from "@/pages/layout/helpers"
import { useSessionLayout } from "@/pages/session/session-layout"
import { SessionFileView } from "@/pages/session/file-tabs"
import { applyFileListKeyDown, SessionFileListV2 } from "@/pages/session/v2/session-file-list-v2"
import { pathKey } from "@/utils/path-key"
import { fileManagerApp } from "@/utils/file-manager"
import { showToast } from "@/utils/toast"
import { authTokenFromCredentials } from "@/utils/server"

const emptyFiles: string[] = []

export type SessionFileBrowserState = {
  sidebarOpened: () => boolean
  sidebarWidth: () => number
  sidebarTransition: () => boolean
  resizeSidebar: (width: number) => void
  toggleSidebar: () => void
}

export function SessionFileBrowserTab(props: {
  tab: string
  placeholder: boolean
  listOnly?: boolean
  active?: string
  kinds: ReadonlyMap<string, Kind>
  state: SessionFileBrowserState
  onSelect: (path: string) => void
  onSelectPermanent: (path: string) => void
  filterRef?: (element: HTMLInputElement) => void
}) {
  const file = useFile()
  const language = useLanguage()
  const layout = useLayout()
  const platform = usePlatform()
  const sdk = useSDK()
  const server = useServer()
  const { workspaceKey } = useSessionLayout()
  const resultsID = `session-file-browser-results-${createUniqueId()}`
  const [filter, setFilter] = createSignal("")
  const [explicitHighlight, setExplicitHighlight] = createSignal<string>()
  const sidebarOpened = () => props.placeholder || props.state.sidebarOpened()
  const query = createMemo(() => filter().trim())
  const search = createQuery(() => {
    const value = query()
    return {
      queryKey: ["session-open-file", workspaceKey(), value] as const,
      enabled: value.length > 0,
      queryFn: ({ signal }) => file.searchFiles(value, { limit: 200, signal }),
      placeholderData: keepPreviousData,
    }
  })
  const files = createMemo(() => {
    if (!query() || search.isPending) return emptyFiles
    return [...new Set(search.data ?? emptyFiles)]
  })
  const highlighted = createMemo(() => {
    const values = files()
    if (values.length === 0) return undefined
    const explicit = explicitHighlight()
    if (explicit && values.includes(explicit)) return explicit
    return values[0]
  })
  const loading = createMemo(() => query().length > 0 && search.isPending)
  const project = createMemo(() => {
    const directory = pathKey(sdk().directory)
    return layout.projects
      .list()
      .find(
        (item) =>
          pathKey(item.worktree) === directory || item.sandboxes?.some((sandbox) => pathKey(sandbox) === directory),
      )
  })
  const title = createMemo(() => displayName(project() ?? { worktree: sdk().directory }))
  const fileManager = createMemo(() => fileManagerApp(platform.os ?? "unknown"))
  const canOpenFolder = () => server.isLocal() && (!!platform.openPath || !!server.current)
  const openFolder = async () => {
    if (!canOpenFolder()) return

    try {
      if (platform.openPath) {
        await platform.openPath(sdk().directory)
        return
      }

      const conn = server.current
      if (!conn) return
      const url = new URL("/instance/open-directory", conn.http.url)
      url.searchParams.set("directory", sdk().directory)
      const headers = conn.http.password
        ? {
            Authorization: `Basic ${authTokenFromCredentials({
              username: conn.http.username,
              password: conn.http.password,
            })}`,
          }
        : undefined
      const response = await fetch(url, { method: "POST", headers })
      if (!response.ok) throw new Error(`Open folder request failed with ${response.status}`)
    } catch (cause) {
      showToast({
        variant: "error",
        title: language.t("common.requestFailed"),
        description: cause instanceof Error ? cause.message : String(cause),
      })
    }
  }
  const optionID = (path: string) => `${resultsID}-option-${files().indexOf(path)}`

  const onFilterKeyDown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    if (event.key === "Escape" && query()) {
      event.preventDefault()
      setFilter("")
      return
    }
    if (!query()) return
    applyFileListKeyDown(event, files(), highlighted(), {
      onHighlight: setExplicitHighlight,
      onSelect: props.onSelectPermanent,
    })
  }

  const browserList = (fill = false) => (
    <SessionReviewV2Sidebar
      open={fill ? true : sidebarOpened()}
      fill={fill}
      transition={props.state.sidebarTransition()}
      title={fill ? undefined : <span class="truncate">{title()}</span>}
      filter={filter()}
      onFilterChange={setFilter}
      onFilterKeyDown={onFilterKeyDown}
      filterAutofocus={props.placeholder}
      filterRef={props.filterRef}
      filterControls={resultsID}
      filterActiveDescendant={highlighted() ? optionID(highlighted()!) : undefined}
      filterExpanded={query().length > 0 && files().length > 0}
      width={props.state.sidebarWidth()}
      onWidthChange={props.state.resizeSidebar}
    >
      <Show
        when={query()}
        fallback={
          <FileTreeV2
            active={props.active}
            kinds={props.kinds}
            onFileClick={(node) => props.onSelect(node.path)}
            onFileDoubleClick={(node) => props.onSelectPermanent(node.path)}
          />
        }
      >
        <Show
          when={!loading()}
          fallback={
            <div role="status" class="px-2 py-2 text-12-regular text-text-weak">
              {language.t("common.loading")}
              {language.t("common.loading.ellipsis")}
            </div>
          }
        >
          <Show
            when={files().length > 0}
            fallback={
              <div role="status" class="px-2 py-2 text-12-regular text-text-weak">
                {language.t("palette.empty")}
              </div>
            }
          >
            <SessionFileListV2
              id={resultsID}
              role="listbox"
              optionID={optionID}
              files={files()}
              kinds={props.kinds}
              active={props.active}
              highlighted={highlighted()}
              onFileClick={(path) => {
                setExplicitHighlight(path)
                props.onSelect(path)
              }}
              onFileDoubleClick={props.onSelectPermanent}
            />
          </Show>
        </Show>
      </Show>
    </SessionReviewV2Sidebar>
  )

  // In the top-tab layout, the file browser is itself a tab. Let it use the
  // whole panel instead of nesting a second sidebar beside an empty preview.
  if (props.listOnly) {
    return (
      <div class="size-full min-h-0 overflow-hidden flex flex-col">
        <div
          data-slot="file-browser-pathbar"
          class="flex h-10 shrink-0 items-center gap-2 border-b border-v2-border-border-muted px-3"
        >
          <div
            class="min-w-0 flex-1 truncate font-mono text-[11px] text-v2-text-text-muted"
            title={sdk().directory}
          >
            {sdk().directory}
          </div>
          <Show when={canOpenFolder()}>
            <ButtonV2
              size="small"
              variant="ghost-muted"
              icon="external-link"
              class="shrink-0"
              onClick={openFolder}
              aria-label={language.t(fileManager().label)}
              title={language.t(fileManager().label)}
            />
          </Show>
        </div>
        <div class="min-h-0 flex-1 overflow-hidden">{browserList(true)}</div>
      </div>
    )
  }

  // Keep the sidebar outside Kobalte Tabs.Content: a morphing content value
  // unmounts the whole panel on every file-tab switch and resets sidebar scroll.
  return (
    <SessionFilePanelV2 toolbar={false} sidebar={browserList()}>
      <Show
        when={!props.placeholder}
        fallback={
          <SessionFilePanelV2Empty>
            <div class="flex flex-col items-center gap-3 text-center text-text-weak">
              <Icon name="file-tree" size="large" />
              <div class="text-14-medium text-text-strong">{language.t("command.file.open")}</div>
              <div class="text-13-regular">{language.t("session.files.selectToOpen")}</div>
            </div>
          </SessionFilePanelV2Empty>
        }
      >
        <div class="min-h-0 flex-1">
          <Show when={props.tab} keyed>
            {(tab) => <SessionFileView tab={tab} />}
          </Show>
        </div>
      </Show>
    </SessionFilePanelV2>
  )
}
