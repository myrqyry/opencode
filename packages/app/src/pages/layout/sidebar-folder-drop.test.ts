import { describe, expect, test } from "bun:test"
import { droppedFolderPaths, folderDragItems, inspectDroppedProjects } from "./sidebar-folder-drop"

function item(path: string, directory: boolean): DataTransferItem {
  return {
    kind: "file",
    webkitGetAsEntry: () => ({ isDirectory: directory }),
    getAsFile: () => ({ name: path }),
  } as unknown as DataTransferItem
}

describe("sidebar folder dropping", () => {
  test("does not advertise ordinary files as project folders", () => {
    const files = [item("/tmp/file.txt", false)]
    expect(folderDragItems(files)).toEqual([])
    expect(droppedFolderPaths(files, (file) => file.name)).toEqual([])
  })

  test("accepts only directory entries and deduplicates their paths", () => {
    const items = [
      item("/tmp/one", true),
      item("/tmp/file.txt", false),
      item("/tmp/one", true),
      item("/tmp/two", true),
    ]
    expect(folderDragItems(items)).toHaveLength(3)
    expect(droppedFolderPaths(items, (file) => file.name)).toEqual(["/tmp/one", "/tmp/two"])
  })

  test("rejects entries without native paths or files", () => {
    const missingFile = { kind: "file", webkitGetAsEntry: () => ({ isDirectory: true }), getAsFile: () => null }
    const directory = item("missing", true)
    expect(droppedFolderPaths([missingFile, directory] as DataTransferItem[], () => "")).toEqual([])
  })

  test("empty directories never trigger project resolution", async () => {
    const lookedUp: string[] = []
    const result = await inspectDroppedProjects(["/empty", "/existing", "/project"], {
      isOpen: (path) => path === "/existing",
      fileCount: async (path) => (path === "/empty" ? 0 : 3),
      project: async (path) => {
        lookedUp.push(path)
        return { id: "project-1" }
      },
    })

    expect(result.some((entry) => "empty" in entry)).toBe(true)
    expect(lookedUp).toEqual(["/project"])
    expect(result.find((entry) => entry.directory === "/existing")).toMatchObject({ existing: true })
  })

  test("inspection failures reject the entire drop before changes are applied", async () => {
    await expect(
      inspectDroppedProjects(["/good", "/broken"], {
        isOpen: () => false,
        fileCount: async (path) => {
          if (path === "/broken") throw new Error("unreadable folder")
          return 1
        },
        project: async () => ({ id: "a" }),
      }),
    ).rejects.toThrow("unreadable folder")
  })
})
