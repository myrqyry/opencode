import { createMemo, For, onCleanup, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { createQuery } from "@tanstack/solid-query"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { Icon } from "@opencode-ai/ui/v2/icon"
import { TextareaV2 } from "@opencode-ai/ui/v2/textarea-v2"
import { TooltipV2 } from "@opencode-ai/ui/v2/tooltip-v2"
import { GitBranchSwitcher } from "@/components/git-branch-switcher"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { formatServerError } from "@/utils/server-errors"
import { showToast } from "@/utils/toast"

type Change = {
  file: string
  additions: number
  deletions: number
  status?: "added" | "deleted" | "modified"
}

type Mode = "stage" | "unstage" | "commit"

const empty: Change[] = []

function filename(file: string) {
  return file.split(/[\\/]/).at(-1) ?? file
}

function changedFile(properties: unknown): string | undefined {
  if (!properties || typeof properties !== "object" || !("file" in properties)) return undefined
  return typeof properties.file === "string" ? properties.file : undefined
}

function status(change: Change) {
  if (change.status === "added") return "A"
  if (change.status === "deleted") return "D"
  return "M"
}

function statusTone(change: Change) {
  if (change.status === "added") return "text-v2-state-fg-success"
  if (change.status === "deleted") return "text-v2-state-fg-danger"
  return "text-v2-state-fg-warning"
}

function gitHubUrl(remote: string | undefined) {
  if (!remote) return
  const value = remote.trim().replace(/\.git$/, "")
  const scp = value.match(/^(?:[^@/\s]+@)?github\.com:([^/\s]+)\/([^/\s]+)$/i)
  if (scp) return `https://github.com/${scp[1]}/${scp[2]}`

  try {
    const url = new URL(value)
    if (url.hostname.toLowerCase() !== "github.com") return
    const parts = url.pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
    if (parts.length !== 2) return
    return `https://github.com/${parts[0]}/${parts[1]}`
  } catch {
    return
  }
}

function gitHubUrlFromConfig(config: string) {
  const remotes = [...config.matchAll(/\[remote\s+"([^"]+)"\]([\s\S]*?)(?=\n\[|$)/g)]
    .map((match) => {
      const url = match[2].match(/^\s*url\s*=\s*(.+)$/m)?.[1]?.trim()
      return { name: match[1], url: gitHubUrl(url) }
    })
    .filter((remote) => !!remote.url)

  return remotes.find((remote) => remote.name === "origin")?.url ?? remotes[0]?.url
}

export function GitChangesPanel(props: { onSelectFile: (path: string) => void }) {
  const sdk = useSDK()
  const sync = useSync()
  const language = useLanguage()
  const platform = usePlatform()
  const [store, setStore] = createStore({
    busy: undefined as Mode | undefined,
    file: undefined as string | undefined,
    message: "",
  })

  const key = (mode: "staged" | "unstaged") => ["project-source-control", sdk().directory, mode] as const

  const staged = createQuery(() => ({
    queryKey: key("staged"),
    queryFn: () =>
      sdk()
        .client.vcs.diff({ mode: "staged" })
        .then((result) => (result.data ?? []) as Change[]),
  }))

  const unstaged = createQuery(() => ({
    queryKey: key("unstaged"),
    queryFn: () =>
      sdk()
        .client.vcs.diff({ mode: "unstaged" })
        .then((result) => (result.data ?? []) as Change[]),
  }))

  const repositoryFallback = createQuery(() => ({
    queryKey: ["project-source-control", sdk().directory, "repository-url"] as const,
    enabled: !sync().data.vcs?.repository_url,
    staleTime: Infinity,
    queryFn: () =>
      sdk()
        .client.file.read({ path: ".git/config" })
        .then((result) => {
          if (result.data?.type !== "text") return
          return gitHubUrlFromConfig(result.data.content)
        })
        .catch(() => undefined),
  }))

  const stagedChanges = () => staged.data ?? empty
  const unstagedChanges = () => unstaged.data ?? empty
  const branch = createMemo(() => sync().data.vcs?.branch)
  const repositoryUrl = createMemo(() => sync().data.vcs?.repository_url ?? repositoryFallback.data)
  const loading = () => staged.isPending || unstaged.isPending
  const canCommit = createMemo(() => stagedChanges().length > 0 && store.message.trim().length > 0 && !store.busy)

  const refresh = () => Promise.all([staged.refetch(), unstaged.refetch()])

  const stop = sdk().event.listen((event) => {
    const details = event.details as { type: string; properties?: unknown }
    if (details.type !== "file.watcher.updated" && details.type !== "filesystem.changed") return
    const file = changedFile(details.properties)
    if (!file || file.startsWith(".git/")) return
    void refresh()
  })
  onCleanup(stop)
  const failed = (error: unknown) => {
    showToast({
      variant: "error",
      title: language.t("common.requestFailed"),
      description: formatServerError(error, language.t),
    })
  }

  const changeFiles = async (mode: "stage" | "unstage", files: string[]) => {
    if (files.length === 0 || store.busy) return
    setStore({ busy: mode, file: files.length === 1 ? files[0] : undefined })
    try {
      if (mode === "stage") await sdk().client.vcs.stage({ files })
      if (mode === "unstage") await sdk().client.vcs.unstage({ files })
      await refresh()
    } catch (error) {
      failed(error)
    } finally {
      setStore({ busy: undefined, file: undefined })
    }
  }

  const commit = async () => {
    const message = store.message.trim()
    if (!canCommit() || !message) return
    setStore("busy", "commit")
    try {
      await sdk().client.vcs.commit({ message })
      setStore("message", "")
      await refresh()
    } catch (error) {
      failed(error)
    } finally {
      setStore("busy", undefined)
    }
  }
  const section = (
    title: string,
    changes: () => Change[],
    mode: "stage" | "unstage",
    allLabel: string,
    actionLabel: string,
    emptyLabel: string,
  ) => (
    <section class="flex min-h-0 flex-col">
      <div class="flex h-8 shrink-0 items-center gap-2 px-3">
        <span class="min-w-0 flex-1 truncate text-11-medium uppercase tracking-[0.04em] text-v2-text-text-muted">
          {title}
        </span>
        <span class="text-11-regular tabular-nums text-v2-text-text-faint">{changes().length}</span>
        <Show when={changes().length > 0}>
          <ButtonV2
            size="small"
            variant="ghost-muted"
            disabled={!!store.busy}
            onClick={() =>
              void changeFiles(
                mode,
                changes().map((change) => change.file),
              )
            }
          >
            {allLabel}
          </ButtonV2>
        </Show>
      </div>

      <Show
        when={changes().length > 0}
        fallback={<div class="px-3 pb-2 text-12-regular text-v2-text-text-faint">{emptyLabel}</div>}
      >
        <div class="flex flex-col pb-1">
          <For each={changes()}>
            {(change) => (
              <div
                class="group flex min-w-0 items-center gap-2 px-2 py-0.5 hover:bg-v2-overlay-simple-overlay-hover"
                data-file={change.file}
              >
                <TooltipV2 class="min-w-0 flex-1" placement="left" value={change.file}>
                  <button
                    type="button"
                    class="flex h-7 w-full min-w-0 items-center gap-2 rounded-[5px] px-1 text-left focus-visible:outline-2 focus-visible:outline-v2-border-border-focus"
                    aria-label={change.file}
                    onClick={() => props.onSelectFile(change.file)}
                  >
                    <span
                      class={`w-4 shrink-0 text-center font-mono text-[11px] font-semibold ${statusTone(change)}`}
                      aria-hidden="true"
                    >
                      {status(change)}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-12-regular text-v2-text-text-base">
                      {filename(change.file)}
                    </span>
                    <span class="shrink-0 font-mono text-[10px] tabular-nums">
                      <span class="text-v2-state-fg-success">+{change.additions}</span>{" "}
                      <span class="text-v2-state-fg-danger">−{change.deletions}</span>
                    </span>
                  </button>
                </TooltipV2>
                <IconButtonV2
                  size="small"
                  variant="ghost-muted"
                  class="shrink-0 opacity-70 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  disabled={!!store.busy}
                  aria-label={actionLabel}
                  title={actionLabel}
                  aria-busy={store.busy === mode && store.file === change.file ? "true" : undefined}
                  icon={<Icon name={mode === "stage" ? "stage" : "unstage"} size="small" />}
                  onClick={() => void changeFiles(mode, [change.file])}
                />
              </div>
            )}
          </For>
        </div>
      </Show>
    </section>
  )
  return (
    <div class="flex size-full min-h-0 flex-col overflow-hidden bg-v2-background-bg-base">
      <Show when={branch()}>
        {(value) => (
          <div
            data-slot="source-control-branchbar"
            class="flex h-10 shrink-0 items-center gap-2 border-b border-v2-border-border-muted px-3"
          >
            <GitBranchSwitcher branch={value()} variant="pathbar" />
            <Show when={repositoryUrl()}>
              {(url) => (
                <ButtonV2
                  size="small"
                  variant="ghost-muted"
                  icon="external-link"
                  class="shrink-0"
                  onClick={() => platform.openExternal(url())}
                  aria-label={`${language.t("common.open")} GitHub`}
                  title={`${language.t("common.open")} GitHub`}
                />
              )}
            </Show>
          </div>
        )}
      </Show>

      <Show
        when={!loading()}
        fallback={
          <div class="px-3 py-3 text-12-regular text-v2-text-text-muted">
            {language.t("session.review.loadingChanges")}
          </div>
        }
      >
        <div class="min-h-0 flex-1 overflow-y-auto py-1">
          {section(
            language.t("workspace.scm.staged"),
            stagedChanges,
            "unstage",
            language.t("workspace.scm.unstageAll"),
            language.t("workspace.scm.unstage"),
            language.t("workspace.scm.noStaged"),
          )}
          <div class="my-1 border-t border-v2-border-border-muted" />
          {section(
            language.t("session.review.change.other"),
            unstagedChanges,
            "stage",
            language.t("workspace.scm.stageAll"),
            language.t("workspace.scm.stage"),
            language.t("workspace.scm.noWorking"),
          )}
        </div>
      </Show>

      <div class="shrink-0 border-t border-v2-border-border-muted p-2.5">
        <TextareaV2
          class="!w-full"
          rows={2}
          value={store.message}
          disabled={store.busy === "commit"}
          placeholder={language.t("workspace.scm.commitPlaceholder")}
          aria-label={language.t("workspace.scm.commitMessage")}
          onInput={(event) => setStore("message", event.currentTarget.value)}
          onKeyDown={(event) => {
            if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return
            event.preventDefault()
            void commit()
          }}
        />
        <div class="mt-2 flex items-center gap-2">
          <span class="min-w-0 flex-1 truncate text-[10px] text-v2-text-text-faint">
            {language.t("workspace.scm.commitHint")}
          </span>
          <ButtonV2 size="small" variant="neutral" disabled={!canCommit()} onClick={() => void commit()}>
            {store.busy === "commit" ? language.t("workspace.scm.committing") : language.t("workspace.scm.commit")}
          </ButtonV2>
        </div>
      </div>
    </div>
  )
}
