import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// recipe.20fit.id = WEB BIASA (bukan PWA). Tidak ada service worker yang didaftarkan.
// Kalau pengunjung dulu sempat ke-register SW (saat menu masih PWA), lepas registrasinya
// di sini supaya benar-benar jadi web murni — tidak ada yang "nyangkut" di versi lama.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {
      /* abaikan — situs tetap jalan normal. */
    });
}
