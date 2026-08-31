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

## Ocode profile isolation

`ocode` is intentionally a separate working environment from the stock `opencode` installation, not merely a second command name.

- The launcher sets `OPENCODE_APP_NAME=ocode`.
- Global XDG-backed config, data, state, cache, logs, repos, and temporary files therefore use the `ocode` namespace instead of `opencode`.
- The legacy home-level config directory is `~/.ocode` for `ocode`; stock OpenCode continues to use `~/.opencode`.
- Explicit `OPENCODE_CONFIG`, `OPENCODE_CONFIG_CONTENT`, `OPENCODE_CONFIG_DIR`, and `OPENCODE_DB` routing inherited by the launcher is cleared so stock settings do not silently bleed into the custom environment.
- Project-local `.opencode` directories remain shared intentionally because they describe the project rather than the global client. This also preserves project-level agents, commands, skills, and plugins.
- Shared external skill locations may remain available. Global `opencode`-specific skills/plugins should be migrated selectively rather than copied wholesale.

The isolation boundary exists to prevent plugins, MCP/config hooks, permissions, formatters/LSP settings, databases, and other automatic global behavior from one installation from destabilizing the other.

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
