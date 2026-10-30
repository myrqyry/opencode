import { createMemo, type Accessor } from "solid-js"
import { useGlobal } from "@/context/global"
import { type Notification, useNotification } from "@/context/notification"
import { ServerConnection } from "@/context/server"

export type SessionCompletionStatus = "done" | "error" | undefined

// A turn that finished while the session was off screen stays unseen until the
// session is opened, so the unseen completion is what a done status reports.
// An unseen failure outranks it: a session that errored is not done.
export function sessionCompletionStatus(input: { done: boolean; error: boolean }): SessionCompletionStatus {
  if (input.error) return "error"
  if (input.done) return "done"
  return undefined
}

export function useSessionCompletionState(
  server: Accessor<ServerConnection.Key | undefined>,
  sessionId: Accessor<string | undefined>,
) {
  const global = useGlobal()
  const notification = useNotification()
  const unseen = createMemo<Notification[]>(() => {
    const key = server()
    const id = sessionId()
    if (!key || !id) return []
    const conn = global.servers.list().find((item) => ServerConnection.key(item) === key)
    if (!conn) return []
    return notification.ensureServerState(key).session.unseen(id)
  })
  return {
    done: createMemo(() => unseen().some((item) => item.type === "turn-complete")),
    error: createMemo(() => unseen().some((item) => item.type === "error")),
  }
}
