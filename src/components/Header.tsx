import { useEffect, useState } from "react";
import { Link, useRouter } from "../router";
import { useAuth } from "../lib/auth";
import { useLang, useTheme } from "../lib/store";
import { LOGO_DARK } from "../lib/constants";

/**
 * Header "kaca ringan" -- tapi latarnya SELALU gelap (bukan ikut tema terang/gelap situs),
 * karena ini titik paling gampang gagal: foto makanan terang lewat di baliknya saat halaman
 * digulir (header sticky). Kaca terang + teks gelap gampang hilang di atas foto terang; latar
 * gelap + teks putih tetap terbaca apa pun yang lewat di belakang. Lihat .glass-header di
 * index.css. `is-scrolled` menambah kepadatan (hardening) begitu halaman mulai digulir.
 */
export function Header() {
  const { t, lang, setLang } = useLang();
  const { theme, toggle } = useTheme();
  const { isAuthenticated, user, login, logout } = useAuth();
  const { path } = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItem = (to: string, label: string) => {
    const active = to === "/" ? path === "/" : path.startsWith(to);
    return (
      <Link
        to={to}
        className={
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
          (active ? "bg-brand-red text-white" : "text-white/70 hover:text-white")
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
          {navItem("/", t("browse"))}
          {navItem("/eat-now", t("eatNowPageTitle"))}
          {navItem("/submit", t("submit"))}
          {navItem("/tersimpan", t("saved"))}
          {isAuthenticated && navItem("/submission-saya", t("mySubmissions"))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Toggle tema terang / gelap */}
          <button
            className="grid h-8 w-8 place-items-center rounded-full border border-white/20 text-sm text-white hover:bg-white/10"
            onClick={toggle}
            aria-label="Ganti tema"
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Toggle bahasa [ID | EN] */}
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

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[140px] truncate text-xs text-white/60 md:inline">
                {user?.email}
              </span>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                onClick={() => logout()}
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => login("in")}>
              {t("login")}
            </button>
          )}
        </div>
      </div>

      {/* Nav mobile */}
      <nav className="flex flex-wrap items-center gap-1 border-t border-white/10 px-4 py-2 sm:hidden">
        {navItem("/", t("browse"))}
        {navItem("/eat-now", t("eatNowPageTitle"))}
        {navItem("/submit", t("submit"))}
        {navItem("/tersimpan", t("saved"))}
        {isAuthenticated && navItem("/submission-saya", t("mySubmissions"))}
      </nav>
    </header>
  );
}
