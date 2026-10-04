<!-- meristem-template:v1 -->
# Learnings

Project-local reusable lessons. A learning should prevent future work or error, not merely narrate what happened.

Use entries like:

## YYYY-MM-DD — Learning

**Signal / failure:**
**Mechanism:**
**Scope:**
**Evidence:**
**Recommended behavior:**
**Validation status:** observed | tested | unvalidated

## 2026-10-01 — New-layout radius overrides exist twice; the unlayered copy wins

**Signal / failure:** The new-layout shape overrides in `packages/app/src/index.css` are declared **twice** — once inside `@layer` (the `button-v2`/`icon-button-v2` block, the `text-input-v2`/`textarea-v2`/… block, and the `dialog-v2`/`menu-v2-content`/`toast-v2` block) and again as an unlayered block immediately after, under the comment *"Radius overrides are intentionally unlayered so they win over the V2 component sheets."*

**Mechanism:** An unlayered rule outranks a layered rule at equal specificity, so the second copy always applies. The two copies had **diverged**: the layered `dialog-v2`/`menu-v2-content`/`toast-v2` rule said `14px` while the unlayered one said `16px`. The `14px` is therefore **dead** — it never renders. The layered `10px` copies happen to agree with the unlayered ones, so the drift is only visible on the one rule where the values differ.

**Scope:** `packages/app/src/index.css`. Any future edit to a new-layout radius must account for both copies, or the edit appears to work and changes nothing (if made in the layered copy) or silently overrides a deliberate unlayered choice (if made in both).

**Evidence:** The layered `14px` and the unlayered `16px` cover identical selector lists; the unlayered one wins. The dead value is now annotated in place with a comment saying it never applies. CSS is not verified by `bun typecheck` — a change made only in the layered copy typechecks and builds cleanly while having no effect, so build success is not proof the change landed.

**Recommended behavior:** Treat the unlayered block as the effective one. When changing a new-layout radius, change the unlayered rule; do not "fix" the dead `14px` expecting it to take effect. The safe cleanup is to delete the entire layered tier once confirmed unused, rather than reconciling the two copies value-by-value.

**Validation status:** tested — `packages/app` `bun run build` passes and the built CSS emits all ten `--v2-shape-*` tokens with zero unresolved `var()` references, so no control loses its computed radius.
