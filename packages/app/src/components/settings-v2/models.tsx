import { useFilteredList } from "@opencode-ai/ui/hooks"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { batch, createSignal, type Component, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useLanguage } from "@/context/language"
import { useModels } from "@/context/models"
import { useServerSDK } from "@/context/server-sdk"
import { popularProviders } from "@/hooks/use-providers"
import { Persist, persisted } from "@/utils/persist"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

type ModelItem = ReturnType<ReturnType<typeof useModels>["list"]>[number]

const PROVIDER_ICON_SIZE = 16

export const SettingsModelsV2: Component = () => {
  const language = useLanguage()
  const models = useModels()
  const serverSdk = useServerSDK()
  const [enabledOnly, setEnabledOnly] = createSignal(false)
  const [store, setStore] = persisted(
    Persist.serverGlobal(serverSdk().scope, "settings-v2.models.providers"),
    createStore({ collapsed: {} as Record<string, boolean> }),
  )

  const providerModels = (providerID: string) => models.list().filter((item) => item.provider.id === providerID)
  const providerEnabled = (providerID: string) => {
    const items = providerModels(providerID)
    return items.length > 0 && items.every((item) => models.visible({ providerID, modelID: item.id }))
  }
  const providerEnabledCount = (providerID: string) =>
    providerModels(providerID).filter((item) => models.visible({ providerID, modelID: item.id })).length
  const setProviderEnabled = (providerID: string, enabled: boolean) => {
    batch(() => {
      for (const item of providerModels(providerID)) {
        models.setVisibility({ providerID, modelID: item.id }, enabled)
      }
    })
  }
  const searching = () => list.filter().length > 0
  const expanded = (providerID: string) => searching() || !store.collapsed[providerID]
  const allExpanded = () => list.grouped.latest.length > 0 && list.grouped.latest.every((group) => expanded(group.category))
  const toggleAll = () => {
    if (searching()) return
    const collapse = allExpanded()
    batch(() => {
      for (const group of list.grouped.latest) setStore("collapsed", group.category, collapse)
    })
  }

  const list = useFilteredList<ModelItem>({
    items: (_filter) =>
      models
        .list()
        .filter((item) => !enabledOnly() || models.visible({ providerID: item.provider.id, modelID: item.id })),
    key: (x) => `${x.provider.id}:${x.id}`,
    filterKeys: ["provider.name", "name", "id"],
    sortBy: (a, b) => a.name.localeCompare(b.name),
    groupBy: (x) => x.provider.id,
    sortGroupsBy: (a, b) => {
      const aIndex = popularProviders.indexOf(a.category)
      const bIndex = popularProviders.indexOf(b.category)
      const aPopular = aIndex >= 0
      const bPopular = bIndex >= 0

      if (aPopular && !bPopular) return -1
      if (!aPopular && bPopular) return 1
      if (aPopular && bPopular) return aIndex - bIndex

      const aName = a.items[0].provider.name
      const bName = b.items[0].provider.name
      return aName.localeCompare(bName)
    },
  })

  return (
    <>
      <div class="settings-v2-tab-header settings-v2-tab-header--stacked">
        <h2 class="settings-v2-tab-title">{language.t("settings.models.title")}</h2>
        <div class="flex items-center gap-2">
          <div class="settings-v2-tab-search min-w-0 flex-1">
            <TextInputV2
              type="search"
              appearance="base"
              value={list.filter()}
              onInput={(event) => list.onInput(event.currentTarget.value)}
              placeholder={language.t("dialog.model.search.placeholder")}
              spellcheck={false}
              autocorrect="off"
              autocomplete="off"
              autocapitalize="off"
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
              />
            </Show>
          </div>
          <IconButtonV2
            type="button"
            variant="ghost-muted"
            size="small"
            disabled={searching() || list.grouped.latest.length === 0}
            aria-label={language.t(allExpanded() ? "session.todo.collapse" : "session.todo.expand")}
            aria-pressed={allExpanded()}
            title={language.t(allExpanded() ? "session.todo.collapse" : "session.todo.expand")}
            icon={<IconV2 name={allExpanded() ? "collapse" : "expand-list"} size="small" />}
            onClick={toggleAll}
          />
          <ButtonV2
            type="button"
            size="small"
            variant={enabledOnly() ? "neutral" : "ghost-muted"}
            onClick={() => setEnabledOnly((value) => !value)}
          >
            Enabled only
          </ButtonV2>
        </div>
      </div>

      <div class="settings-v2-tab-body settings-v2-models">
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
                const isExpanded = () => expanded(group.category)

                return (
                  <div
                    class="settings-v2-section"
                    data-component="settings-models-provider"
                    data-expanded={isExpanded() ? "" : undefined}
                  >
                    <h3 class="settings-v2-models-group-header justify-between">
                      <button
                        type="button"
                        class="settings-v2-models-group-trigger"
                        aria-expanded={isExpanded()}
                        disabled={searching()}
                        onClick={() => setStore("collapsed", group.category, isExpanded())}
                      >
                        <span class="settings-v2-models-group-chevron">
                            <Show
                              when={isExpanded()}
                            fallback={
                              <svg width="5" height="6" viewBox="0 0 5 6" fill="none" aria-hidden="true">
                                <path
                                  d="M0.75194 5.31663C0.41861 5.51103 0 5.27063 0 4.88473V0.500754C0 0.114854 0.41861 -0.125577 0.75194 0.0688635L4.5096 2.26084C4.8404 2.45378 4.8404 2.93168 4.5096 3.12462L0.75194 5.31663Z"
                                  fill="currentColor"
                                />
                              </svg>
                            }
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path
                                d="M5.37624 6.75194C5.18184 6.41861 5.42224 6 5.80814 6H10.1921C10.578 6 10.8184 6.41861 10.624 6.75194L8.43203 10.5096C8.23909 10.8404 7.76119 10.8404 7.56825 10.5096L5.37624 6.75194Z"
                                fill="currentColor"
                              />
                            </svg>
                          </Show>
                        </span>
                        <span class="settings-v2-models-group-label">
                          <ProviderIcon
                            id={group.category}
                            width={PROVIDER_ICON_SIZE}
                            height={PROVIDER_ICON_SIZE}
                            class="settings-v2-models-provider-icon shrink-0"
                          />
                          <span class="settings-v2-section-title">{group.items[0].provider.name}</span>
                          <span class="shrink-0 text-[11px] text-v2-text-text-faint [font-weight:440]">
                            {providerEnabledCount(group.category)} / {providerModels(group.category).length}
                          </span>
                        </span>
                      </button>
                      <Switch
                        class="mr-3"
                        checked={providerEnabled(group.category)}
                        onChange={(checked) => setProviderEnabled(group.category, checked)}
                        hideLabel
                      >
                        {group.items[0].provider.name}
                      </Switch>
                    </h3>
                    <Show when={isExpanded()}>
                      <SettingsListV2>
                        <For each={group.items}>
                          {(item) => {
                            const key = { providerID: item.provider.id, modelID: item.id }
                            return (
                              <SettingsRowV2 title={item.name} description="">
                                <div>
                                  <Switch
                                    checked={models.visible(key)}
                                    onChange={(checked) => {
                                      models.setVisibility(key, checked)
                                    }}
                                    hideLabel
                                  >
                                    {item.name}
                                  </Switch>
                                </div>
                              </SettingsRowV2>
                            )
                          }}
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
    </>
  )
}
