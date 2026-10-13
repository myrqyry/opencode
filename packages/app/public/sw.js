const SHELL_CACHE = "opencode-pwa-shell-v2"
const ASSET_CACHE = "opencode-pwa-assets-v2"
const PRECACHED_PATHS = [
  "/site.webmanifest",
  "/meristem-manifest-192x192.png",
  "/meristem-manifest-512x512.png",
  "/meristem-apple-touch-icon.png",
]

// Cache and offline-fallback only actual SPA pages, not JSON endpoints.
function isAppRoute(pathname) {
  if (pathname === "/" || pathname === "/new-session") return true
  return /^\/(?:server\/[^/]+\/session\/[^/]+|workspace\/[^/]+\/[^/]+\/[^/]+|[^/]+\/session(?:\/[^/]+)?)\/?$/.test(pathname)
}

function isHTML(response) {
  return response.ok && response.headers.get("content-type")?.toLowerCase().includes("text/html")
}

function appAssets(html) {
  return Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g), (match) => match[1])
}

function isAppShell(html) {
  return html.includes('id="root"') && appAssets(html).length > 0
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch("/", { cache: "reload" }).catch(() => undefined)
      if (!response || !isHTML(response)) return

      const html = await response.clone().text()
      if (!isAppShell(html)) return
      const shell = await caches.open(SHELL_CACHE)
      await shell.put("/", response)

      const assets = await caches.open(ASSET_CACHE)
      await Promise.all(
        [...new Set([...appAssets(html), ...PRECACHED_PATHS])].map(async (path) => {
          const resource = await fetch(path).catch(() => undefined)
          if (resource?.ok) await assets.put(path, resource)
        }),
      )
    })(),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE)
      const html = await shell.match("/").then((response) => response?.text() ?? "")
      const keep = new Set([...appAssets(html), ...PRECACHED_PATHS])
      const assets = await caches.open(ASSET_CACHE)
      const requests = await assets.keys()
      await Promise.all(
        requests
          .filter((request) => !keep.has(new URL(request.url).pathname))
          .map((request) => assets.delete(request)),
      )

      const cachesToDelete = (await caches.keys()).filter(
        (name) => name.startsWith("opencode-pwa-") && name !== SHELL_CACHE && name !== ASSET_CACHE,
      )
      await Promise.all(cachesToDelete.map((name) => caches.delete(name)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    if (!isAppRoute(url.pathname)) return
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          // Only the verified root document may replace the offline shell.
          if (url.pathname === "/" && isHTML(response) && isAppShell(await response.clone().text())) {
            const shell = await caches.open(SHELL_CACHE)
            await shell.put("/", response.clone())
          }
          return response
        })
        .catch(async () => {
          const shell = await caches.open(SHELL_CACHE)
          const cached = await shell.match("/")
          return cached && isHTML(cached) ? cached : Response.error()
        }),
    )
    return
  }

  if (!url.pathname.startsWith("/assets/") && !PRECACHED_PATHS.includes(url.pathname)) return

  event.respondWith(
    caches.open(ASSET_CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached
      return fetch(request)
    }),
  )
})
