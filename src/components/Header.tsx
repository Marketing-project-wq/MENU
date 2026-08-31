import { Link, useRouter } from "../router";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/store";

export function Header() {
  const { t, lang, setLang } = useLang();
  const { isAuthenticated, user, login, logout } = useAuth();
  const { path } = useRouter();

  const navItem = (to: string, label: string) => {
    const active = to === "/" ? path === "/" : path.startsWith(to);
    return (
      <Link
        to={to}
        className={
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
          (active ? "bg-brand-red/10 text-brand-red" : "text-black/60 hover:text-brand-dark")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f5f0]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-dark text-sm font-black text-white">
            20
          </span>
          <span className="text-base font-extrabold tracking-tight text-brand-dark">
            Menu<span className="text-brand-red">20FIT</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {navItem("/", t("browse"))}
          {navItem("/submit", t("submit"))}
          {isAuthenticated && navItem("/submission-saya", t("mySubmissions"))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div
            className="flex items-center rounded-full border border-black/10 p-0.5 text-xs font-bold"
            role="group"
            aria-label="Bahasa / Language"
          >
            <button
              className={
                "rounded-full px-2.5 py-1 transition-colors " +
                (lang === "id" ? "bg-brand-red text-white" : "text-black/55 hover:text-brand-dark")
              }
              onClick={() => setLang("id")}
              aria-pressed={lang === "id"}
            >
              ID
            </button>
            <button
              className={
                "rounded-full px-2.5 py-1 transition-colors " +
                (lang === "en" ? "bg-brand-red text-white" : "text-black/55 hover:text-brand-dark")
              }
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[140px] truncate text-xs text-black/50 md:inline">
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
      <nav className="flex items-center gap-1 border-t border-black/5 px-4 py-2 sm:hidden">
        {navItem("/", t("browse"))}
        {navItem("/submit", t("submit"))}
        {isAuthenticated && navItem("/submission-saya", t("mySubmissions"))}
      </nav>
    </header>
  );
}
