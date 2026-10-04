import { createResource, createSignal } from "solid-js"
import { useServer } from "@/context/server"
import { authTokenFromCredentials } from "@/utils/server"

export type OpenCodeRestartState = "idle" | "restarting" | "failed"

export function useOpenCodeRestart() {
  const server = useServer()
  const [state, setState] = createSignal<OpenCodeRestartState>("idle")
  const [capability, { refetch }] = createResource(
    () => server.current,
    async (conn) => {
      if (!conn) return
      const headers = conn.http.password
        ? {
            Authorization: `Basic ${authTokenFromCredentials({
              username: conn.http.username,
              password: conn.http.password,
            })}`,
          }
        : undefined
      try {
        const response = await fetch(new URL("/global/health", conn.http.url), {
          headers,
          signal: AbortSignal.timeout(2_500),
        })
        if (!response.ok) return
        const value: unknown = await response.json()
        if (!value || typeof value !== "object") return
        const health = value as { pid?: unknown; restartable?: unknown }
        if (health.restartable !== true || typeof health.pid !== "number") return
        return { restartable: true as const, pid: health.pid }
      } catch {
        return
      }
    },
  )

  const restart = async () => {
    const conn = server.current
    const current = capability()
    if (!conn || !current?.restartable || state() === "restarting") return

    const headers = conn.http.password
      ? {
          Authorization: `Basic ${authTokenFromCredentials({
            username: conn.http.username,
            password: conn.http.password,
          })}`,
        }
      : undefined

    setState("restarting")
    try {
      const response = await fetch(new URL("/global/restart", conn.http.url), { method: "POST", headers })
      if (!response.ok) throw new Error(`Restart request failed with ${response.status}`)
      const result = (await response.json()) as { pid?: unknown }
      const previousPid = typeof result.pid === "number" ? result.pid : current.pid
      const deadline = Date.now() + 60_000

      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        try {
          const healthResponse = await fetch(new URL("/global/health", conn.http.url), {
            headers,
            signal: AbortSignal.timeout(2_000),
          })
          if (!healthResponse.ok) continue
          const value: unknown = await healthResponse.json()
          if (!value || typeof value !== "object") continue
          const health = value as { healthy?: unknown; pid?: unknown; restartable?: unknown }
          if (health.healthy === true && health.restartable === true && health.pid !== previousPid) {
            window.location.reload()
            return
          }
        } catch {}
      }
      throw new Error("Restart timed out")
    } catch (error) {
      console.error("[meristem] failed to restart OpenCode", error)
      setState("failed")
      window.setTimeout(() => {
        setState("idle")
        void refetch()
      }, 2_500)
    }
  }

  return {
    state,
    capability,
    restart,
  }
}
