import { Dialog } from "@opencode-ai/ui/dialog"
import { List } from "@opencode-ai/ui/list"
import { Switch } from "@opencode-ai/ui/switch"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { Button } from "@opencode-ai/ui/button"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Dialog as DialogV2, DialogBody, DialogHeader, DialogTitleGroup } from "@opencode-ai/ui/v2/dialog-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { Switch as SwitchV2 } from "@opencode-ai/ui/v2/switch-v2"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { useFilteredList } from "@opencode-ai/ui/hooks"
import { createSignal, For, Show, type Component } from "solid-js"
import { createStore } from "solid-js/store"
import { useLocal } from "@/context/local"
import { popularProviders } from "@/hooks/use-providers"
import { useLanguage } from "@/context/language"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { DialogConnectProvider } from "./dialog-connect-provider"
import { decode64 } from "@/utils/base64"
import { SettingsListV2 } from "./settings-v2/parts/list"
import { SettingsRowV2 } from "./settings-v2/parts/row"
import { useServerSDK } from "@/context/server-sdk"
import { Persist, persisted } from "@/utils/persist"
import "./settings-v2/settings-v2.css"

type ModelItem = ReturnType<ReturnType<typeof useLocal>["model"]["list"]>[number]

export const DialogManageModels: Component = () => {
  const local = useLocal()
  const language = useLanguage()
  const dialog = useDialog()
  const directory = () => decode64(local.slug())

  const handleConnectProvider = () => {
    void dialog.show(() => <DialogConnectProvider directory={directory} />)
  }
  const providerRank = (id: string) => popularProviders.indexOf(id)
  const providerList = (providerID: string) => local.model.list().filter((x) => x.provider.id === providerID)
  const providerVisible = (providerID: string) =>
    providerList(providerID).every((x) => local.model.visible({ modelID: x.id, providerID: x.provider.id }))
  const setProviderVisibility = (providerID: string, checked: boolean) => {
    providerList(providerID).forEach((x) => {
      local.model.setVisibility({ modelID: x.id, providerID: x.provider.id }, checked)
    })
  }

  return (
    <Dialog
      title={language.t("dialog.model.manage")}
      description={language.t("dialog.model.manage.description")}
      action={
        <Button class="h-7 -my-1 text-14-medium" icon="plus-small" tabIndex={-1} onClick={handleConnectProvider}>
          {language.t("command.provider.connect")}
        </Button>
      }
    >
      <List
        class="px-3"
        search={{ placeholder: language.t("dialog.model.search.placeholder"), autofocus: true }}
        emptyMessage={language.t("dialog.model.empty")}
        key={(x) => `${x?.provider?.id}:${x?.id}`}
        items={local.model.list()}
        filterKeys={["provider.name", "name", "id"]}
        sortBy={(a, b) => a.name.localeCompare(b.name)}
        groupBy={(x) => x.provider.id}
        groupHeader={(group) => {
          const provider = group.items[0].provider
          return (
            <>
              <span>{provider.name}</span>
              <Tooltip
                placement="top"
                value={language.t("dialog.model.manage.provider.toggle", { provider: provider.name })}
              >
                <Switch
                  class="-mr-1"
                  checked={providerVisible(provider.id)}
                  onChange={(checked) => setProviderVisibility(provider.id, checked)}
                  hideLabel
                >
                  {provider.name}
                </Switch>
              </Tooltip>
            </>
          )
        }}
        sortGroupsBy={(a, b) => {
          const aRank = providerRank(a.items[0].provider.id)
          const bRank = providerRank(b.items[0].provider.id)
          const aPopular = aRank >= 0
          const bPopular = bRank >= 0
          if (aPopular && !bPopular) return -1
          if (!aPopular && bPopular) return 1
          return aRank - bRank
        }}
        onSelect={(x) => {
          if (!x) return
          const key = { modelID: x.id, providerID: x.provider.id }
          local.model.setVisibility(key, !local.model.visible(key))
        }}
      >
        {(i) => (
          <div class="w-full flex items-center justify-between gap-x-3">
            <span>{i.name}</span>
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={!!local.model.visible({ modelID: i.id, providerID: i.provider.id })}
                onChange={(checked) => {
                  local.model.setVisibility({ modelID: i.id, providerID: i.provider.id }, checked)
                }}
              />
            </div>
          </div>
        )}
      </List>
    </Dialog>
  )
}

export const DialogManageModelsV2: Component = () => {
  const local = useLocal()
  const language = useLanguage()
  const dialog = useDialog()
  const serverSdk = useServerSDK()
  const [providerState, setProviderState] = persisted(
    Persist.serverGlobal(serverSdk().scope, "settings-v2.models.providers"),
    createStore({ collapsed: {} as Record<string, boolean> }),
  )
  const [enabledOnly, setEnabledOnly] = createSignal(false)
  const directory = () => decode64(local.slug())

  const handleConnectProvider = () => {
    void dialog.show(() => <DialogConnectProvider directory={directory} />)
  }
  const providerList = (providerID: string) => local.model.list().filter((x) => x.provider.id === providerID)
  const providerVisible = (providerID: string) =>
    providerList(providerID).every((x) => local.model.visible({ modelID: x.id, providerID: x.provider.id }))
  const providerVisibleCount = (providerID: string) =>
    providerList(providerID).filter((x) => local.model.visible({ modelID: x.id, providerID: x.provider.id })).length
  const setProviderVisibility = (providerID: string, checked: boolean) => {
    providerList(providerID).forEach((x) => {
      local.model.setVisibility({ modelID: x.id, providerID: x.provider.id }, checked)
    })
  }
  const setModelVisibility = (item: ModelItem, checked: boolean) => {
    local.model.setVisibility({ modelID: item.id, providerID: item.provider.id }, checked)
  }
  const list = useFilteredList<ModelItem>({
    items: () =>
      local
        .model
        .list()
        .filter((item) => !enabledOnly() || local.model.visible({ modelID: item.id, providerID: item.provider.id })),
    key: (x) => `${x.provider.id}:${x.id}`,
    filterKeys: ["provider.name", "name", "id"],
    sortBy: (a, b) => a.name.localeCompare(b.name),
    groupBy: (x) => x.provider.id,
    sortGroupsBy: (a, b) => {
      const aRank = popularProviders.indexOf(a.category)
      const bRank = popularProviders.indexOf(b.category)
      const aPopular = aRank >= 0
      const bPopular = bRank >= 0
      if (aPopular && !bPopular) return -1
      if (!aPopular && bPopular) return 1
      return aRank - bRank
    },
  })

  return (
    <DialogV2 size="large" variant="settings" class="settings-v2-manage-models-dialog">
      <DialogHeader hideClose={true} closeLabel={language.t("common.close")}>
        <DialogTitleGroup
          title={language.t("dialog.model.manage")}
          description={language.t("dialog.model.manage.description")}
        />
        <ButtonV2 variant="neutral" icon="plus" onClick={handleConnectProvider}>
          {language.t("command.provider.connect")}
        </ButtonV2>
      </DialogHeader>
      <DialogBody class="flex min-h-0 flex-1 flex-col">
        <div class="flex items-center gap-2 px-4 pt-px pb-3">
          <div class="relative min-w-0 flex-1">
            <TextInputV2
              type="search"
              appearance="base"
              class="!w-full self-stretch"
              value={list.filter()}
              onInput={(event) => list.onInput(event.currentTarget.value)}
              placeholder={language.t("dialog.model.search.placeholder")}
              spellcheck={false}
              autocorrect="off"
              autocomplete="off"
              autocapitalize="off"
              autofocus
              aria-label={language.t("dialog.model.search.placeholder")}
            />
            <Show when={list.filter()}>
              <IconButtonV2
                type="button"
                variant="ghost-muted"
                size="small"
                class="settings-v2-tab-search-clear"
                icon={<IconV2 name="close" size="large" class="text-v2-icon-icon-muted" />}
                onClick={() => list.clear()}
                aria-label={language.t("common.clear")}
              />
            </Show>
          </div>
          <ButtonV2
            type="button"
            size="small"
            variant={enabledOnly() ? "neutral" : "ghost-muted"}
            onClick={() => setEnabledOnly((value) => !value)}
          >
            Enabled only
          </ButtonV2>
        </div>
        <div data-slot="manage-models-scroll" class="relative min-h-0 flex-1">
          <div class="settings-v2-panel settings-v2-models h-full px-4 pt-4 pb-4">
            <Show
              when={!list.grouped.loading}
              fallback={
                <div class="settings-v2-models-status">
                  {language.t("common.loading")}
                  {language.t("common.loading.ellipsis")}
                </div>
              }
            >
              <Show
                when={list.flat().length > 0}
                fallback={
                  <div class="settings-v2-models-status">
                    <span>{language.t("dialog.model.empty")}</span>
                    <Show when={list.filter()}>
                      <span class="settings-v2-models-status-filter">&quot;{list.filter()}&quot;</span>
                    </Show>
                  </div>
                }
              >
                <For each={list.grouped.latest}>
                  {(group) => {
                    const searching = () => list.filter().length > 0
                    const expanded = () => searching() || !providerState.collapsed[group.category]
                    const total = () => providerList(group.category).length
                    const visible = () => providerVisibleCount(group.category)

                    return (
                      <div
                        class="settings-v2-section"
                        data-component="settings-models-provider"
                        data-expanded={expanded() ? "" : undefined}
                      >
                        <div class="settings-v2-models-group-header justify-between">
                          <button
                            type="button"
                            class="settings-v2-models-group-trigger min-w-0 flex-1"
                            aria-expanded={expanded()}
                            disabled={searching()}
                            onClick={() => setProviderState("collapsed", group.category, expanded())}
                          >
                            <span class="settings-v2-models-group-chevron">
                              <IconV2 name={expanded() ? "chevron-down" : "chevron-right"} size="small" />
                            </span>
                            <ProviderIcon id={group.category} width={16} height={16} class="shrink-0" />
                            <span class="settings-v2-section-title min-w-0 truncate">{group.items[0].provider.name}</span>
                            <span class="shrink-0 text-[11px] text-v2-text-text-faint [font-weight:440]">
                              {visible()} / {total()}
                            </span>
                          </button>
                          <SwitchV2
                            class="mr-4"
                            checked={providerVisible(group.category)}
                            onChange={(checked) => setProviderVisibility(group.category, checked)}
                            hideLabel
                          >
                            {group.items[0].provider.name}
                          </SwitchV2>
                        </div>
                        <Show when={expanded()}>
                          <SettingsListV2>
                            <For each={group.items}>
                              {(item) => (
                                <SettingsRowV2 title={item.name} description="">
                                  <div>
                                    <SwitchV2
                                      checked={local.model.visible({ modelID: item.id, providerID: item.provider.id })}
                                      onChange={(checked) => setModelVisibility(item, checked)}
                                      hideLabel
                                    >
                                      {item.name}
                                    </SwitchV2>
                                  </div>
                                </SettingsRowV2>
                              )}
                            </For>
                          </SettingsListV2>
                        </Show>
                      </div>
                    )
                  }}
                </For>
              </Show>
            </Show>
          </div>
        </div>
      </DialogBody>
    </DialogV2>
  )
}
