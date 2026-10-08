import { expect, mock, test } from "bun:test"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Effect } from "effect"

let openedEnv: NodeJS.ProcessEnv | undefined

await mock.module("@opencode-ai/core/open", () => ({
  openUrl: async (url: string, options?: { env?: NodeJS.ProcessEnv }) => {
    openedEnv = options?.env
    const code = new URL(url).pathname === "/successful" ? 0 : 23
    const subprocess = spawn(process.execPath, ["-e", `process.exit(${code})`], { stdio: "ignore" })
    await once(subprocess, "close")
    return subprocess
  },
}))

const { McpBrowser } = await import("../../src/mcp/browser")

test("reports a browser launcher that exited before openUrl returned", async () => {
  const error = await Effect.runPromise(
    Effect.gen(function* () {
      const browser = yield* McpBrowser.Service
      return yield* Effect.flip(browser.open("https://example.com/authorize"))
    }).pipe(Effect.provide(LayerNode.compile(McpBrowser.node))),
  )

  expect(error.message).toBe("Browser open failed with exit code 23")
})

test("accepts a browser launcher that exited successfully before openUrl returned", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const browser = yield* McpBrowser.Service
      yield* browser.open("https://example.com/successful")
    }).pipe(Effect.provide(LayerNode.compile(McpBrowser.node))),
  )
})

test("forwards Meristem browser XDG homes through the shared opener", async () => {
  if (process.platform !== "linux") return

  const previousConfig = process.env.OPENCODE_BROWSER_XDG_CONFIG_HOME
  const previousData = process.env.OPENCODE_BROWSER_XDG_DATA_HOME
  process.env.OPENCODE_BROWSER_XDG_CONFIG_HOME = "/tmp/opencode-browser-config"
  process.env.OPENCODE_BROWSER_XDG_DATA_HOME = "/tmp/opencode-browser-data"
  openedEnv = undefined

  try {
    await Effect.runPromise(
      Effect.gen(function* () {
        const browser = yield* McpBrowser.Service
        yield* browser.open("https://example.com/successful")
      }).pipe(Effect.provide(LayerNode.compile(McpBrowser.node))),
    )

    expect(openedEnv).toMatchObject({
      XDG_CONFIG_HOME: "/tmp/opencode-browser-config",
      XDG_DATA_HOME: "/tmp/opencode-browser-data",
    })
  } finally {
    if (previousConfig === undefined) delete process.env.OPENCODE_BROWSER_XDG_CONFIG_HOME
    else process.env.OPENCODE_BROWSER_XDG_CONFIG_HOME = previousConfig
    if (previousData === undefined) delete process.env.OPENCODE_BROWSER_XDG_DATA_HOME
    else process.env.OPENCODE_BROWSER_XDG_DATA_HOME = previousData
  }
})
