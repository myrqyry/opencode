export const MODEL_SELECTOR_ROW_HEIGHT = 28
export const MODEL_SELECTOR_OVERSCAN = 6

export function modelSelectorWindow(input: {
  count: number
  scrollTop: number
  viewportHeight: number
  rowHeight?: number
  overscan?: number
}) {
  const rowHeight = input.rowHeight ?? MODEL_SELECTOR_ROW_HEIGHT
  const overscan = input.overscan ?? MODEL_SELECTOR_OVERSCAN
  const top = input.scrollTop
  const height = Math.max(0, input.viewportHeight)
  const start = Math.min(input.count, Math.max(0, Math.floor(top / rowHeight) - overscan))
  return {
    start,
    end: Math.min(input.count, Math.max(start, Math.ceil((top + height) / rowHeight) + overscan)),
  }
}
