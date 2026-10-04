import { Match, Switch } from "solid-js"
import type { ServerConnection } from "@/context/server"
import type { WorkspaceView } from "@/context/tabs"
import { SettingsKeybinds } from "@/components/settings-keybinds"
import { SettingsGeneralV2 } from "@/components/settings-v2/general"
import { SettingsModelsV2 } from "@/components/settings-v2/models"
import { SettingsProvidersV2 } from "@/components/settings-v2/providers"
import { SettingsSkillsV2 } from "@/components/settings-v2/skills"
import "@/components/settings-v2/settings-v2.css"

export default function WorkspacePage(props: {
  view: WorkspaceView
  server: ServerConnection.Key
  directory: string
}) {
  const directory = () => props.directory

  return (
    <div
      data-component="workspace-center-page"
      class="settings-v2-panel size-full min-h-0 bg-project-surface"
    >
      <div
        classList={{
          "workspace-center-page-inner": true,
          "workspace-settings-combined": props.view === "settings",
        }}
      >
        <Switch>
          <Match when={props.view === "settings"}>
            <SettingsGeneralV2 />
            <SettingsKeybinds v2 />
          </Match>
          <Match when={props.view === "models"}>
            <SettingsModelsV2 />
          </Match>
          <Match when={props.view === "providers"}>
            <SettingsProvidersV2 directory={directory} />
          </Match>
          <Match when={props.view === "skills"}>
            <SettingsSkillsV2 directory={directory} />
          </Match>
        </Switch>
      </div>
    </div>
  )
}
