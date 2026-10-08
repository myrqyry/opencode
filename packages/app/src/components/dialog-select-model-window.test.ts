import { describe, expect, test } from "bun:test"
import { MODEL_SELECTOR_OVERSCAN, MODEL_SELECTOR_ROW_HEIGHT, modelSelectorWindow } from "./dialog-select-model-window"

describe("modelSelectorWindow", () => {
  test("limits mounted rows to the viewport plus overscan", () => {
    const result = modelSelectorWindow({ count: 175, scrollTop: 0, viewportHeight: 220 })
    expect(result).toEqual({ start: 0, end: 14 })
    expect(result.end - result.start).toBeLessThanOrEqual(
      Math.ceil(220 / MODEL_SELECTOR_ROW_HEIGHT) + MODEL_SELECTOR_OVERSCAN,
    )
  })

  test("keeps an overscanned window around a deep scroll position", () => {
    const result = modelSelectorWindow({ count: 175, scrollTop: 2800, viewportHeight: 220 })
    expect(result.start).toBe(94)
    expect(result.end).toBe(114)
  })

  test("clamps the window to the available row count", () => {
    expect(modelSelectorWindow({ count: 3, scrollTop: 500, viewportHeight: 220 })).toEqual({ start: 3, end: 3 })
    expect(modelSelectorWindow({ count: 0, scrollTop: 0, viewportHeight: 220 })).toEqual({ start: 0, end: 0 })
  })

  test("does not render rows from a group below the viewport", () => {
    expect(modelSelectorWindow({ count: 30, scrollTop: -1000, viewportHeight: 220 })).toEqual({ start: 0, end: 0 })
  })
})
