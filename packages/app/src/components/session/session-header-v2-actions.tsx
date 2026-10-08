import { createMediaQuery } from "@solid-primitives/media"
import { Show } from "solid-js"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { KeybindV2 } from "@opencode-ai/ui/v2/keybind-v2"
import { TooltipV2 } from "@opencode-ai/ui/v2/tooltip-v2"
import { useCommand } from "@/context/command"
import { useLanguage } from "@/context/language"
import { useLayout } from "@/context/layout"
import { useSettings } from "@/context/settings"
import { StatusPopoverV2 } from "../status-popover"

/**
 * New-layout right-panel header controls: the server status popover and the right-sidebar
 * toggle. Split out of session-header because it is chrome rather than session content — the
 * shell renders it above the routed child, so opening a workspace view (which replaces
 * SessionPage as the center route) no longer takes these controls with it.
 *
 * The project workspace shell owns this portal while it is inside the directory SDK provider,
 * so session layout state remains available even when a workspace view replaces SessionPage.
 * It must not reach for TerminalProvider or the deeper session sync tree, because those are
 * mounted inside SessionPage and are not ancestors here.
 */
export function SessionHeaderV2Actions() {
  const language = useLanguage()
  const settings = useSettings()
  const command = useCommand()
  const layout = useLayout()
  const isDesktop = createMediaQuery("(min-width: 768px)")

  return (
    <div class="flex items-center gap-2">
      <Show when={settings.visibility.status}>
        <Tooltip placement="bottom" value={language.t("status.popover.trigger")}>
          <StatusPopoverV2 />
        </Tooltip>
      </Show>
      <Show when={isDesktop() && settings.visibility.fileTree()}>
        <TooltipV2
          class="shrink-0"
          placement="bottom"
          value={
            <>
              {language.t("workspace.rightSidebar.toggle")}
              <Show when={command.keybindParts("fileTree.toggle").length > 0}>
                <KeybindV2 keys={command.keybindParts("fileTree.toggle")} variant="neutral" />
              </Show>
            </>
          }
        >
          <IconButtonV2
            type="button"
            variant="ghost-muted"
            size="large"
            class="!w-9 shrink-0"
            state={layout.fileTree.opened() ? "pressed" : undefined}
            onClick={() => layout.fileTree.toggle()}
            aria-label={language.t("workspace.rightSidebar.toggle")}
            aria-expanded={layout.fileTree.opened()}
            aria-controls="review-panel"
            icon={<IconV2 name="sidebar-right" />}
          />
        </TooltipV2>
      </Show>
    </div>
  )
}
