# Meristem layer

This fork is intentionally a thin customization of upstream OpenCode. The goal is not to replace OpenCode's architecture; it is to make the default coding-agent behavior preserve context, inspect deeply, verify claims, and continue work without repeatedly losing the user's intent.

## Fork invariants

- Keep upstream compatibility high. Prefer small isolated changes over broad rewrites.
- `opencode` remains the stock-install command; this fork exposes `ocode` so both can coexist for A/B comparison.
- Use broad discovery before narrow execution for non-trivial repository work.
- Distinguish inspected, verified, suspected, failed, and not-inspected states. A code edit is not proof of completion.
- Treat contradictory evidence and user corrections as reasons to reopen discovery.
- Recover available context before asking the user to repeat it.
- Preserve causal continuation across compaction: current goal, why it matters, decisions and reasons, corrections, files, verification, unresolved risks, working behavior that must not regress, and the exact next step.
- Protect working systems and persistent state. Avoid destructive resets, unrelated cleanup, dependency churn, or broad refactors for convenience.
- Prefer existing deterministic mechanisms, repository conventions, specialists, scripts, and test harnesses before inventing new machinery.
- Do not reduce an established goal merely because implementation becomes difficult. Prefer partial verified progress over false completion.

## Review defaults

When reviewing or debugging code:

- inspect the actual implementation rather than reasoning from filenames or diffs alone;
- trace relevant callers, dependencies, tests, configuration, and history when they can change the conclusion;
- identify concrete placeholders, mocks, stubs, TODOs, dead paths, and configuration mismatches when relevant;
- report exact files and locations when available;
- separate confirmed defects from hypotheses;
- explain the realistic failure scenario instead of inventing hypothetical bugs;
- report material working behavior alongside defects when it helps preserve a good design or avoid regression.

## Upstream discipline

The fork should stay easy to compare and sync with `anomalyco/opencode:dev`. Fork-specific behavior should remain concentrated in clearly identifiable files or small patches whenever possible. Before adding a core modification, first check whether OpenCode already exposes a stable config, skill, agent, plugin, command, or hook that can accomplish the same goal with less divergence.

When an upstream change supersedes a fork patch, prefer deleting the fork patch and adopting upstream rather than maintaining duplicate behavior.
