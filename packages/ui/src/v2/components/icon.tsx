import { renderIconBody, type IconDefinition } from "@mingcute/icons"
import {
  AddIcon,
  AddSquareIcon,
  AIIcon,
  AlignJustifyIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArchiveIcon,
  BrainIcon,
  CheckIcon,
  ChipIcon,
  CloseIcon,
  CloseSmallIcon,
  Columns2Icon,
  Copy2Icon,
  DirectoryIcon,
  DownSmallIcon,
  Edit3Icon,
  ExternalLinkIcon,
  FolderIcon,
  GitBranchIcon,
  GridIcon,
  LayoutIcon,
  LayoutLeftbarOpenIcon,
  LayoutRightbarOpenIcon,
  ListCheck3Icon,
  ListCollapseIcon,
  ListExpansionIcon,
  MenuIcon,
  MonitorIcon,
  More2Icon,
  Magic3Icon,
  Message3AIIcon,
  Message3Icon,
  NewFolderIcon,
  QuestionIcon,
  Refresh2Icon,
  RightSmallIcon,
  Search2Icon,
  Server2Icon,
  ServerIcon,
  Settings3Icon,
  Share2Icon,
  StopCircleIcon,
  SubtractIcon,
} from "@mingcute/icons/core-regular"
import {
  Message3Icon as Message3FillIcon,
  PlusIcon as PlusFilledIcon,
  ServerIcon as ServerFilledIcon,
} from "@mingcute/icons/core-filled"
import { onMount, type ComponentProps, splitProps } from "solid-js"

type IconEntry = {
  definition?: IconDefinition
  viewBox?: string
  body?: string
  boostStroke?: boolean
}

const legacyExpand: IconEntry = {
  viewBox: "0 0 16 16",
  body: `<path d="M8.25 6.17773V1.17773M11.25 4.17773L8.25 1.17773L5.25 4.17773" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.25 9.17773V14.1777M11.25 11.1777L8.25 14.1777L5.25 11.1777" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.25 7.67773H12.25" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
}

const icons = {
  edit: { definition: Edit3Icon },
  "folder-add-left": { definition: NewFolderIcon },
  folder: { definition: FolderIcon },
  branch: { definition: GitBranchIcon },
  "file-tree": { definition: DirectoryIcon },
  models: { definition: BrainIcon },
  providers: { definition: ChipIcon },
  skills: { definition: Magic3Icon },
  "new-chat": { definition: Message3AIIcon },
  chat: { definition: Message3Icon },
  "chat-filled": { definition: Message3FillIcon },
  server: { definition: ServerIcon },
  "sidebar-left": { definition: LayoutLeftbarOpenIcon },
  "grid-plus": { definition: GridIcon },
  help: { definition: QuestionIcon },
  "sidebar-right": { definition: LayoutRightbarOpenIcon },
  status: { definition: Server2Icon },
  "status-active": { definition: ServerFilledIcon },
  "magnifying-glass": { definition: Search2Icon },
  menu: { definition: MenuIcon },
  plus: { definition: PlusFilledIcon },
  stage: { definition: AddIcon },
  unstage: { definition: SubtractIcon },
  "settings-gear": { definition: Settings3Icon, boostStroke: false },
  "chevron-down": { definition: DownSmallIcon },
  "chevron-right": { definition: RightSmallIcon },
  collapse: { definition: ListCollapseIcon },
  check: { definition: CheckIcon },
  monitor: { definition: MonitorIcon },
  "workspace-new": { definition: AddSquareIcon },
  "workspace-isolated": { definition: AIIcon },
  workspace: { definition: LayoutIcon },
  close: { definition: CloseIcon },
  "xmark-small": { definition: CloseSmallIcon },
  "outline-xmark": { definition: CloseSmallIcon },
  "outline-chevron-down": { definition: DownSmallIcon },
  "outline-dots": { definition: More2Icon },
  expand: legacyExpand,
  "expand-list": { definition: ListExpansionIcon },
  filetree: { definition: DirectoryIcon },
  split: { definition: Columns2Icon },
  unified: { definition: AlignJustifyIcon },
  review: { definition: ListCheck3Icon },
  "outline-sliders": { definition: Settings3Icon },
  "outline-copy": { definition: Copy2Icon },
  "external-link": { definition: ExternalLinkIcon },
  "outline-square-arrow": { definition: ExternalLinkIcon },
  "outline-share": { definition: Share2Icon },
  reset: { definition: Refresh2Icon },
  "outline-reset": { definition: Refresh2Icon },
  "arrow-up": { definition: ArrowUpIcon },
  "arrow-down": { definition: ArrowDownIcon },
  stop: { definition: StopCircleIcon },
  archive: { definition: ArchiveIcon },
} satisfies Record<string, IconEntry>

export type IconName = keyof typeof icons

function boostedBody(definition: IconDefinition, id: string, boostStroke = true) {
  const body = renderIconBody(definition, id)
    .replaceAll('stroke-linecap="square"', 'stroke-linecap="round"')
    .replaceAll('stroke-linejoin="miter"', 'stroke-linejoin="round"')
  return boostStroke ? body.replaceAll('stroke-width="2"', 'stroke-width="2.35"') : body
}

function iconMarkup(name: IconName) {
  const icon: IconEntry = icons[name]
  if (icon.definition) {
    return {
      viewBox: icon.definition.viewBox,
      body: boostedBody(icon.definition, `opencode-v2-mingcute-${name}`, icon.boostStroke !== false),
    }
  }
  return {
    viewBox: icon.viewBox ?? "0 0 24 24",
    body: icon.body ?? "",
  }
}

export function iconDataUri(name: IconName) {
  const icon = iconMarkup(name)
  const body = icon.body.replaceAll("currentColor", "#ffffff")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" fill="none">${body}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const spriteID = "opencode-v2-icon-sprite"
const symbol = (name: IconName) => `opencode-v2-icon-${name}`
let spriteInserted = false

function ensureSprite() {
  if (spriteInserted) return
  if (typeof document === "undefined") return
  if (document.getElementById(spriteID)) {
    spriteInserted = true
    return
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.id = spriteID
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("width", "0")
  svg.setAttribute("height", "0")
  svg.style.position = "absolute"
  svg.style.overflow = "hidden"
  svg.innerHTML = Object.keys(icons)
    .map((name) => {
      const key = name as IconName
      const icon = iconMarkup(key)
      return `<symbol id="${symbol(key)}" viewBox="${icon.viewBox}">${icon.body}</symbol>`
    })
    .join("")
  document.body.insertBefore(svg, document.body.firstChild)
  spriteInserted = true
}

export interface IconProps extends ComponentProps<"svg"> {
  name: IconName | (string & {})
  size?: "small" | "normal" | "large"
}

export function Icon(props: IconProps) {
  const [split, rest] = splitProps(props, ["name", "size"])
  const iconName = () => (icons[split.name as IconName] ? (split.name as IconName) : "plus")
  const icon = () => iconMarkup(iconName())
  const pixelSize = split.size === "small" ? 14 : split.size === "large" ? 20 : 16
  onMount(ensureSprite)

  return (
    <svg
      {...rest}
      data-slot="icon-svg"
      data-icon-family="mingcute"
      width={pixelSize}
      height={pixelSize}
      viewBox={icon().viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={rest["aria-hidden"] ?? "true"}
    >
      <use href={`#${symbol(iconName())}`} />
    </svg>
  )
}
