import { describe, expect, test } from "bun:test"
import { isZeroCostModel } from "./models-cost"

describe("isZeroCostModel", () => {
  test("keeps zero-cost local models eligible by default", () => {
    expect(isZeroCostModel({ cost: { input: 0, output: 0, cache: { read: 0, write: 0 } } })).toBe(true)
  })

  test("does not treat priced models as free", () => {
    expect(isZeroCostModel({ cost: { input: 0.25, output: 1, cache: { read: 0, write: 0 } } })).toBe(false)
    expect(isZeroCostModel({ cost: { input: 0, output: 0, cache: { read: 0.1, write: 0 } } })).toBe(false)
  })

  test("does not treat missing price metadata as free", () => {
    expect(isZeroCostModel({})).toBe(false)
    expect(isZeroCostModel({ cost: {} })).toBe(false)
  })
})
