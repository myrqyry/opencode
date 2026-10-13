import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import vm from "node:vm"

const origin = "http://127.0.0.1:4196"
const page = '<!doctype html><html><script src="/assets/app.js"></script><div id="root"></div></html>'
const html = () => new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } })
const json = () => Response.json({ models: [] })

async function harness(initial = html()) {
  const listeners = new Map<string, (event: any) => void>()
  const entries = new Map<string, Map<string, Response>>()
  let offline = false
  let root = initial
  let other = json()
  const key = (request: string | { url: string }) =>
    new URL(typeof request === "string" ? request : request.url, origin).pathname
  const caches = {
    open: async (name: string) => {
      if (!entries.has(name)) entries.set(name, new Map())
      const stored = entries.get(name)!
      return {
        put: async (url: string, response: Response) => { stored.set(key(url), response.clone()) },
        match: async (url: string) => stored.get(key(url))?.clone(),
        keys: async () => [...stored.keys()].map((path) => ({ url: origin + path })),
        delete: async (url: { url: string }) => stored.delete(key(url)),
      }
    },
    keys: async () => [...entries.keys()],
    delete: async (name: string) => entries.delete(name),
  }
  const source = await readFile(new URL("../../public/sw.js", import.meta.url), "utf8")
  vm.runInNewContext(source, {
    URL,
    Response,
    caches,
    self: {
      location: { origin },
      clients: { claim: async () => {} },
      addEventListener: (type: string, fn: (event: any) => void) => listeners.set(type, fn),
    },
    fetch: async (request: string | { url: string }) => {
      if (offline) throw new Error("offline")
      return key(request) === "/" ? root.clone() : other.clone()
    },
  })

  async function install() {
    let pending: Promise<unknown> | undefined
    listeners.get("install")!({ waitUntil: (value: Promise<unknown>) => { pending = value } })
    await pending
  }
  function navigate(path: string) {
    let pending: Promise<Response> | undefined
    listeners.get("fetch")!({
      request: { url: origin + path, method: "GET", mode: "navigate" },
      respondWith: (value: Promise<Response>) => { pending = value },
    })
    return pending
  }
  return {
    install,
    navigate,
    cache: () => caches.open("opencode-pwa-shell-v2"),
    setRoot: (value: Response) => { root = value },
    offline: () => { offline = true },
  }
}

test("JSON API navigation never replaces the cached HTML shell", async () => {
  const sw = await harness()
  await sw.install()
  expect(sw.navigate("/provider")).toBeUndefined()
  expect(await (await (await sw.cache()).match("/"))!.text()).toBe(page)
})

test("JSON root response does not replace an existing shell", async () => {
  const sw = await harness()
  await sw.install()
  sw.setRoot(json())
  expect((await sw.navigate("/"))!.headers.get("content-type")).toContain("application/json")
  expect(await (await (await sw.cache()).match("/"))!.text()).toBe(page)
})

test("offline app route falls back to cached HTML; API endpoint never does", async () => {
  const sw = await harness()
  await sw.install()
  sw.offline()
  expect(await (await sw.navigate("/workspace/server/project/models"))!.text()).toBe(page)
  expect(sw.navigate("/provider")).toBeUndefined()
})

test("an unrelated HTML document is not cached as the app shell", async () => {
  const login = new Response("<html><body>Sign in</body></html>", {
    headers: { "content-type": "text/html" },
  })
  const sw = await harness(login)
  await sw.install()
  expect(await (await sw.cache()).match("/")).toBeUndefined()
})

test("a non-app HTML root response cannot overwrite the cached app shell", async () => {
  const sw = await harness()
  await sw.install()
  sw.setRoot(new Response("<html><body>Maintenance</body></html>", {
    headers: { "content-type": "text/html" },
  }))
  await sw.navigate("/")
  expect(await (await (await sw.cache()).match("/"))!.text()).toBe(page)
})

test("a JSON install response is not cached as HTML", async () => {
  const sw = await harness(json())
  await sw.install()
  expect(await (await sw.cache()).match("/")).toBeUndefined()
})
