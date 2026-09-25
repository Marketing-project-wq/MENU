import { useEffect, useState } from "react";
import { Link, useRouter } from "../router";
import { useAuth } from "../lib/auth";
import { useLang, useTheme } from "../lib/store";
import { Icon } from "./Icon";
import { AppSwitcher } from "./AppSwitcher";
import { ProfileMenu } from "./ProfileMenu";
import { LOGO_DARK, LOGO_LIGHT } from "../lib/constants";

/**
 * Header MINIMALIST & NETRAL, satu garis, MENYATU dgn address bar browser (seamless).
 * Latar solid = --bg (lihat .glass-header), bukan merah/kaca. Bukan wrap ke baris kedua.
 *
 * KIRI  = logo + TAB halaman (underline merah = tab aktif, sisanya muted).
 * KANAN = [waffle produk] [tema] [bahasa ID|EN] [profil+nama].
 * MOBILE (satu baris) = logo + [More ⋮] [waffle produk] [bahasa ID|EN] [profil]. Tab + tema
 * ada di dropdown "More" (⋮); BAHASA selalu tampil di header (bukan di dropdown). brand-red
 * HANYA aksen (tab aktif, Daftar).
 */
export function Header() {
  const { t, lang, setLang } = useLang();
  const { theme, toggle } = useTheme();
  const { isAuthenticated, user, login, logout } = useAuth();
  const { path } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  // Satu popover header aktif dalam satu waktu: app-switcher / profil / more (mobile).
  const [menu, setMenu] = useState<"apps" | "profile" | "more" | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tutup dropdown "More" (mobile) via Escape -- klik-luar ditangani backdrop di bawah.
  useEffect(() => {
    if (menu !== "more") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  // Tab desktop: teks UPPERCASE + garis-bawah merah kalau aktif; sisanya muted.
  const desktopTab = (to: string, label: string) => (
    <Link
      to={to}
      className={
        "shrink-0 whitespace-nowrap border-b-2 px-1.5 pb-1 pt-0.5 text-[11px] font-bold uppercase tracking-wide transition-colors " +
        (isActive(to) ? "border-brand-red text-brand-red" : "border-transparent text-fg/50 hover:text-fg")
      }
    >
      {label}
    </Link>
  );

  // Tab di dropdown "More" (mobile): baris penuh, aktif = merah + latar merah tipis.
  const moreTab = (to: string, label: string) => (
    <Link
      to={to}
      onClick={() => setMenu(null)}
      className={
        "block rounded-lg px-3 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors " +
        (isActive(to) ? "bg-brand-red/10 text-brand-red" : "text-fg/70 hover:bg-fg/10")
      }
    >
      {label}
    </Link>
  );

  const utilBtn =
    "grid h-8 w-8 place-items-center rounded-full border border-fg/15 text-fg transition-colors hover:bg-fg/10";

  return (
    <header className={"no-print sticky top-2 z-20 glass-header" + (scrolled ? " is-scrolled" : "")}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        {/* ── KIRI: logo + tab halaman (desktop) ── */}
        <Link to="/" className="flex shrink-0 items-center">
          <img src={theme === "dark" ? LOGO_DARK : LOGO_LIGHT} alt="20FIT" className="h-8 w-auto" />
        </Link>

        <nav className="ml-1 hidden min-w-0 items-center gap-1 overflow-hidden sm:flex">
          {desktopTab("/", t("homeNav"))}
          {desktopTab("/resep", t("browse"))}
          {desktopTab("/artikel", t("articlesNav"))}
          {desktopTab("/eat-now", t("eatNowPageTitle"))}
          {desktopTab("/submit", t("submit"))}
          {desktopTab("/tersimpan", t("saved"))}
          {isAuthenticated && desktopTab("/submission-saya", t("mySubmissions"))}
        </nav>

        {/* ── KANAN: utilities ── */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* More (⋮) — mobile only, PALING DEPAN (sebelum waffle): berisi tab halaman + tema. */}
          <button
            type="button"
            className={utilBtn + " sm:hidden"}
            onClick={() => setMenu(menu === "more" ? null : "more")}
            aria-label="Menu lainnya"
            aria-haspopup="true"
            aria-expanded={menu === "more"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>

          {/* Produk lain (waffle) -- icon only */}
          <AppSwitcher open={menu === "apps"} onOpenChange={(o) => setMenu(o ? "apps" : null)} />

          {/* Tema — desktop: ICON SAJA (SVG sun/moon), tanpa teks/emoji. Mobile: masuk ke More */}
          <button
            className="hidden h-8 w-8 place-items-center rounded-full border border-fg/15 text-fg transition-colors hover:bg-fg/10 sm:grid"
            onClick={toggle}
            aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
          </button>

          {/* Bahasa [ID|EN] — SELALU tampil (mobile + desktop). Aktif = netral (bukan merah). */}
          <div
            className="flex items-center rounded-lg border border-fg/15 p-0.5 text-[11px] font-bold"
            role="group"
            aria-label="Bahasa / Language"
          >
            <button
              className={
                "rounded-md px-2.5 py-1 transition-colors " +
                (lang === "id" ? "bg-fg text-bg" : "text-fg/50 hover:text-fg")
              }
              onClick={() => setLang("id")}
              aria-pressed={lang === "id"}
            >
              ID
            </button>
            <button
              className={
                "rounded-md px-2.5 py-1 transition-colors " +
                (lang === "en" ? "bg-fg text-bg" : "text-fg/50 hover:text-fg")
              }
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>

          {/* Profil (avatar + nama depan di desktop) atau Masuk */}
          {isAuthenticated ? (
            <ProfileMenu
              open={menu === "profile"}
              onOpenChange={(o) => setMenu(o ? "profile" : null)}
              user={user}
              onLogout={() => {
                setMenu(null);
                void logout();
              }}
            />
          ) : (
            /* Belum login: teks "Daftar/Sign up" -> buka modal daftar (recipe tetap in-place). */
            <button
              className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-fg transition-colors hover:text-brand-red"
              onClick={() => login("up")}
            >
              {t("signUp")}
            </button>
          )}

        </div>
      </div>

      {/* ── Dropdown "More" (mobile): tab halaman + tema + bahasa ── */}
      {menu === "more" && (
        <div className="sm:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMenu(null)} aria-hidden="true" />
          <div className="absolute right-2 top-full z-50 mt-1 w-[min(240px,88vw)] rounded-2xl border border-fg/10 bg-card p-2 text-fg shadow-xl">
            {moreTab("/", t("homeNav"))}
            {moreTab("/resep", t("browse"))}
            {moreTab("/artikel", t("articlesNav"))}
            {moreTab("/eat-now", t("eatNowPageTitle"))}
            {moreTab("/submit", t("submit"))}
            {moreTab("/tersimpan", t("saved"))}
            {isAuthenticated && moreTab("/submission-saya", t("mySubmissions"))}

            <div className="my-1.5 border-t border-fg/10" />

            {/* Tema (bahasa sudah tampil langsung di header) */}
            <button
              type="button"
              onClick={() => { toggle(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-fg/80 transition-colors hover:bg-fg/10"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
              {theme === "dark" ? "Mode terang" : "Mode gelap"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
