import { useEffect, useState, type SyntheticEvent } from "react";
import { useLang } from "../lib/store";

type PromptMode = "none" | "android" | "ios";

/* Ajakan pasang PWA — HALUS & bisa ditutup. Warna brand: kartu HITAM (#141414),
 * teks putih, aksen MERAH. Muncul cuma kalau relevan:
 *  - Android/Chrome/Edge: pakai event `beforeinstallprompt` -> tombol "Pasang" beneran.
 *  - iOS Safari: event itu tak pernah ada, jadi tampilkan PETUNJUK manual (Share -> Add to
 *    Home Screen). Jujur: di iOS tak bisa auto-install, cuma bisa kasih arahan.
 *  - Disembunyikan kalau app sudah ke-install (standalone) atau baru saja ditutup user.
 * Komponen ini "kulit" — tidak menyentuh login/SSO/data resep.
 */

// `beforeinstallprompt` belum ada di lib DOM bawaan TS -> tipe minimal seperlunya.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SNOOZE_KEY = "pwa_install_dismissed_at";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // jangan nagih: setelah ditutup, diam 14 hari.

function snoozed(): boolean {
  try {
    const at = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    return at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
  } catch {
    /* localStorage bisa diblok (private mode) — abaikan, cukup sembunyikan utk sesi ini. */
  }
}

function isStandalone(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari pakai flag non-standar ini saat app dibuka dari home screen.
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const { lang } = useLang();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<PromptMode>("none");

  useEffect(() => {
    if (isStandalone() || snoozed()) return;

    const onBIP = (e: Event) => {
      e.preventDefault(); // cegah mini-infobar bawaan Chrome; kita tampilkan sendiri.
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => {
      setMode("none");
      setDeferred(null);
      snooze();
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari: tak ada beforeinstallprompt -> kasih petunjuk manual (dgn jeda kecil).
    const ua = navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
    const timer =
      isIOS && isSafari
        ? window.setTimeout(() => setMode((m: PromptMode) => (m === "none" ? "ios" : m)), 2500)
        : undefined;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  if (mode === "none") return null;

  const id = lang === "id";

  const dismiss = () => {
    setMode("none");
    snooze();
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* user batal / error — tak apa. */
    }
    setDeferred(null);
    setMode("none");
    snooze();
  };

  const title = id ? "Pasang 20FIT Resep" : "Install 20FIT Resep";
  const body =
    mode === "android"
      ? id
        ? "Buka dari home screen, full-screen — cepat & terasa seperti app."
        : "Launch from your home screen, full-screen — fast, app-like."
      : id
        ? "Ketuk tombol Bagikan di Safari, lalu pilih “Tambahkan ke Layar Utama”."
        : "Tap the Share button in Safari, then “Add to Home Screen”.";

  return (
    <div
      aria-label={title}
      className="no-print fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-white/10 bg-brand-dark p-4 text-white shadow-2xl sm:inset-x-0"
    >
      <div className="flex items-start gap-3">
        <img
          src="/icons/icon-192.png"
          alt=""
          className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1"
          onError={(e: SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">{title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs leading-snug text-white/70">
            {mode === "ios" && (
              // Ikon Share iOS supaya user langsung ngeh tombol mana yang dimaksud.
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-brand-red"
                aria-hidden="true"
              >
                <path d="M12 16V4M8 8l4-4 4 4" />
                <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
              </svg>
            )}
            <span>{body}</span>
          </p>

          {mode === "android" && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={install}
                className="rounded-lg bg-brand-red px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-red/90"
              >
                {id ? "Pasang" : "Install"}
              </button>
              <button
                onClick={dismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white"
              >
                {id ? "Nanti" : "Later"}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label={id ? "Tutup" : "Dismiss"}
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 text-white/50 transition-colors hover:text-white"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
