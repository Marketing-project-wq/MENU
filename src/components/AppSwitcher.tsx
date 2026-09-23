import { useEffect, useRef } from "react";
import { withSsoHandoff } from "../lib/supabase";

/* App-switcher 20FIT — tombol "waffle" (grid 9 titik) di dalam header (bukan bar hitam terpisah).
 * Klik -> mega menu 3 kolom berisi produk 20FIT lain. Halaman aktif ditandai "Kamu di sini".
 * Klik item lain = pindah subdomain (full-page redirect) SAMBIL bawa sesi lewat fragment #
 * (SSO), jadi nggak perlu login ulang. Tutup via klik-luar / Escape. */

interface AppItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  url: string;
  color: string;
}

const APPS: AppItem[] = [
  { id: "home", label: "Home", description: "Direktori Olahraga", icon: "home", url: "https://20fit.id", color: "#111827" },
  { id: "my20fit", label: "My 20FIT", description: "Member Portal", icon: "user", url: "https://my.20fit.id", color: "#6366F1" },
  { id: "recipe", label: "Recipe", description: "Menu & Resep Sehat", icon: "recipe", url: "https://recipe.20fit.id", color: "#16A34A" },
  { id: "calorie", label: "Calorie Tracker", description: "Hitung Kalori Harian", icon: "flame", url: "https://calorietracker.20fit.id", color: "#F97316" },
  { id: "mcu", label: "MCU Scanner", description: "Baca Hasil Medical Check", icon: "pulse", url: "https://medicalscanner.20fit.id", color: "#0EA5E9" },
  { id: "media", label: "Media", description: "Blog & Artikel", icon: "media", url: "https://media.20fit.id", color: "#8B5CF6" },
  { id: "workout", label: "Workout", description: "Streaming Latihan", icon: "workout", url: "https://workout.20fit.id", color: "#EF4444" },
  { id: "photo", label: "Photo", description: "Foto Event", icon: "camera", url: "https://photo.20fit.id", color: "#EC4899" },
  { id: "ticket", label: "Ticket", description: "Tiket & Booking", icon: "ticket", url: "https://ticket.20fit.id", color: "#14B8A6" },
  { id: "talent", label: "Talent", description: "Talent & Event Organizer", icon: "users", url: "https://talent.20fit.id", color: "#3B82F6" },
];

const HOST_MAP: Record<string, string> = {
  "20fit.id": "home", "www.20fit.id": "home",
  "my.20fit.id": "my20fit",
  "recipe.20fit.id": "recipe", "recepie.20fit.id": "recipe",
  "calorietracker.20fit.id": "calorie",
  "medicalscanner.20fit.id": "mcu",
  "media.20fit.id": "media",
  "workout.20fit.id": "workout",
  "photo.20fit.id": "photo",
  "ticket.20fit.id": "ticket",
  "talent.20fit.id": "talent",
};

// Ikon produk = artwork 3D 20FIT ASLI. Sumbernya SVG raster besar (base64 PNG 2048px,
// ~1–2.7MB) yang di-upload ke repo; di-generate jadi PNG kecil 128px di public/icons/<id>.png
// lewat `node scripts/build-icons.mjs` (nama file output = app.id). Dipakai via <img> supaya
// ringan (10 ikon ~107KB total, bukan ~15MB kalau SVG raster-nya dipakai langsung).

// Kelompokkan seperti switcher my.20fit.id (Semua Produk / Kesehatan / Aktivitas / Acara).
// Pakai HANYA produk yang sudah ada di sini (URL pasti) — tanpa item my.20fit.id-internal
// (Body Scan/Progress/Book*) yang URL-nya belum jelas.
const APPS_BY_ID: Record<string, AppItem> = Object.fromEntries(APPS.map((a) => [a.id, a]));
const SECTIONS: { title: string; ids: string[] }[] = [
  { title: "", ids: ["home", "my20fit", "recipe"] },
  { title: "Kesehatan", ids: ["calorie", "mcu"] },
  { title: "Aktivitas", ids: ["workout", "media"] },
  { title: "Acara", ids: ["photo", "ticket", "talent"] },
];

export function AppSwitcher({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const current = typeof window !== "undefined" ? HOST_MAP[window.location.hostname] || null : null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label="Aplikasi 20FIT lainnya"
        aria-haspopup="true"
        aria-expanded={open}
        title="Aplikasi 20FIT"
        className={
          "grid h-8 w-8 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 " +
          (open ? "bg-white/15" : "")
        }
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="6" cy="6" r="1.6" /><circle cx="12" cy="6" r="1.6" /><circle cx="18" cy="6" r="1.6" />
          <circle cx="6" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18" cy="12" r="1.6" />
          <circle cx="6" cy="18" r="1.6" /><circle cx="12" cy="18" r="1.6" /><circle cx="18" cy="18" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Aplikasi 20FIT"
          className="absolute right-0 z-50 mt-2 max-h-[80vh] w-[min(440px,92vw)] overflow-y-auto rounded-2xl border border-black/10 bg-white p-3 text-neutral-900 shadow-2xl"
        >
          {SECTIONS.map((sec) => (
            <div key={sec.title || "all"} className="mb-2 last:mb-0">
              <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                {sec.title || "Semua Produk 20FIT"}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {sec.ids.map((id) => {
                  const app = APPS_BY_ID[id];
                  if (!app) return null;
                  const active = app.id === current;
                  return (
                    <a
                      key={app.id}
                      href={active ? undefined : app.url}
                      role="menuitem"
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => {
                        // Biarkan buka-tab-baru (Cmd/Ctrl/Shift/klik-tengah) jalan normal via href.
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        e.preventDefault();
                        onOpenChange(false);
                        if (active) return; // sudah di halaman ini
                        // Bawa sesi (kalau ada) ke produk 20FIT lain lewat fragment, lalu pindah.
                        void withSsoHandoff(app.url).then((href) => window.location.assign(href));
                      }}
                      className={
                        "flex flex-col items-center gap-1 rounded-xl border-2 px-1.5 py-2.5 text-center transition-colors " +
                        (active
                          ? "cursor-default border-neutral-900 bg-neutral-100"
                          : "border-transparent hover:bg-neutral-100")
                      }
                    >
                      <img
                        src={`/icons/${app.id}.png`}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="h-14 w-14 object-contain"
                      />
                      <span className="text-xs font-bold leading-tight">{app.label}</span>
                      <span className="text-[10px] leading-tight text-neutral-500">{app.description}</span>
                      {active && <span className="text-[9px] font-bold text-green-600">● Kamu di sini</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
