/* ============================================================
   CONFIGURATION
   ============================================================ */
const CACHE_NAME = "blocplay-cache-v2";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/logo.ico",
  "/icon.png",
  "/offline.html"
];


/* ============================================================
   INSTALLATION DU SERVICE WORKER
   ============================================================ */
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Activation immédiate

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});


/* ============================================================
   ACTIVATION + NETTOYAGE DES ANCIENS CACHES
   ============================================================ */
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

  self.clients.claim(); // Contrôle immédiat des pages
});


/* ============================================================
   FETCH UNIQUE (PATCH DISCORD + CACHE + OFFLINE)
   ============================================================ */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  /* ------------------------------------------------------------
     1) PATCH DISCORD ACTIVITIES
     ------------------------------------------------------------ */
  if (url.origin.includes("discord.com")) {

    // Discord ajoute /proxy/ID → on le supprime
    const path = url.pathname.replace(/^\/proxy\/[^/]+/, "");

    // On reconstruit l'URL correcte vers GitHub Pages
    const fixedUrl = "https://blocplay-beta.github.io" + path;

    event.respondWith(fetch(fixedUrl));
    return;
  }


  /* ------------------------------------------------------------
     2) COMPORTEMENT NORMAL (réseau → cache)
     ------------------------------------------------------------ */
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // On met en cache une copie de la ressource
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });

        return response;
      })

      /* --------------------------------------------------------
         3) MODE OFFLINE (fallback intelligent)
         -------------------------------------------------------- */
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          // Si la ressource existe dans le cache → on la renvoie
          if (cached) return cached;

          // Sinon → page offline (ton système de redirection)
          return caches.match("/offline.html");
        });
      })
  );
});