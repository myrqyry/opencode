import { type Accessor, createEffect, createMemo, createResource, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"
import { uniqueBy } from "remeda"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { useProviders } from "@/hooks/use-providers"
import { Persist, persisted } from "@/utils/persist"
import { isZeroCostModel } from "./models-cost"

export type ModelKey = { providerID: string; modelID: string }

type Visibility = "show" | "hide"
type User = ModelKey & { visibility: Visibility; favorite?: boolean }
type Store = {
  user: User[]
  recent: ModelKey[]
  variant?: Record<string, string | undefined>
}

const RECENT_LIMIT = 5
const MODEL_VISIBILITY_EVENT = "opencode:model-visibility-changed"
const MODEL_VISIBILITY_BACKUP = "meristem.model-visibility.v1"

type ModelVisibilityEvent = ModelKey & { visibility: Visibility }

function readVisibilityBackup(): User[] {
  if (typeof localStorage === "undefined") return []
  try {
    const value = JSON.parse(localStorage.getItem(MODEL_VISIBILITY_BACKUP) ?? "[]")
    if (!Array.isArray(value)) return []
    return value.filter(
      (item): item is User =>
        !!item &&
        typeof item === "object" &&
        typeof item.providerID === "string" &&
        typeof item.modelID === "string" &&
        (item.visibility === "show" || item.visibility === "hide"),
    )
  } catch {
    return []
  }
}

function writeVisibilityBackup(user: User[]) {
  if (typeof localStorage === "undefined") return
  try {
    localStorage.setItem(MODEL_VISIBILITY_BACKUP, JSON.stringify(user))
  } catch {
    // The primary persisted store still works if browser backup storage is unavailable.
  }
}

function modelKey(model: ModelKey) {
  return `${model.providerID}:${model.modelID}`
}

export const { use: useModels, provider: ModelsProvider } = createSimpleContext({
  name: "Models",
  gate: false,
  init: (props: { directory?: Accessor<string | undefined> } = {}) => {
    const providers = useProviders(() => props.directory?.())

    const [store, setStore, _, ready] = persisted(
      Persist.global("model", ["model.v1"]),
      createStore<Store>({
        user: [],
        recent: [],
        variant: {},
      }),
    )

    let backupChecked = false
    createEffect(() => {
      if (!ready() || backupChecked) return
      backupChecked = true
      const backup = readVisibilityBackup()
      if (store.user.length === 0 && backup.length > 0) {
        setStore("user", backup)
        return
      }
      writeVisibilityBackup(store.user)
    })

    const onVisibilityChanged = (event: Event) => {
      const detail = (event as CustomEvent<ModelVisibilityEvent>).detail
      if (!detail) return
      update(
        { providerID: detail.providerID, modelID: detail.modelID },
        detail.visibility,
      )
      writeVisibilityBackup(store.user)
    }

    if (typeof window !== "undefined") {
      window.addEventListener(MODEL_VISIBILITY_EVENT, onVisibilityChanged)
      onCleanup(() => window.removeEventListener(MODEL_VISIBILITY_EVENT, onVisibilityChanged))
    }

    const available = createMemo(() =>
      providers.connected().flatMap((p) =>
        Object.values(p.models).map((m) => ({
          ...m,
          provider: p,
        })),
      ),
    )

    const visibility = createMemo(() => {
      const map = new Map<string, Visibility>()
      for (const item of store.user) map.set(`${item.providerID}:${item.modelID}`, item.visibility)
      return map
    })

    const list = createMemo(() =>
      available().map((m) => ({
        ...m,
        name: m.name.replace("(latest)", "").trim(),
        latest: m.name.includes("(latest)"),
      })),
    )

    const find = (key: ModelKey) => list().find((m) => m.id === key.modelID && m.provider.id === key.providerID)

    function update(model: ModelKey, state: Visibility) {
      const index = store.user.findIndex((x) => x.modelID === model.modelID && x.providerID === model.providerID)
      if (index >= 0) {
        setStore("user", index, (current) => ({ ...current, visibility: state }))
        return
      }
      setStore("user", store.user.length, { ...model, visibility: state })
    }

    const visible = (model: ModelKey) => {
      const key = modelKey(model)
      const state = visibility().get(key)
      if (state === "hide") return false
      if (state === "show") return true
      const item = find(model)
      return item ? isZeroCostModel(item) : false
    }

    const setVisibility = (model: ModelKey, state: boolean) => {
      const visibility = state ? "show" : "hide"
      update(model, visibility)
      writeVisibilityBackup(store.user)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent<ModelVisibilityEvent>(MODEL_VISIBILITY_EVENT, {
            detail: { ...model, visibility },
          }),
        )
      }
    }

    const push = (model: ModelKey) => {
      const uniq = uniqueBy([model, ...store.recent], (x) => `${x.providerID}:${x.modelID}`)
      if (uniq.length > RECENT_LIMIT) uniq.pop()
      setStore("recent", uniq)
    }

    const variantKey = (model: ModelKey) => `${model.providerID}/${model.modelID}`
    const getVariant = (model: ModelKey) => store.variant?.[variantKey(model)]

    const setVariant = (model: ModelKey, value: string | undefined) => {
      const key = variantKey(model)
      if (!store.variant) {
        setStore("variant", { [key]: value })
        return
      }
      setStore("variant", key, value)
    }

    const [recentModels] = createResource(
      async () => {
        const recent = store.recent
        await ready.promise
        return recent
      },
      (p) => p,
      { initialValue: [] },
    )
    return {
      ready,
      list,
      find,
      visible,
      setVisibility,
      recent: {
        list: () => recentModels()!,
        push,
      },
      variant: {
        get: getVariant,
        set: setVariant,
      },
    }
  },
})
