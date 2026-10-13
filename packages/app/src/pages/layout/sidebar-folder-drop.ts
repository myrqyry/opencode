/** Validate all paths before mutating the project list. Never initialize Git on drop. */
export async function inspectDroppedProjects<T>(
  directories: readonly string[],
  handlers: {
    isOpen: (directory: string) => boolean
    fileCount: (directory: string) => Promise<number>
    project: (directory: string) => Promise<T>
  },
) {
  return Promise.all(
    directories.map(async (directory) => {
      if (handlers.isOpen(directory)) return { directory, existing: true as const }
      if ((await handlers.fileCount(directory)) === 0) return { directory, empty: true as const }
      return { directory, project: await handlers.project(directory) }
    }),
  )
}

/** Only folders from a native desktop drag can be opened as projects. */
export function folderDragItems(items: DataTransferItemList | readonly DataTransferItem[]) {
  return Array.from(items).filter((item) => item.kind === "file" && item.webkitGetAsEntry()?.isDirectory)
}

export function droppedFolderPaths(
  items: DataTransferItemList | readonly DataTransferItem[],
  getPathForFile: (file: File) => string,
) {
  return [
    ...new Set(
      folderDragItems(items).flatMap((item) => {
        const file = item.getAsFile()
        if (!file) return []
        const path = getPathForFile(file)
        return path ? [path] : []
      }),
    ),
  ]
}
