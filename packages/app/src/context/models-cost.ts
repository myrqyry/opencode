/** True only when model and cache pricing are explicitly free. */
export function isZeroCostModel(model: {
  cost?: { input?: number; output?: number; cache?: { read?: number; write?: number } }
}) {
  const cost = model.cost
  return !!cost && cost.input === 0 && cost.output === 0 && !cost.cache?.read && !cost.cache?.write
}
