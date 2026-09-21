/* recipe.20fit.id — service worker DINONAKTIFKAN (situs kembali jadi web biasa, tanpa PWA).
 *
 * File ini sengaja jadi "batu nisan" (kill-switch): tugasnya cuma MEMBUANG dirinya sendiri +
 * membersihkan cache lama. Pengunjung yang dulu sempat ke-register service worker (saat menu
 * masih PWA) akan otomatis LEPAS dari service worker pada kunjungan berikutnya — tidak ada yang
 * "nyangkut" di versi lama. Setelah semua klien lepas, tidak ada SW lagi yang mengontrol situs.
 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Buang semua cache yang dulu dibuat versi PWA.
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        /* abaikan */
      }
      // Lepas registrasi service worker ini.
      try {
        await self.registration.unregister();
      } catch {
        /* abaikan */
      }
      // Muat ulang tab yang terbuka supaya lepas dari kontrol SW (jadi web murni).
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((c) => c.navigate(c.url));
      } catch {
        /* abaikan */
      }
    })()
  );
});

// Jangan intercept apa pun — biarkan semua request jalan normal ke jaringan.
