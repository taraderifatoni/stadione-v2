const CACHE = "stadione-v2"

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/", "/login", "/stadione-logo.svg", "/icon-192.png", "/manifest.json"])))
})

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)))
})

self.addEventListener("sync", (e) => {
  if (e.tag === "stadione-sync") {
    e.waitUntil(syncOfflineData())
  }
})

async function syncOfflineData() {
  try {
    const clients = await self.clients.matchAll()
    clients.forEach((client) => client.postMessage({ type: "SYNC_OFFLINE" }))
  } catch {}
}
