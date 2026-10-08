import { SessionMessage } from "../message"

export const MARKER = "<!-- meristem:method-guidance -->"

export type VerificationLevel = "none" | "static" | "behavior" | "integration"

export interface Evidence {
  readonly changed: boolean
  readonly verification: VerificationLevel
  readonly toolErrors: number
}

const rank: Record<VerificationLevel, number> = {
  none: 0,
  static: 1,
  behavior: 2,
  integration: 3,
}

const mutationTool = /(^|[-_.])(edit|write|patch|apply[-_]?patch)([-_.]|$)/i
const executionTool = /(^|[-_.])(bash|shell|terminal|exec|command|process|run)([-_.]|$)/i
const integrationTool = /(browser|playwright|puppeteer|screenshot|chrome|chromium|adb|emulator|simulator)/i

const integrationCommand =
  /\b(playwright|puppeteer|chromium|google-chrome|adb\s+(?:shell|install)|curl\s+https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])|wget\s+https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]))\b/i

const behaviorCommand =
  /\b(bun\s+test|(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test\b|vitest\b|jest\b|pytest\b|cargo\s+test\b|go\s+test\b|gradle(?:w)?\b[^\n]*\btest\b|mvn\b[^\n]*\btest\b)/i

const staticCommand =
  /\b(typecheck|tsc\b|eslint\b|oxlint\b|lint\b|build\b|compile\b|check:generated\b|cargo\s+check\b|gradle(?:w)?\b[^\n]*\bassemble\w*\b|mvn\b[^\n]*\bpackage\b)/i

const mutatingCommand =
  /(?:^|[;&|]\s*)(?:sed\s+-i\b|perl\s+-p?i\b|rm\s|mv\s|cp\s|touch\s|mkdir\s|git\s+apply\b)|(?:^|\s)(?:tee\s+\S+|cat\s+[^\n]*>\s*\S+)/i

export function enabled(system: string, messages: ReadonlyArray<SessionMessage.Message> = []) {
  let active = system.includes(MARKER)
  for (const message of messages) {
    if (message.type !== "system") continue
    if (message.text.startsWith("These instructions replace all previously loaded ambient instructions.")) {
      active = message.text.includes(MARKER)
      continue
    }
    if (message.text === "Previously loaded instructions no longer apply.") active = false
  }
  return active
}

export function inspect(messages: ReadonlyArray<SessionMessage.Message>): Evidence {
  const start = findLastUser(messages)
  const current = messages.slice(start + 1)
  let changed = false
  let verification: VerificationLevel = "none"
  let toolErrors = 0

  const markMutation = () => {
    changed = true
    verification = "none"
  }

  const markVerification = (candidate: VerificationLevel) => {
    if (!changed || rank[candidate] <= rank[verification]) return
    verification = candidate
  }

  for (const message of current) {
    if (message.type === "shell") {
      if (mutatingCommand.test(message.command)) markMutation()
      continue
    }

    if (message.type !== "assistant") continue
    let recognizedMutation = false

    for (const content of message.content) {
      if (content.type !== "tool") continue
      if (content.state.status === "error") {
        toolErrors++
        continue
      }
      if (content.state.status !== "completed") continue

      const input = stringify(content.state.input)
      if (mutationTool.test(content.name)) {
        markMutation()
        recognizedMutation = true
      }
      if (!succeeded(content.state.structured)) {
        toolErrors++
        continue
      }
      const level = classify(input, content.name)
      if (level) markVerification(level)
    }

    if ((message.snapshot?.files?.length ?? 0) > 0 && !recognizedMutation) markMutation()
  }

  return { changed, verification, toolErrors }
}

export function render(messages: ReadonlyArray<SessionMessage.Message>) {
  const evidence = inspect(messages)
  if (!evidence.changed && evidence.toolErrors === 0) return

  const notes = ["Meristem method reminder (derived from this turn's observable session history):"]

  if (evidence.changed) {
    if (evidence.verification === "none")
      notes.push(
        "Files changed in this turn, but no post-change verification is visible. Before claiming completion, verify at the strongest practical level.",
      )
    if (evidence.verification === "static")
      notes.push(
        "Files changed and a static/build check is visible. Treat that as static evidence only; do not describe runtime or user-visible behavior as verified from it.",
      )
    if (evidence.verification === "behavior")
      notes.push(
        "Files changed and an automated behavior/test check is visible. Credit only the claims that check actually exercises; integration/user-visible behavior still needs its own evidence.",
      )
    if (evidence.verification === "integration")
      notes.push(
        "Files changed and an integration-capable/runtime-facing check is visible. Treat runtime or user-visible behavior as verified only when that check exercised the changed path; do not generalize beyond the path and environment actually observed.",
      )
  }

  if (evidence.toolErrors > 0)
    notes.push("One or more tool calls failed this turn; resolve them or carry the uncertainty forward explicitly.")

  notes.push("Do not rerun a successful check merely to satisfy this reminder; reuse evidence when it actually covers the claim.")
  return notes.join("\n")
}

function succeeded(structured: Readonly<Record<string, unknown>>) {
  if (structured.timeout === true) return false
  if (typeof structured.exit === "number" && structured.exit !== 0) return false
  return true
}

function classify(input: string, name: string): VerificationLevel | undefined {
  if (integrationTool.test(name)) return "integration"
  if (!executionTool.test(name)) return undefined
  if (integrationCommand.test(input)) return "integration"
  if (behaviorCommand.test(input)) return "behavior"
  if (staticCommand.test(input)) return "static"
  return undefined
}

function stringify(value: unknown) {
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function findLastUser(messages: ReadonlyArray<SessionMessage.Message>) {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index]?.type === "user") return index
  }
  return -1
}
