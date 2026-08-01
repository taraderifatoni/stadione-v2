const CACHE = "stadione-v1"

self.addEventListener("install", (e: any) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        "/",
        "/login",
        "/register",
        "/stadione-logo.svg",
        "/icon-192.png",
        "/icon-512.png",
      ])
    )
  )
})

self.addEventListener("fetch", (e: any) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  )
})
