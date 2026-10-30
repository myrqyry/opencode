import { createMemo, Show, type JSX } from "solid-js"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { type ServerConnection } from "@/context/server"
import { sessionCompletionStatus, useSessionCompletionState } from "@/pages/layout/session-completion-state"

function SessionCompletionIcon(props: {
  done: boolean
  error: boolean
  fallback?: JSX.Element
}) {
  const status = createMemo(() => sessionCompletionStatus({ done: props.done, error: props.error }))
  return (
    <Show when={status()} fallback={props.fallback}>
      {(value) => (
        <IconV2
          name={value() === "done" ? "check" : "xmark-small"}
          size="small"
          class={value() === "done" ? "text-v2-state-fg-success" : "text-v2-state-fg-danger"}
        />
      )}
    </Show>
  )
}

export function SessionCompletionStatus(props: {
  server: ServerConnection.Key | undefined
  sessionId: string | undefined
  fallback?: JSX.Element
}) {
  const completion = useSessionCompletionState(
    () => props.server,
    () => props.sessionId,
  )
  return (
    <SessionCompletionIcon done={completion.done()} error={completion.error()} fallback={props.fallback} />
  )
}
