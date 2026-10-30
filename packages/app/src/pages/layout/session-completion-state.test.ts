import { describe, expect, test } from "bun:test"
import { sessionCompletionStatus } from "./session-completion-state"

describe("sessionCompletionStatus", () => {
  test("reports an unseen failure ahead of a completion", () => {
    expect(sessionCompletionStatus({ done: true, error: true })).toBe("error")
  })

  test("reports an unseen completion as done", () => {
    expect(sessionCompletionStatus({ done: true, error: false })).toBe("done")
  })

  test("reports nothing when the session has no unseen completion", () => {
    expect(sessionCompletionStatus({ done: false, error: false })).toBeUndefined()
  })
})
