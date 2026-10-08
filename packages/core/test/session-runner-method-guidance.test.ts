import { describe, expect, test } from "bun:test"
import { DateTime } from "effect"
import { ModelV2 } from "@opencode-ai/core/model"
import { ProviderV2 } from "@opencode-ai/core/provider"
import { RelativePath } from "@opencode-ai/core/schema"
import { SessionMessage } from "@opencode-ai/core/session/message"
import { enabled, MARKER, inspect, render } from "@opencode-ai/core/session/runner/method-guidance"

const now = DateTime.makeUnsafe(1)

const system = (text: string) =>
  SessionMessage.System.make({
    id: SessionMessage.ID.create(),
    type: "system",
    text,
    time: { created: now },
  })

const user = (text = "Do the work") =>
  SessionMessage.User.make({
    id: SessionMessage.ID.create(),
    type: "user",
    text,
    files: [],
    agents: [],
    time: { created: now },
  })

const tool = (
  name: string,
  input: Record<string, unknown>,
  status: "completed" | "error" = "completed",
  structured: Record<string, unknown> = {},
) =>
  status === "completed"
    ? SessionMessage.AssistantTool.make({
        type: "tool",
        id: "call-" + name,
        name,
        time: { created: now },
        state: SessionMessage.ToolStateCompleted.make({
          status: "completed",
          input,
          content: [],
          structured,
        }),
      })
    : SessionMessage.AssistantTool.make({
        type: "tool",
        id: "call-" + name,
        name,
        time: { created: now },
        state: SessionMessage.ToolStateError.make({
          status: "error",
          input,
          content: [],
          structured: {},
          error: { type: "unknown", message: "failed" },
        }),
      })

const assistant = (
  content: ReadonlyArray<SessionMessage.AssistantContent>,
  files: ReadonlyArray<string> = [],
) =>
  SessionMessage.Assistant.make({
    id: SessionMessage.ID.create(),
    type: "assistant",
    agent: "build",
    model: { id: ModelV2.ID.make("fake"), providerID: ProviderV2.ID.make("fake") },
    time: { created: now },
    content: Array.from(content),
    snapshot: files.length > 0 ? { files: files.map((file) => RelativePath.make(file)) } : undefined,
  })

describe("Meristem method guidance", () => {
  test("tracks the effective Meristem instruction marker across updates", () => {
    expect(enabled(`before\n${MARKER}\nafter`)).toBe(true)
    expect(enabled("ordinary project instructions")).toBe(false)
    expect(
      enabled("old baseline", [
        system(`These instructions replace all previously loaded ambient instructions.\n\n${MARKER}`),
      ]),
    ).toBe(true)
    expect(
      enabled(`${MARKER}\nold baseline`, [
        system("These instructions replace all previously loaded ambient instructions.\n\nordinary instructions"),
      ]),
    ).toBe(false)
    expect(enabled(`${MARKER}\nold baseline`, [system("Previously loaded instructions no longer apply.")])).toBe(false)
  })

  test("stays silent when the current turn has no method signal", () => {
    expect(render([user(), assistant([])])).toBeUndefined()
  })

  test("warns when a recognized edit has no later verification", () => {
    const messages = [user(), assistant([tool("edit", { path: "src/a.ts" })], ["src/a.ts"])]
    expect(inspect(messages)).toEqual({ changed: true, verification: "none", toolErrors: 0 })
    expect(render(messages)).toContain("no post-change verification is visible")
  })

  test("keeps verification that happens after an edit in the same provider step", () => {
    const messages = [
      user(),
      assistant(
        [
          tool("edit", { path: "src/a.ts" }),
          tool("bash", { command: "bun test test/a.test.ts" }),
        ],
        ["src/a.ts"],
      ),
    ]
    expect(inspect(messages)).toEqual({ changed: true, verification: "behavior", toolErrors: 0 })
    expect(render(messages)).toContain("automated behavior/test check is visible")
  })

  test("does not infer verification from filenames in non-execution tools", () => {
    const messages = [user(), assistant([tool("edit", { path: "src/build.ts" })], ["src/build.ts"])]
    expect(inspect(messages).verification).toBe("none")
  })

  test("does not count a failed command as verification", () => {
    const messages = [
      user(),
      assistant(
        [
          tool("edit", { path: "src/a.ts" }),
          tool("bash", { command: "bun test test/a.test.ts" }, "completed", { exit: 1 }),
        ],
        ["src/a.ts"],
      ),
    ]
    expect(inspect(messages).verification).toBe("none")
  })

  test("does not mistake typecheck for runtime verification", () => {
    const messages = [
      user(),
      assistant(
        [
          tool("write", { path: "src/a.ts" }),
          tool("bash", { command: "bun typecheck" }),
        ],
        ["src/a.ts"],
      ),
    ]
    expect(inspect(messages).verification).toBe("static")
    expect(render(messages)).toContain("static/build check is visible")
  })

  test("does not count a failed verification command as evidence", () => {
    const messages = [
      user(),
      assistant(
        [
          tool("write", { path: "src/a.ts" }),
          tool("bash", { command: "bun test test/a.test.ts" }, "completed", { exit: 1, truncated: false }),
        ],
        ["src/a.ts"],
      ),
    ]
    expect(inspect(messages)).toEqual({ changed: true, verification: "none", toolErrors: 1 })
    expect(render(messages)).toContain("no post-change verification is visible")
    expect(render(messages)).toContain("tool calls failed")
  })

  test("recognizes a visible browser check as integration evidence", () => {
    const messages = [
      user(),
      assistant(
        [
          tool("write", { path: "src/a.ts" }),
          tool("playwright_browser", { url: "http://localhost:4196" }),
        ],
        ["src/a.ts"],
      ),
    ]
    expect(inspect(messages).verification).toBe("integration")
  })

  test("uses snapshot files as a conservative mutation fallback", () => {
    const messages = [user(), assistant([tool("custom-transform", {})], ["src/a.ts"])]
    expect(inspect(messages)).toEqual({ changed: true, verification: "none", toolErrors: 0 })
  })

  test("reports tool failures even when no file changed", () => {
    const messages = [user(), assistant([tool("bash", { command: "unknown" }, "error")])]
    expect(inspect(messages).toolErrors).toBe(1)
    expect(render(messages)).toContain("tool calls failed")
  })

  test("does not carry prior-turn evidence into a new user turn", () => {
    const messages = [
      user("First task"),
      assistant([tool("edit", { path: "src/a.ts" })], ["src/a.ts"]),
      user("Unrelated question"),
      assistant([]),
    ]
    expect(render(messages)).toBeUndefined()
  })
})
