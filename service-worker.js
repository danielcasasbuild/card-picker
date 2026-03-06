const cacheName = 'card-picker-v3'
const base = self.location.pathname.replace(/\/[^/]*$/, '/')
const assets = [
  base,
  base + 'index.html',
  base + 'style.css',
  base + 'app.js',
  base + 'cards.json',
  base + 'manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== cacheName).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      const fetchPromise = fetch(event.request)
        .then(networkRes => {
          if (
            networkRes &&
            networkRes.status === 200 &&
            event.request.method === 'GET'
          ) {
            caches.open(cacheName).then(cache =>
              cache.put(event.request, networkRes.clone())
            )
          }

          return networkRes
        })
        .catch(() => res)

      return res || fetchPromise
    })
  )
})
