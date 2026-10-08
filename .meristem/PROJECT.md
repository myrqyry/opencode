<!-- meristem-template:v1 -->
# Project

## Purpose

OpenCode — the open-source AI coding agent (terminal, desktop, and web surfaces).

This checkout is **`opencode-upstream`**: a working copy of `origin` = `https://github.com/anomalyco/opencode.git`, with Meristem integration preserved on branch `meristem-desktop` and published to `mat-fork` = `https://github.com/myrqyry/opencode.git`. The upstream `dev` branch and Mat's older fork `dev` branch remain separate. Local-UI, supervised-restart, global-skills-control, interface and session guidance work are checkpointed in the Meristem branch; do not assume every runtime path is verified simply because Git is clean.

The distinctive premise of the runtime is that **one server instance runs sessions for multiple projects and worktrees**, with V2 Session Core separating durable prompt admission from model execution. See `specs/project.md` and `specs/v2/` for the design record.

## Invariants

- `AGENTS.md` is the authoritative agent-rules document for this repo (style, boundaries, V2 Session Core contract). Do not contradict it from Meristem notes.
- Runtime dependency direction: Schema → Core and Protocol; Core and Protocol → Server. Client runtime may depend on Schema and Protocol but **never** Core or Server; `sdk-next` composes Client, Core, and Server.
- V2 Session Core: durable prompt admission stays separate from model execution; `SessionExecution` is process-global and Session-ID based; one explicit `llm.stream(request)` call per provider turn; local drains stay process-local until clustering exists.
- `packages/app` is the SolidJS/Vite desktop+web app; legacy V1 and V2 UI/runtime surfaces coexist, so confirm which surface a change targets.

## Architecture and boundaries

Monorepo (`bun` workspaces, catalog deps) under `packages/`. Domain-relevant packages: `schema`, `protocol`, `client`, `core`, `server`, `sdk`, `sdk-next`, `opencode` (CLI/runtime), `app` (UI), `session-ui`, `ui`, `tui`, `desktop`, `llm`, `plugin`.

Authority for design/architecture lives in:
- `AGENTS.md` — agent rules and V2 Session Core contract.
- `specs/project.md`, `specs/v2/*.md` (notably `session.md`, `instructions.md`, `config.md`, `provider-*.md`) — normative behavior specs.
- `CONTEXT.md` — the "OpenCode Session Runtime" domain glossary (System Context, Context Source, Context Epoch, Mid-Conversation System Message, etc.).
- `packages/app/AGENTS.md`, `CONTRIBUTING.md` — package/app-local conventions.

Codegen boundary: `packages/client/src/generated/**` and `packages/client/src/generated-effect/**` are generated outputs. Never edit them directly. Regenerate with `bun run generate` from `packages/client`; `bun run check:generated` (`generate && git diff --exit-code -- src/generated src/generated-effect`) is the deterministic guard for that lane.

**Codegen lane boundary:** `bun run generate` from `packages/client` covers only the public Protocol `HttpApi` under `packages/protocol/src/groups/`. Instance-local groups declared inside `packages/opencode/src/server/routes/instance/httpapi/groups/` (for example `global.ts`, which owns `POST /global/restart`) are **not** protocol-scoped and so do not appear in `packages/client/src/generated`. Those surfaces are covered by the legacy JS SDK generator, `./packages/sdk/js/script/build.ts`, which does pick them up. Absence from `packages/client/src/generated` is therefore not by itself evidence of codegen drift.

## Known-good workflows

- Package manager: `bun` (`bun@1.3.14`); do not introduce pnpm/yarn even though some template docs mention pnpm.
- Dev: `bun dev` (opencode runtime), `bun dev:web` (app), `bun dev:desktop`, `bun dev:console`.
- Regenerate the client SDK after any public Protocol or Server `HttpApi` change: `bun run generate` from `packages/client`.
- Regenerate the legacy JS SDK: `./packages/sdk/js/script/build.ts`.
- Lint: `bun run lint` (oxlint) from the repo root.

## Verification

- Type checking: run `bun typecheck` **from package directories** (e.g. `packages/opencode`), never `tsc` directly.
- Tests: cannot run from the repo root (guard emits `do-not-run-tests-from-root`); run from package dirs such as `packages/opencode`.
- App e2e: Playwright from `packages/app`; expects an opencode backend at `localhost:4096` (`bun run test:e2e:local`).
- For protocol/UI changes, static typecheck is not sufficient — confirm generated client output and, where user-visible, runtime/UI behavior.

## Open structural uncertainty

- **Meristem layer now checkpointed.** The Meristem-specific UI, runtime, session guidance, generated SDK, tests, and theme changes are in `meristem-desktop` on Mat's fork. After the 2026-10-07 `c089f690d` push, local and remote refs matched. The pre-push typecheck passed 30/30 packages; focused browser tests passed 3/3. This is preservation and static verification, not evidence that every runtime integration works. Keep current source and live runtime checks authoritative over dated status.
- **Legacy API spec is stale, not merely divergent.** `specs/project.md`'s `### api` section (begins at line 5) documents a flat legacy route layout (`GET /project/:projectID/session`, `POST /project/:projectID/session/:sessionID/abort`, …) and contains **zero** references to the V2 `HttpApi` groups. The runtime no longer registers those routes: `packages/opencode/src/server/routes/` contains only `instance/`, and no `project/:projectID/session` registration exists anywhere under `packages/opencode/src/server/`. Treat that section as historical rather than binding; current route authority is the `HttpApi` groups under `packages/protocol/src/groups/` plus `packages/opencode/src/server/routes/instance/httpapi/groups/`. Reconciling the spec itself (rewrite against the V2 groups, or mark the section as historical) is still open and unowned.
- **Stale template documentation.** `packages/app/README.md` is stock SolidJS/Vite template boilerplate: it states dependencies are managed with `pnpm`, instructs opening `localhost:3000`, and refers to "these templates". All of that conflicts with actual repo practice (`bun`, `bun dev:web`, Playwright against `localhost:4096`). Treat `AGENTS.md`/`CONTRIBUTING.md` as authoritative over it.
- **Resolved — client codegen is not drifting.** An earlier revision of this file recorded `packages/client/src/generated/*` as untouched and presumed stale, with `/global/restart` wrongly implied to be owed a `packages/client` regeneration. Current evidence: `HealthGetOutput` in `packages/client/src/generated/types.ts` now carries the `version`/`pid` added by `packages/protocol/src/groups/health.ts`, so that obligation is satisfied; `/global/restart` is correctly absent from that lane because it is not protocol-scoped; and `packages/sdk/js/src/v2/gen/sdk.gen.ts` does expose `restart()` → `POST /global/restart` with `restartable` in `types.gen.ts`. See the codegen lane boundary above.
