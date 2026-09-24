import { useEffect, useRef } from "react";
import { withSsoHandoff } from "../lib/supabase";

/* App-switcher 20FIT — tombol "waffle" (grid 9 titik) di dalam header (bukan bar hitam terpisah).
 * Klik -> menu produk 20FIT lain, dikelompokkan seperti switcher my.20fit.id
 * (Semua Produk / Kesehatan / Aktivitas / Acara / Booking). Halaman aktif ditandai "Kamu di sini".
 * Klik item lain = pindah subdomain/halaman (full-page redirect) SAMBIL bawa sesi lewat fragment #
 * (SSO), jadi nggak perlu login ulang. Tutup via klik-luar / Escape. */

interface AppItem {
  id: string;
  label: string;
  description: string;
  url: string;
}

// Ikon produk = artwork 3D 20FIT ASLI (merah), latar TRANSPARAN. Sumbernya "*.svg" di root repo
// (tiap file membungkus 2 PNG: mask luminance + lapisan warna). Di-generate jadi PNG kecil 128px
// transparan di public/icons/<id>.png lewat `node scripts/build-icons.mjs` (nama file = app.id).
// "bodyscan" digambar (glyph scan-frame) karena tak ada artwork 3D-nya. Dipakai via <img>.

// Cache-buster: file di public/ TIDAK di-hash Vite, jadi URL-nya tetap sama tiap deploy dan
// browser bisa menyajikan versi LAMA dari cache (mis. ikon versi latar-hitam yang sudah diganti).
// NAIKKAN angka ini tiap kali isi ikon berubah supaya semua browser ambil versi baru (bukan cache).
const ICON_VER = "2";
const APPS: AppItem[] = [
  { id: "home", label: "Home", description: "Direktori Olahraga", url: "https://20fit.id" },
  { id: "my20fit", label: "My 20FIT", description: "Member Portal", url: "https://my.20fit.id" },
  { id: "recipe", label: "Recipe", description: "Menu & Resep Sehat", url: "https://recipe.20fit.id" },
  { id: "calorie", label: "Calorie Tracker", description: "Hitung Kalori Harian", url: "https://calorietracker.20fit.id" },
  { id: "mcu", label: "MCU Scanner", description: "Baca Hasil Medical Check", url: "https://medicalscanner.20fit.id" },
  { id: "bodyscan", label: "Body Scan", description: "Analisa Komposisi Tubuh", url: "https://my.20fit.id/dashboard.html" },
  { id: "workout", label: "Workout", description: "Streaming Latihan", url: "https://workout.20fit.id" },
  { id: "progress", label: "Progress", description: "Progres & Statistik", url: "https://my.20fit.id/progress.html" },
  { id: "media", label: "Media", description: "Blog & Artikel", url: "https://media.20fit.id" },
  { id: "photo", label: "Photo", description: "Foto Event", url: "https://photo.20fit.id" },
  { id: "ticket", label: "Ticket", description: "Tiket & Booking", url: "https://ticket.20fit.id" },
  { id: "talent", label: "Talent", description: "Talent & Event Organizer", url: "https://talent.20fit.id" },
  { id: "book-class", label: "Book Class", description: "Arena · Gym", url: "https://my.20fit.id/classes.html" },
  { id: "book-coach", label: "Book Coach", description: "Arena · Gym", url: "https://my.20fit.id/book-coach.html" },
  { id: "book-doctor", label: "Book Doctor", description: "Konsultasi · Klinik", url: "https://my.20fit.id/book-doctor.html" },
  { id: "book-recovery", label: "Book Recovery", description: "Fisio · Massage", url: "https://my.20fit.id/classes.html?venue=clinic" },
];

const HOST_MAP: Record<string, string> = {
  "20fit.id": "home", "www.20fit.id": "home",
  "my.20fit.id": "my20fit",
  "recipe.20fit.id": "recipe", "recepie.20fit.id": "recipe",
  "calorietracker.20fit.id": "calorie",
  "medicalscanner.20fit.id": "mcu",
  "workout.20fit.id": "workout",
  "media.20fit.id": "media",
  "photo.20fit.id": "photo",
  "ticket.20fit.id": "ticket",
  "talent.20fit.id": "talent",
};

// Kelompokkan seperti switcher my.20fit.id. Item Booking + Body Scan + Progress mengarah ke
// halaman di dalam my.20fit.id (tetap SSO). Judul "" = seksi pertama "Semua Produk".
const APPS_BY_ID: Record<string, AppItem> = Object.fromEntries(APPS.map((a) => [a.id, a]));
const SECTIONS: { title: string; ids: string[] }[] = [
  { title: "", ids: ["home", "my20fit", "recipe"] },
  { title: "Kesehatan", ids: ["calorie", "mcu", "bodyscan"] },
  { title: "Aktivitas", ids: ["workout", "progress", "media"] },
  { title: "Acara", ids: ["photo", "ticket", "talent"] },
  { title: "Booking", ids: ["book-class", "book-coach", "book-doctor", "book-recovery"] },
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
          "grid h-8 w-8 place-items-center rounded-full border border-fg/15 text-fg transition-colors hover:bg-fg/10 " +
          (open ? "bg-fg/10" : "")
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
          className="absolute right-0 z-50 mt-2 max-h-[80vh] w-[min(440px,92vw)] overflow-y-auto rounded-2xl border border-fg/10 bg-card p-3 text-fg shadow-2xl"
        >
          {SECTIONS.map((sec) => (
            <div key={sec.title || "all"} className="mb-2 last:mb-0">
              <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-fg/40">
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
                          ? "cursor-default border-fg/70 bg-fg/5"
                          : "border-transparent hover:bg-fg/5")
                      }
                    >
                      <img
                        src={`/icons/${app.id}.png?v=${ICON_VER}`}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="h-14 w-14 object-contain"
                      />
                      <span className="text-xs font-bold leading-tight">{app.label}</span>
                      <span className="text-[10px] leading-tight text-fg/50">{app.description}</span>
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
