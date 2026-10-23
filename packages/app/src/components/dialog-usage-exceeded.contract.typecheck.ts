import type { DialogGoUpsellProps } from "./dialog-usage-exceeded"

// The live usage-limit prompts always provide a close callback to persist whether
// the user dismissed the notice. This must not be optional for future call sites.
// @ts-expect-error missing onClose must fail the component's public prop contract
const missingClose: DialogGoUpsellProps = {
  title: "Usage limit",
  description: "Limit reached",
  actionLabel: "Manage providers",
}

// A valid call site supplies a callback, even if it ignores the optional argument.
const acknowledged: DialogGoUpsellProps = {
  title: "Usage limit",
  description: "Limit reached",
  actionLabel: "Manage providers",
  onClose: () => {},
}

void missingClose
void acknowledged
