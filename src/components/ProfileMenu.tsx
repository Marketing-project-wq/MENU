import { useEffect, useRef } from "react";
import { withSsoHandoff } from "../lib/supabase";

/* Profile menu 20FIT — avatar (foto/inisial) di header -> dropdown akun.
 * Link akun mengarah ke my.20fit.id (profile hub) SAMBIL bawa sesi lewat SSO fragment,
 * jadi nggak perlu login ulang. Controlled: parent (Header) yang pegang state open supaya
 * app-switcher & profile nggak bisa kebuka barengan. Tutup via klik-luar / Escape. */

const ICONS: Record<string, string> = {
  user: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>',
  receipt: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21V3Z"/><path d="M9 8h6M9 12h6"/>',
  settings:
    '<path d="M4 7h9M4 12h2M4 17h7"/><path d="M20 7h-3M20 12h-8M20 17h-5"/><circle cx="15.5" cy="7" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="13.5" cy="17" r="2"/>',
  logout: '<path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/>',
};

function LineIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }}
    />
  );
}

// Semua link akun mengarah ke profile hub my.20fit.id (dibawa sesi via SSO).
const ACCOUNT_LINKS = [
  { label: "Profil Saya", desc: "Lihat & edit profil kamu", url: "https://my.20fit.id/profile", icon: "user" },
  { label: "Riwayat Pembelian", desc: "Semua transaksi di 20FIT", url: "https://my.20fit.id/purchases", icon: "receipt" },
  { label: "Pengaturan Akun", desc: "Password, email, keamanan", url: "https://my.20fit.id/settings", icon: "settings" },
];

export function ProfileMenu({
  open,
  onOpenChange,
  user,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onLogout: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

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

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "Akun 20FIT";
  const email = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const initial = (name || email || "?").trim().charAt(0).toUpperCase() || "?";
  const firstName = name.split(" ")[0] || "Akun";

  // Link akun -> my.20fit.id sambil bawa sesi (fragment), lalu pindah halaman.
  const go = (url: string) => {
    onOpenChange(false);
    void withSsoHandoff(url).then((href) => window.location.assign(href));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label="Akun saya"
        aria-haspopup="true"
        aria-expanded={open}
        title={email || "Akun 20FIT"}
        className={
          "flex items-center gap-1.5 rounded-full transition-colors hover:bg-fg/10 sm:border sm:border-fg/15 sm:py-0.5 sm:pl-0.5 sm:pr-2.5 " +
          (open ? "sm:bg-fg/10" : "")
        }
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-red text-sm font-bold text-white">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-9 w-9 object-cover" /> : initial}
        </span>
        <span className="hidden max-w-[7rem] truncate text-xs font-semibold text-fg sm:inline">{firstName}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu akun"
          className="absolute right-0 z-50 mt-2 w-[min(300px,92vw)] rounded-2xl border border-fg/10 bg-card p-3 text-fg shadow-2xl"
        >
          {/* Header akun: avatar + nama + email */}
          <div className="flex items-center gap-3 px-1 pb-2">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-red text-base font-bold text-white">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-11 w-11 object-cover" /> : initial}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-tight">{name}</div>
              {email && <div className="truncate text-xs text-fg/50">{email}</div>}
            </div>
          </div>

          <div className="my-1 border-t border-fg/10" />

          {ACCOUNT_LINKS.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => go(item.url)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-fg/5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fg/5 text-fg/60">
                <LineIcon name={item.icon} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight">{item.label}</span>
                <span className="block truncate text-[11px] text-fg/50">{item.desc}</span>
              </span>
            </button>
          ))}

          <div className="my-1 border-t border-fg/10" />

          <button
            role="menuitem"
            onClick={() => {
              onOpenChange(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
              <LineIcon name="logout" />
            </span>
            <span className="text-[13px]">Keluar</span>
          </button>
        </div>
      )}
    </div>
  );
}
