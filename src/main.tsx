import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA service worker — hanya di build produksi (di `vite` dev sengaja TIDAK didaftarkan
// supaya tak ada cache yang bikin bingung saat ngoding). SW-nya network-first utk HTML,
// jadi deploy baru selalu kebaca; ini cuma "kulit" app, tidak menyentuh login/SSO/data.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Cek versi baru saat tab kembali fokus — penting karena resep sering diupdate:
        // tab yang dibiarkan terbuka lama pun ikut narik versi terbaru.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update();
        });
      })
      .catch(() => {
        /* registrasi gagal — situs tetap jalan normal tanpa PWA. */
      });
  });
}
