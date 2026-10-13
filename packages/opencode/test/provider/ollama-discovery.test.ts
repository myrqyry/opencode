import { afterAll, expect } from "bun:test"
import { Effect } from "effect"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Provider } from "@/provider/provider"
import { Env } from "@/env"
import { Plugin } from "@/plugin/index"
import { testEffect } from "../lib/effect"
import { ProviderV2 } from "@opencode-ai/core/provider"
import { ModelV2 } from "@opencode-ai/core/model"

const chat = {
  name: "test-chat:latest",
  capabilities: ["completion", "tools", "thinking"],
  details: { family: "test", context_length: 16384 },
}
const vision = {
  name: "test-vision:latest",
  capabilities: ["completion", "vision"],
  details: { family: "test", context_length: 32768 },
}
const embeddings = {
  name: "test-embed:latest",
  capabilities: ["embedding"],
}
const manual = {
  name: "my-manual:latest",
  capabilities: ["completion", "tools"],
}

let inventory: Array<Record<string, unknown>> = [chat, embeddings, manual]
let unavailable = false
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    if (new URL(request.url).pathname !== "/api/tags") return new Response(null, { status: 404 })
    if (unavailable) return new Response(null, { status: 503 })
    return Response.json({ models: inventory })
  },
})

afterAll(() => server.stop(true))

const it = testEffect(LayerNode.compile(LayerNode.group([Provider.node, Env.node, Plugin.node])))

it.instance(
  "discovers Ollama models, refreshes removals and additions, preserves overrides and last good snapshot",
  Effect.gen(function* () {
    const provider = yield* Provider.Service
    const id = ProviderV2.ID.make("ollama")
    const first = (yield* provider.list())[id].models
    expect(first["test-chat:latest"]?.capabilities.toolcall).toBe(true)
    expect(first["test-chat:latest"]?.capabilities.reasoning).toBe(true)
    expect(first["test-chat:latest"]?.limit.context).toBe(16384)
    expect(first["test-embed:latest"]).toBeUndefined()
    expect(first["my-manual"]?.name).toBe("My custom override")
    expect(first["my-manual"]?.capabilities.toolcall).toBe(false)
    expect(first["my-manual:latest"]).toBeUndefined()
    expect(first["test-chat:latest"]?.api.id).toBe("test-chat:latest")
    expect((yield* provider.getModel(id, ModelV2.ID.make("test-chat:latest"))).name).toBe("test-chat:latest")

    inventory = [vision, embeddings]
    // A subsequent list inside the refresh window preserves the cached snapshot.
    expect((yield* provider.list())[id].models["test-chat:latest"]).toBeDefined()
    yield* Effect.promise(() => Bun.sleep(15_100))

    const second = (yield* provider.list())[id].models
    expect(second["test-chat:latest"]).toBeUndefined()
    expect(second["test-vision:latest"]?.capabilities.input.image).toBe(true)
    expect(second["test-vision:latest"]?.capabilities.toolcall).toBe(false)
    expect(second["my-manual"]?.name).toBe("My custom override")

    unavailable = true
    yield* Effect.promise(() => Bun.sleep(15_100))
    const third = (yield* provider.list())[id].models
    expect(third["test-vision:latest"]).toBeDefined()
    expect(third["my-manual"]).toBeDefined()
  }),
  {
    config: {
      provider: {
        ollama: {
          npm: "@ai-sdk/openai-compatible",
          options: { baseURL: `http://127.0.0.1:${server.port}/v1` },
          models: {
            "my-manual": {
              name: "My custom override",
              tool_call: false,
              limit: { context: 4096, output: 1024 },
            },
          },
        },
      },
    },
  },
  { timeout: 50000 },
)
