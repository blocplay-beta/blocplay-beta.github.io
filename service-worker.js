const CACHE_NAME = "blocplay-cache-v2";

// Fichiers essentiels à mettre en cache
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/logo.ico",
  "/icon.png",
  "/offline.html"
];

/* ===================== */
/* INSTALL */
/* ===================== */
self.addEventListener("install", (event) => {
  self.skipWaiting(); // activation directe

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

/* ===================== */
/* ACTIVATE */
/* ===================== */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

/* ===================== */
/* FETCH (le plus important) */
/* ===================== */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // On met en cache une copie des nouvelles ressources
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // Si pas de réseau → fallback cache
        return caches.match(event.request).then((cachedResponse) => {
          // Si la ressource existe dans le cache
          if (cachedResponse) {
            return cachedResponse;
          }

          // Sinon → page offline
          return caches.match("/offline.html");
        });
      })
  );
});

// PATCH DISCORD ACTIVITIES (version complète)
self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // Si la requête passe par Discord Activities
    if (url.origin.includes("discord.com")) {

        // On récupère juste le chemin demandé
        const path = url.pathname.replace(/^\/proxy\/[^/]+/, "");

        const fixedUrl = "https://blocplay-beta.github.io" + path;

        event.respondWith(fetch(fixedUrl));
        return;
    }
});