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

// Line-icon konsisten (satu gaya), diwarnai per app.
const ICON_PATHS: Record<string, string> = {
  home: '<path d="M3 10.6 12 4l9 6.6"/><path d="M5.5 9.4V20h13V9.4"/><path d="M10 20v-5h4v5"/>',
  user: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>',
  recipe: '<path d="M6 3v6a2 2 0 0 0 4 0V3"/><path d="M8 11v10"/><path d="M16.5 3c-1.6 1.2-2.6 3.3-2.6 6 0 2 1.2 2.9 2.6 2.9V21"/>',
  flame: '<path d="M12 3c.8 3 4 4.4 4 8a4 4 0 1 1-8 0c0-1.6.7-2.7 1.5-3.5C10 8 10.7 6 12 3Z"/>',
  pulse: '<path d="M3.5 13.5h3l1.6-4.5 3 9 2.2-6 1.3 2.3H21"/><path d="M20.5 9.2A3.7 3.7 0 0 0 14 6.8 3.7 3.7 0 0 0 7.5 8.4"/>',
  media: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 9h7M7 12h7M7 15h4.5"/><rect x="15.5" y="12" width="2.6" height="3.2" rx="0.5"/>',
  workout: '<path d="M6.5 8v8M4 9.5v5M17.5 8v8M20 9.5v5"/><path d="M6.5 12h11"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.2 7l1.4-2.4h4.8L15.8 7"/><circle cx="12" cy="13.6" r="3.2"/>',
  ticket: '<path d="M4 9V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a2 2 0 0 0 0 4v1.5A1.5 1.5 0 0 1 18.5 16h-13A1.5 1.5 0 0 1 4 14.5V13a2 2 0 0 0 0-4Z"/>',
  users: '<circle cx="9.2" cy="8" r="3"/><path d="M3.4 20c0-3.1 2.7-5 5.8-5s5.8 1.9 5.8 5"/><path d="M16.5 5.4a3 3 0 0 1 0 5.5"/><path d="M17.8 15.2c2 .6 3.4 2.1 3.4 4.4"/>',
};

function AppIcon({ name, color }: { name: string; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || "" }}
    />
  );
}

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
          className="absolute right-0 z-50 mt-2 w-[min(430px,90vw)] rounded-2xl border border-black/10 bg-white p-3 text-neutral-900 shadow-2xl"
        >
          <div className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            Aplikasi 20FIT
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {APPS.map((app) => {
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
                    "flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 text-center transition-colors " +
                    (active
                      ? "cursor-default border-neutral-900 bg-neutral-100"
                      : "border-transparent hover:bg-neutral-100")
                  }
                >
                  <span className="mb-0.5 flex h-8 w-8 items-center justify-center">
                    <AppIcon name={app.icon} color={app.color} />
                  </span>
                  <span className="text-xs font-bold leading-tight">{app.label}</span>
                  <span className="text-[10px] leading-tight text-neutral-500">{app.description}</span>
                  {active && <span className="mt-0.5 text-[9px] font-bold text-green-600">● Kamu di sini</span>}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
