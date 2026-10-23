---
name: solid-prop-contracts
description: Use when reviewing or narrowing SolidJS component props in OpenCode's packages/app or packages/session-ui, especially optional callbacks, mock-only fallbacks, or props that admit impossible production states.
---

# SolidJS Production Prop Contracts

Adapted from [HumanLayer's narrow-react-prop-types](https://github.com/humanlayer/skills/tree/main/plugins/narrow-react-prop-types/skills/narrow-react-prop-types), for OpenCode's **SolidJS** UI. The recurring failure mode is an optional prop added for a test, story, or demo even though every live caller provides it, allowing broken production wiring without a type error.

## Narrow, evidence-first procedure

1. **Identify one concrete candidate.** Look for `onAction?.()`, optional handlers on visible controls, fallbacks such as `items ?? []`, or broad component props. Prefer a small contract with real production consequences; do not sweep the entire UI.
2. **Trace every live call site.** Search imports, JSX, conditional branches, and prop spreads in app routes, page components, and runtime entrypoints. Distinguish live callers from `*.stories.tsx`, `*.test.*`, fixtures, and demos. If a dynamic spread or external consumer leaves the contract uncertain, investigate instead of narrowing by assumption.
3. **Classify the actual contract.** Required if all live paths supply the value; optional if a real live path legitimately omits it; required-but-nullable if callers pass a value that can be empty. Never infer optionality from a support fixture alone. Keep V1 and V2 callers distinct.
4. **Pin the failure before editing.** For a type-only correction, add a focused `*.contract.typecheck.ts` with a missing-prop example annotated `@ts-expect-error`; confirm `bun typecheck` fails with an unused directive before the change. For behavior changes, first write a real failing unit/component test of the observable problem.
5. **Change the smallest surface.** Tighten the prop and remove only the optional calls or fallbacks now ruled out by the live contract. Keep genuine empty states and feature-gated behavior. Never make a handler required unless all real paths provide it.
6. **Verify and report.** Run `bun typecheck` in each affected package, the relevant focused tests, then package-level unit/browser tests and a production build when appropriate. Tests run from the package directory, not the monorepo root. Separate unrelated pre-existing failures from the result. Avoid app/server restarts or touching installed sessions.

## Evidence standard

For each changed prop, report the production callers, why omission is impossible or invalid, RED/GREEN proof, checks actually run, and any unresolved live behavior. A typecheck proves the static contract, **not** a working browser interaction.

## Reference example

`packages/app/src/components/dialog-usage-exceeded.tsx`: both live prompt call sites pass `onClose` so the API should require it; a type-level omission check fails before tightening and passes afterward. This is a concrete case, not permission to generalize to other callbacks without inspecting their callers.

Keep the original upstream skill unmodified. Distill the method, not React-specific types or GitHub automation.
