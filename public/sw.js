/* 20FIT Resep — Service Worker.
 *
 * ATURAN CACHE (penting supaya update SELALU kebaca, tidak nyangkut versi lama):
 *  - Navigasi (HTML app-shell): NETWORK-FIRST. Selalu ambil index.html terbaru dari server
 *    (yang menunjuk ke bundle JS/CSS ber-hash terbaru). Cache cuma dipakai kalau OFFLINE.
 *    -> deploy baru langsung kebaca user pada navigasi/refresh berikutnya.
 *  - Aset ber-hash Vite (/assets/xxxx.js): CACHE-FIRST. Aman karena nama file berubah tiap
 *    build; versi baru = nama baru, jadi tak pernah menyajikan yang basi.
 *  - Selain itu (API Supabase/my.20fit, media.20fit, /icons, /version.json, dll): TIDAK
 *    di-intercept -> selalu network (data dinamis & login tidak terganggu).
 *  - skipWaiting + clients.claim + purge cache versi lama saat activate.
 *
 * Cross-origin (Supabase, my.20fit.id API, media.20fit.id) sengaja DILEWATKAN -> tidak
 * mengganggu login/SSO/data.
 */
const VERSION = "v1";
const SHELL_CACHE = `20fit-shell-${VERSION}`;
const ASSET_CACHE = `20fit-assets-${VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Hanya same-origin. Biarkan cross-origin (Supabase/API/media) jalan normal.
  if (url.origin !== self.location.origin) return;

  // Navigasi HTML -> network-first (selalu versi terbaru), fallback cache saat offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(SHELL_CACHE);
          cache.put("/index.html", fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const cached = await cache.match("/index.html");
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Aset ber-hash Vite -> cache-first (aman, nama file berubah tiap versi).
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })()
    );
    return;
  }

  // Sisanya: default (network) — tidak di-cache oleh SW.
});
