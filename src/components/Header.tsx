import { useEffect, useState } from "react";
import { Link, useRouter } from "../router";
import { useAuth } from "../lib/auth";
import { useLang, useTheme } from "../lib/store";
import { Icon } from "./Icon";
import { AppSwitcher } from "./AppSwitcher";
import { ProfileMenu } from "./ProfileMenu";
import { LOGO_DARK } from "../lib/constants";

/**
 * Header "kaca ringan" -- tapi latarnya SELALU gelap (bukan ikut tema terang/gelap situs),
 * karena ini titik paling gampang gagal: foto makanan terang lewat di baliknya saat halaman
 * digulir (header sticky). Kaca terang + teks gelap gampang hilang di atas foto terang; latar
 * gelap + teks putih tetap terbaca apa pun yang lewat di belakang. Lihat .glass-header di
 * index.css. `is-scrolled` menambah kepadatan (hardening) begitu halaman mulai digulir.
 *
 * MOBILE = SATU BAR saja: logo + [waffle produk][hamburger][profil/Masuk]. Nav halaman, tema,
 * dan bahasa dipindah ke DALAM drawer hamburger supaya bar-nya rapi & nggak penuh (dulu ada 2
 * bar bertumpuk). DESKTOP tetap: nav + semua kontrol tampil inline (hamburger disembunyikan).
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

  // Nav desktop: "pill" kecil inline.
  const navItem = (to: string, label: string) => {
    const active = to === "/" ? path === "/" : path.startsWith(to);
    return (
      <Link
        to={to}
        className={
          "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
          (active ? "bg-brand-red text-white" : "text-white/70 hover:text-white")
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
          (active ? "bg-brand-red text-white" : "text-white/80 hover:bg-white/10")
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
          <img src={LOGO_DARK} alt="20FIT" className="h-10 w-auto" />
          <span className="text-sm font-bold tracking-tight text-white/80">Menu</span>
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
            className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 sm:hidden"
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
            className="hidden h-8 w-8 place-items-center rounded-full border border-white/20 text-sm text-white hover:bg-white/10 sm:grid"
            onClick={toggle}
            aria-label="Ganti tema"
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
          </button>

          {/* Toggle bahasa [ID | EN] (desktop; di mobile pindah ke drawer hamburger) */}
          <div
            className="hidden items-center rounded-full border border-white/20 p-0.5 text-xs font-bold sm:flex"
            role="group"
            aria-label="Bahasa / Language"
          >
            <button
              className={
                "rounded-full px-2.5 py-1 transition-colors " +
                (lang === "id" ? "bg-brand-red text-white" : "text-white/60 hover:text-white")
              }
              onClick={() => setLang("id")}
              aria-pressed={lang === "id"}
            >
              ID
            </button>
            <button
              className={
                "rounded-full px-2.5 py-1 transition-colors " +
                (lang === "en" ? "bg-brand-red text-white" : "text-white/60 hover:text-white")
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
          <nav className="absolute inset-x-0 top-full z-50 border-t border-white/10 bg-[#141414] p-3 shadow-2xl">
            <div className="mx-auto max-w-6xl">
              {mobileNavRow("/", t("homeNav"))}
              {mobileNavRow("/resep", t("browse"))}
              {mobileNavRow("/artikel", t("articlesNav"))}
              {mobileNavRow("/eat-now", t("eatNowPageTitle"))}
              {mobileNavRow("/submit", t("submit"))}
              {mobileNavRow("/tersimpan", t("saved"))}
              {isAuthenticated && mobileNavRow("/submission-saya", t("mySubmissions"))}

              <div className="my-2 border-t border-white/10" />

              {/* Tema */}
              <button
                type="button"
                onClick={toggle}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
              >
                <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
                {theme === "dark" ? "Mode terang" : "Mode gelap"}
              </button>

              {/* Bahasa */}
              <div className="flex items-center justify-between rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-white/80">Bahasa</span>
                <div
                  className="flex items-center rounded-full border border-white/20 p-0.5 text-xs font-bold"
                  role="group"
                  aria-label="Bahasa / Language"
                >
                  <button
                    className={
                      "rounded-full px-2.5 py-1 transition-colors " +
                      (lang === "id" ? "bg-brand-red text-white" : "text-white/60 hover:text-white")
                    }
                    onClick={() => setLang("id")}
                    aria-pressed={lang === "id"}
                  >
                    ID
                  </button>
                  <button
                    className={
                      "rounded-full px-2.5 py-1 transition-colors " +
                      (lang === "en" ? "bg-brand-red text-white" : "text-white/60 hover:text-white")
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
