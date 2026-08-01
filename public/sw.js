const CACHE = "stadione-v2"

self.addEventListener("install", (e: any) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/", "/login", "/stadione-logo.svg", "/icon-192.png", "/manifest.json"])))
})

self.addEventListener("fetch", (e: any) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)))
})

self.addEventListener("sync", (e: any) => {
  if (e.tag === "stadione-sync") {
    e.waitUntil(syncOfflineData())
  }
})

async function syncOfflineData() {
  try {
    const clients = await (self as any).clients.matchAll()
    clients.forEach((client: any) => client.postMessage({ type: "SYNC_OFFLINE" }))
  } catch {}
}
