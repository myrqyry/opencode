import type { LocalProject } from "@/context/layout"
import { useProjectColor } from "@/utils/project-color"
import type { ServerConnection } from "@/context/server"
import { displayName, getProjectAvatarSource } from "@/pages/layout/helpers"
import { useSessionTabAvatarState } from "@/pages/layout/project-avatar-state"
import { ProjectAvatar } from "@opencode-ai/ui/v2/project-avatar-v2"
import { IllusionSpinnerV2 } from "@opencode-ai/ui/v2/illusion-spinner-v2"
import { Show } from "solid-js"

export function SessionTabAvatar(props: {
  project?: LocalProject
  directory: string
  sessionId: string
  server: ServerConnection.Key
  revealProjectOnHover?: boolean
}) {
  const state = useSessionTabAvatarState(
    () => props.server,
    () => props.directory,
    () => props.sessionId,
  )
  return (
    <SessionTabAvatarView
      project={props.project}
      directory={props.directory}
      revealProjectOnHover={props.revealProjectOnHover}
      unread={state.unread()}
      loading={state.loading()}
    />
  )
}

export function SessionTabAvatarView(props: {
  project?: LocalProject
  directory: string
  revealProjectOnHover?: boolean
  unread: boolean
  loading: boolean
}) {
  const projectColor = useProjectColor()
  const project = () => props.project ?? { worktree: props.directory }
  const projectAvatar = () => (
    <ProjectAvatar
      fallback={displayName(project())}
      src={getProjectAvatarSource(props.project?.id, props.project?.icon)}
      variant={projectColor.resolve(project())}
      shape={props.project?.icon?.shape}
      unread={props.unread}
    />
  )
  return (
    <Show when={props.loading} fallback={projectAvatar()}>
      <span class="relative block size-4 shrink-0">
        <IllusionSpinnerV2
          class={`absolute inset-0 size-4 ${props.revealProjectOnHover === false ? "" : "group-hover:invisible"}`}
        />
        <Show when={props.revealProjectOnHover !== false}>
          <span class="invisible absolute inset-0 group-hover:visible">{projectAvatar()}</span>
        </Show>
      </span>
    </Show>
  )
}
