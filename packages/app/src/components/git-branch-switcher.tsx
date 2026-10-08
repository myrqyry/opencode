import { createSignal, For, Show } from "solid-js"
import { createMutation, createQuery } from "@tanstack/solid-query"
import { MenuV2 } from "@opencode-ai/ui/v2/menu-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { useLanguage } from "@/context/language"
import { useSDK } from "@/context/sdk"
import { formatServerError } from "@/utils/server-errors"
import { showToast } from "@/utils/toast"

type Variant = "pathbar" | "prompt"

export function GitBranchSwitcher(props: { branch?: string; variant?: Variant; enabled?: boolean }) {
  const sdk = useSDK()
  const language = useLanguage()
  const [open, setOpen] = createSignal(false)
  const enabled = () => props.enabled !== false && !!props.branch
  const variant = () => props.variant ?? "prompt"

  const branches = createQuery(() => ({
    queryKey: ["vcs-branches", sdk().directory] as const,
    enabled: open() && enabled(),
    retry: false,
    queryFn: async () => {
      const result = await sdk().client.vcs.branches()
      if (result.error) throw result.error
      return result.data ?? []
    },
  }))

  const switching = createMutation(() => ({
    mutationFn: async (branch: string) => {
      const result = await sdk().client.vcs.switchBranch({ branch })
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: () => {
      void branches.refetch()
    },
    onError: (error) => {
      showToast({
        variant: "error",
        title: "Could not switch branch",
        description: formatServerError(error, language.t, language.t("common.requestFailed")),
      })
    },
  }))

  const triggerClass = () =>
    variant() === "pathbar"
      ? "flex h-8 min-w-0 flex-1 items-center gap-2 rounded-[6px] px-1 text-left hover:bg-v2-overlay-simple-overlay-hover focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:outline-none data-[expanded]:bg-v2-overlay-simple-overlay-pressed"
      : "flex h-7 min-w-0 max-w-[220px] items-center gap-1.5 rounded-sm px-2 text-[13px] font-[440] leading-5 tracking-[-0.04px] hover:bg-v2-overlay-simple-overlay-hover focus-visible:bg-v2-overlay-simple-overlay-hover focus-visible:outline-none data-[expanded]:bg-v2-overlay-simple-overlay-pressed"

  const labelClass = () =>
    variant() === "pathbar"
      ? "min-w-0 flex-1 truncate font-mono text-[11px] text-v2-text-text-muted"
      : "min-w-0 truncate"

  return (
    <MenuV2 placement="bottom-start" gutter={4} open={open()} onOpenChange={setOpen}>
      <MenuV2.Trigger
        class={triggerClass()}
        disabled={!enabled()}
        aria-label={props.branch ? `Switch branch from ${props.branch}` : "Switch branch"}
        title={props.branch}
      >
        <IconV2 name="branch" size="small" class="shrink-0 text-v2-icon-icon-muted" />
        <span class={labelClass()}>{props.branch}</span>
        <Show when={enabled()}>
          <IconV2 name="chevron-down" size="small" class="shrink-0 text-v2-icon-icon-muted" />
        </Show>
      </MenuV2.Trigger>
      <MenuV2.Portal>
        <MenuV2.Content class="min-w-[220px] max-w-[320px]">
          <MenuV2.Group>
            <MenuV2.GroupLabel>Switch branch</MenuV2.GroupLabel>
            <Show
              when={!branches.isPending}
              fallback={<div class="px-3 py-2 text-[12px] text-v2-text-text-faint">Loading branches…</div>}
            >
              <Show
                when={!branches.isError}
                fallback={
                  <div class="max-w-[280px] px-3 py-2 text-[12px] leading-5 text-v2-text-text-faint">
                    Branch switching will be available after the OpenCode server restarts.
                  </div>
                }
              >
                <Show
                  when={(branches.data ?? []).length > 0}
                  fallback={<div class="px-3 py-2 text-[12px] text-v2-text-text-faint">No local branches</div>}
                >
                  <MenuV2.RadioGroup value={props.branch}>
                    <For each={branches.data ?? []}>
                      {(branch) => (
                        <MenuV2.RadioItem
                          value={branch.name}
                          disabled={switching.isPending || branch.current}
                          onSelect={() => {
                            if (branch.current || switching.isPending) return
                            switching.mutate(branch.name)
                          }}
                        >
                          <span class="min-w-0 flex-1 truncate font-mono text-[12px]">{branch.name}</span>
                        </MenuV2.RadioItem>
                      )}
                    </For>
                  </MenuV2.RadioGroup>
                </Show>
              </Show>
            </Show>
          </MenuV2.Group>
        </MenuV2.Content>
      </MenuV2.Portal>
    </MenuV2>
  )
}
