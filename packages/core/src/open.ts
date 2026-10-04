import { spawn } from "node:child_process"
import open from "open"

export type OpenUrlOptions = {
  env?: NodeJS.ProcessEnv
}

export async function openUrl(input: string, options?: OpenUrlOptions) {
  const url = URL.canParse(input) ? new URL(input) : undefined
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:"))
    throw new Error(`Only http and https links can be opened in the browser: ${input}`)

  if (process.platform === "linux" && options?.env) {
    const child = spawn("xdg-open", [url.href], {
      env: options.env,
      stdio: "ignore",
      detached: true,
    })
    child.unref()
    return child
  }

  return open(url.href)
}
