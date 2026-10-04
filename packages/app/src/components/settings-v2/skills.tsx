import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { createMemo, createResource, createSignal, For, Show, type Accessor } from "solid-js"
import { reconcile } from "solid-js/store"
import { useServerSDK } from "@/context/server-sdk"
import { useServerSync } from "@/context/server-sync"
import { showToast } from "@/utils/toast"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

type SkillInfo = {
  name: string
  description?: string
  location: string
}

type SkillAction = "allow" | "deny" | "ask"

export function SettingsSkillsV2(props: { directory: Accessor<string | undefined> }) {
  const serverSDK = useServerSDK()
  const serverSync = useServerSync()
  const [saving, setSaving] = createSignal<string>()

  const [skills, { refetch }] = createResource(
    () => props.directory(),
    async (directory) => {
      const result = await serverSDK().client.v2.skill.list(
        { location: { directory } },
        { throwOnError: true },
      )
      return result.data.data as SkillInfo[]
    },
  )

  const child = createMemo(() => {
    const directory = props.directory()
    if (!directory) return
    return serverSync().child(directory, { bootstrap: true })
  })

  const skillRule = () => {
    const permission = child()?.[0].config.permission
    if (permission === "allow" || permission === "deny" || permission === "ask") return permission
    if (!permission || typeof permission !== "object" || Array.isArray(permission)) return
    return permission.skill
  }

  const action = (name: string): SkillAction => {
    const rule = skillRule()
    if (typeof rule === "string") return rule as SkillAction
    if (!rule || typeof rule !== "object") return "allow"
    const exact = rule[name]
    if (exact === "allow" || exact === "deny" || exact === "ask") return exact
    const fallback = rule["*"]
    if (fallback === "allow" || fallback === "deny" || fallback === "ask") return fallback
    return "allow"
  }

  const enabled = (name: string) => action(name) !== "deny"

  const setEnabled = async (name: string, value: boolean) => {
    const directory = props.directory()
    const entry = child()
    if (!directory || !entry || saving()) return

    const next: SkillAction = value ? "allow" : "deny"
    const [store, setStore] = entry

    setSaving(name)
    const previousPermission = store.config.permission
    const permissionObject =
      previousPermission && typeof previousPermission === "object" && !Array.isArray(previousPermission)
        ? previousPermission
        : {}
    const current = permissionObject.skill
    const currentObject =
      current && typeof current === "object" && !Array.isArray(current) ? current : {}
    setStore("config", "permission", { ...permissionObject, skill: { ...currentObject, [name]: next } })

    try {
      await serverSDK().client.config.update(
        {
          directory,
          config: {
            permission: {
              skill: {
                [name]: next,
              },
            },
          },
        },
        { throwOnError: true },
      )
      const fresh = await serverSDK().client.config.get({ directory }, { throwOnError: true })
      setStore("config", reconcile(fresh.data, { merge: false }))
      void refetch()
    } catch (error) {
      setStore("config", "permission", previousPermission)
      showToast({
        title: "Could not update skill",
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSaving(undefined)
    }
  }

  return (
    <>
      <div class="settings-v2-tab-header settings-v2-tab-header--stacked">
        <div>
          <h2 class="settings-v2-tab-title">Skills</h2>
          <p class="mt-2 text-[12px] leading-5 text-v2-text-text-muted">
            Choose which discovered skills are available to agents in this project.
          </p>
        </div>
      </div>

      <div class="settings-v2-tab-body settings-v2-skills">
        <div class="settings-v2-section">
          <Show
            when={!skills.loading}
            fallback={<div class="text-[13px] text-v2-text-text-muted">Loading skills…</div>}
          >
            <Show
              when={(skills() ?? []).length > 0}
              fallback={
                <div class="rounded-[10px] bg-v2-background-bg-layer-01 px-4 py-5 text-[13px] text-v2-text-text-muted">
                  No skills were discovered for this project.
                </div>
              }
            >
              <SettingsListV2>
                <For each={(skills() ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))}>
                  {(skill) => (
                    <SettingsRowV2
                      title={
                        <span class="settings-v2-skill-heading">
                          <span class="settings-v2-skill-icon" aria-hidden="true">
                            <IconV2 name="skills" size="small" />
                          </span>
                          <span class="settings-v2-skill-name">{skill.name}</span>
                        </span>
                      }
                      description={
                        <div class="settings-v2-skill-copy">
                          <Show when={skill.description}>
                            <span>{skill.description}</span>
                          </Show>
                          <span class="settings-v2-skill-location" title={skill.location}>
                            {skill.location}
                          </span>
                        </div>
                      }
                    >
                      <Switch
                        checked={enabled(skill.name)}
                        disabled={saving() === skill.name}
                        onChange={(checked) => void setEnabled(skill.name, checked)}
                        hideLabel
                      >
                        {skill.name}
                      </Switch>
                    </SettingsRowV2>
                  )}
                </For>
              </SettingsListV2>
            </Show>
          </Show>
        </div>

        <p class="text-[11px] leading-5 text-v2-text-text-faint">
          Skill access is project-specific and stored in this workspace&apos;s OpenCode configuration.
        </p>
      </div>
    </>
  )
}
