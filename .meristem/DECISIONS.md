<!-- meristem-template:v1 -->
# Decisions

Record decisions only when the choice or its rationale is likely to matter later.

Use entries like:

## YYYY-MM-DD — Decision

**Decision:**
**Why:**
**Alternatives considered:**
**Constraints / consequences:**
**Evidence / references:**
**Supersedes:** none

## 2026-10-06 — Meristem method guidance is marker-gated and session-derived

**Decision:** Keep durable collaboration and repository method in the normal global/project instruction sources, then add a small V2 provider-turn guidance layer that is enabled only when the ambient instructions contain `<!-- meristem:method-guidance -->`. The guidance derives only from observable current-turn session evidence: file mutation, verification-like execution after the latest mutation, and failed tool/command outcomes.

**Why:** Static instructions express the durable method well, but models can lose the relevant distinction at the exact moment they make a completion claim. A narrow runtime reminder can restate the evidence boundary without duplicating the full Meristem prompt or turning heuristic interpretation into hard policy.

**Alternatives considered:** Always-on core guidance was rejected because it would silently change stock OpenCode behavior. A large deterministic policy engine was deferred because many Meristem methods require judgment and because false enforcement would be worse than a conservative prompt. Folding the logic into `InstructionContext` was rejected because instruction discovery is Location-scoped while the evidence is Session-scoped.

**Constraints / consequences:** The detector must remain conservative: completed commands with non-zero exit/timeout are failures, not verification; static/build, behavior-test, and integration-capable checks are evidence classes rather than proof that a claim is covered; runtime/user-visible claims still require the observed check to exercise the changed path. Mid-session instruction replacements can enable or disable the marker, so an immutable older context baseline neither strands newly opted-in sessions nor keeps guidance active after the ambient Meristem instructions stop applying.

**Evidence / references:** `packages/core/src/session/runner/method-guidance.ts`; `packages/core/src/session/runner/llm.ts`; `packages/core/test/session-runner-method-guidance.test.ts`; targeted `SessionRunnerLLM` integration test; Meristem global `~/.config/meristem/opencode/AGENTS.md` marker.

**Supersedes:** none
