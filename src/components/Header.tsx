import { useEffect, useState } from "react";
import { Link, useRouter } from "../router";
import { useAuth } from "../lib/auth";
import { useLang, useTheme } from "../lib/store";
import { Icon } from "./Icon";
import { AppSwitcher } from "./AppSwitcher";
import { ProfileMenu } from "./ProfileMenu";
import { LOGO_DARK, LOGO_LIGHT } from "../lib/constants";

/**
 * Header MINIMALIST & NETRAL yang MENYATU dgn address bar browser (seamless), ikut tema
 * terang/gelap situs. Latar SOLID = warna --bg (lihat .glass-header di index.css) — bukan
 * merah, bukan kaca gelap. Teks & kontrol pakai warna --fg (adaptif), brand-red HANYA sbg
 * aksen (pill halaman aktif, tombol Masuk). theme-color di <head> disamakan --bg → browser
 * bar & header satu warna. `is-scrolled` sekadar menegaskan garis bawah.
 *
 * MOBILE = SATU BARIS: logo + [waffle produk][hamburger][profil/Masuk]. Nav halaman, tema,
 * dan bahasa masuk ke DALAM drawer hamburger supaya tak pernah wrap ke baris kedua.
 * DESKTOP: nav + semua kontrol tampil inline (hamburger disembunyikan).
 */
export function Header() {
  const { t, lang, setLang } = useLang();
  const { theme, toggle } = useTheme();
  const { isAuthenticated, user, login, logout } = useAuth();
  const { path } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  // Satu popover header aktif dalam satu waktu: app-switcher / profil / nav-mobile (hamburger).
  const [menu, setMenu] = useState<"apps" | "profile" | "nav" | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tutup drawer nav (mobile) via Escape -- klik-luar ditangani backdrop di bawah.
  useEffect(() => {
    if (menu !== "nav") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  // Nav desktop: "pill" kecil inline. Aktif = aksen brand-red (penanda halaman); sisanya netral.
  const navItem = (to: string, label: string) => {
    const active = to === "/" ? path === "/" : path.startsWith(to);
    return (
      <Link
        to={to}
        className={
          "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
          (active ? "bg-brand-red text-white" : "text-fg/60 hover:text-fg")
        }
      >
        {label}
      </Link>
    );
  };

  // Nav mobile: baris penuh di dalam drawer hamburger (tutup drawer begitu dipilih).
  const mobileNavRow = (to: string, label: string) => {
    const active = to === "/" ? path === "/" : path.startsWith(to);
    return (
      <Link
        to={to}
        onClick={() => setMenu(null)}
        className={
          "block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors " +
          (active ? "bg-brand-red text-white" : "text-fg/80 hover:bg-fg/10")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <header className={"no-print sticky top-0 z-20 glass-header" + (scrolled ? " is-scrolled" : "")}>
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          {/* Logo ikut tema: versi gelap (putih) di dark, versi terang (berwarna) di light. */}
          <img src={theme === "dark" ? LOGO_DARK : LOGO_LIGHT} alt="20FIT" className="h-10 w-auto" />
          <span className="text-sm font-bold tracking-tight text-fg/70">Menu</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {navItem("/", t("homeNav"))}
          {navItem("/resep", t("browse"))}
          {navItem("/artikel", t("articlesNav"))}
          {navItem("/eat-now", t("eatNowPageTitle"))}
          {navItem("/submit", t("submit"))}
          {navItem("/tersimpan", t("saved"))}
          {isAuthenticated && navItem("/submission-saya", t("mySubmissions"))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* App-switcher 20FIT (waffle) -- pindah ke produk 20FIT lain, di dalam header ini. */}
          <AppSwitcher open={menu === "apps"} onOpenChange={(o) => setMenu(o ? "apps" : null)} />

          {/* Hamburger (mobile only) -- buka drawer berisi nav halaman + tema + bahasa. */}
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full border border-fg/15 text-fg transition-colors hover:bg-fg/10 sm:hidden"
            onClick={() => setMenu(menu === "nav" ? null : "nav")}
            aria-label="Menu"
            aria-haspopup="true"
            aria-expanded={menu === "nav"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {/* Toggle tema terang / gelap (desktop; di mobile pindah ke drawer hamburger) */}
          <button
            className="hidden h-8 w-8 place-items-center rounded-full border border-fg/15 text-sm text-fg hover:bg-fg/10 sm:grid"
            onClick={toggle}
            aria-label="Ganti tema"
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
          </button>

          {/* Toggle bahasa [ID | EN] (desktop; di mobile pindah ke drawer hamburger) */}
          <div
            className="hidden items-center rounded-full border border-fg/15 p-0.5 text-xs font-bold sm:flex"
            role="group"
            aria-label="Bahasa / Language"
          >
            <button
              className={
                "rounded-full px-2.5 py-1 transition-colors " +
                (lang === "id" ? "bg-brand-red text-white" : "text-fg/50 hover:text-fg")
              }
              onClick={() => setLang("id")}
              aria-pressed={lang === "id"}
            >
              ID
            </button>
            <button
              className={
                "rounded-full px-2.5 py-1 transition-colors " +
                (lang === "en" ? "bg-brand-red text-white" : "text-fg/50 hover:text-fg")
              }
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>

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
            <button className="btn-primary" onClick={() => login("in")}>
              {t("login")}
            </button>
          )}
        </div>
      </div>

      {/* Drawer nav mobile (hamburger): nav halaman + tema + bahasa. Ganti bar kedua yang dulu. */}
      {menu === "nav" && (
        <div className="sm:hidden">
          {/* Backdrop klik-luar */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMenu(null)}
            aria-hidden="true"
          />
          <nav className="absolute inset-x-0 top-full z-50 border-t border-fg/10 bg-card p-3 shadow-xl">
            <div className="mx-auto max-w-6xl">
              {mobileNavRow("/", t("homeNav"))}
              {mobileNavRow("/resep", t("browse"))}
              {mobileNavRow("/artikel", t("articlesNav"))}
              {mobileNavRow("/eat-now", t("eatNowPageTitle"))}
              {mobileNavRow("/submit", t("submit"))}
              {mobileNavRow("/tersimpan", t("saved"))}
              {isAuthenticated && mobileNavRow("/submission-saya", t("mySubmissions"))}

              <div className="my-2 border-t border-fg/10" />

              {/* Tema */}
              <button
                type="button"
                onClick={toggle}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-fg/80 transition-colors hover:bg-fg/10"
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
                {theme === "dark" ? "Mode terang" : "Mode gelap"}
              </button>

              {/* Bahasa */}
              <div className="flex items-center justify-between rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-fg/80">Bahasa</span>
                <div
                  className="flex items-center rounded-full border border-fg/15 p-0.5 text-xs font-bold"
                  role="group"
                  aria-label="Bahasa / Language"
                >
                  <button
                    className={
                      "rounded-full px-2.5 py-1 transition-colors " +
                      (lang === "id" ? "bg-brand-red text-white" : "text-fg/50 hover:text-fg")
                    }
                    onClick={() => setLang("id")}
                    aria-pressed={lang === "id"}
                  >
                    ID
                  </button>
                  <button
                    className={
                      "rounded-full px-2.5 py-1 transition-colors " +
                      (lang === "en" ? "bg-brand-red text-white" : "text-fg/50 hover:text-fg")
                    }
                    onClick={() => setLang("en")}
                    aria-pressed={lang === "en"}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
