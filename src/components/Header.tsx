import { Link, useRouter } from "../router";
import { useAuth } from "../lib/auth";
import { useLang, useTheme } from "../lib/store";

// Logo 20FIT — versi terang & gelap (putih) di-swap otomatis oleh kelas .dark.
const LOGO_LIGHT = "https://media.20fit.id/wp-content/uploads/2026/05/Logo-20fit.png";
const LOGO_DARK = "https://media.20fit.id/wp-content/uploads/2026/07/Copy-of-new-logo-20fit-putih-3.png";

export function Header() {
  const { t, lang, setLang } = useLang();
  const { theme, toggle } = useTheme();
  const { isAuthenticated, user, login, logout } = useAuth();
  const { path } = useRouter();

  const navItem = (to: string, label: string) => {
    const active = to === "/" ? path === "/" : path.startsWith(to);
    return (
      <Link
        to={to}
        className={
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
          (active ? "bg-brand-red/10 text-brand-red" : "text-fg/60 hover:text-fg")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b border-fg/5 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={LOGO_LIGHT} alt="20FIT" className="h-10 w-auto dark:hidden" />
          <img src={LOGO_DARK} alt="20FIT" className="hidden h-10 w-auto dark:block" />
          <span className="text-sm font-bold tracking-tight text-fg/70">Menu</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {navItem("/", t("browse"))}
          {navItem("/submit", t("submit"))}
          {isAuthenticated && navItem("/submission-saya", t("mySubmissions"))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Toggle tema terang / gelap */}
          <button
            className="grid h-8 w-8 place-items-center rounded-full border border-fg/10 text-sm hover:bg-fg/5"
            onClick={toggle}
            aria-label="Ganti tema"
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Toggle bahasa [ID | EN] */}
          <div
            className="flex items-center rounded-full border border-fg/10 p-0.5 text-xs font-bold"
            role="group"
            aria-label="Bahasa / Language"
          >
            <button
              className={
                "rounded-full px-2.5 py-1 transition-colors " +
                (lang === "id" ? "bg-brand-red text-white" : "text-fg/55 hover:text-fg")
              }
              onClick={() => setLang("id")}
              aria-pressed={lang === "id"}
            >
              ID
            </button>
            <button
              className={
                "rounded-full px-2.5 py-1 transition-colors " +
                (lang === "en" ? "bg-brand-red text-white" : "text-fg/55 hover:text-fg")
              }
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[140px] truncate text-xs text-fg/50 md:inline">
                {user?.email}
              </span>
              <button className="btn-ghost" onClick={() => logout()}>
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
      <nav className="flex items-center gap-1 border-t border-fg/5 px-4 py-2 sm:hidden">
        {navItem("/", t("browse"))}
        {navItem("/submit", t("submit"))}
        {isAuthenticated && navItem("/submission-saya", t("mySubmissions"))}
      </nav>
    </header>
  );
}
