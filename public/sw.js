const CACHE_NAME = "quizmaster-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg"
];

// Install event - Cache core static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching app shell assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Serve from cache, fallback to network, with dynamic caching
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Exclude non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Exclude API requests, Vite dev websocket, Firebase/Firestore services
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/@vite/") ||
    url.pathname.startsWith("/node_modules/") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached resource immediately, and asynchronously refresh the cache in background (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background network update failures
          });
        return cachedResponse;
      }

      // Cache miss - Fetch from network and dynamically cache static resources
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (event.request.destination === "document" ||
              event.request.destination === "script" ||
              event.request.destination === "style" ||
              event.request.destination === "image" ||
              event.request.destination === "font")
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for main navigation
          if (event.request.destination === "document") {
            return caches.match("/");
          }
        });
    })
  );
});
