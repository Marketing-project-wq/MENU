import { useLang } from "../lib/store";
import { LOGO_DARK, MY20FIT, OTHER_20FIT_PRODUCTS } from "../lib/constants";

/** Footer PADAT (bukan kaca) -- hitam brand #141414, kontras penuh, terlepas dari tema situs. */
export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  const links = [
    { href: MY20FIT, label: t("footerMy") },
    { href: OTHER_20FIT_PRODUCTS.CLINIC, label: t("footerClinic") },
    { href: OTHER_20FIT_PRODUCTS.GYM, label: t("footerGym") },
    { href: OTHER_20FIT_PRODUCTS.ARENA, label: t("footerArena") },
  ];

  return (
    <footer className="no-print mt-10 bg-brand-dark">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="max-w-sm">
            <img src={LOGO_DARK} alt="20FIT" className="mx-auto h-8 w-auto sm:mx-0" />
            <p className="mt-3 text-xs leading-relaxed text-white/60">{t("footerAbout")}</p>
          </div>

          <nav aria-label={t("footerLinksTitle")} className="flex flex-col items-center gap-2 sm:items-end">
            <span className="mb-0 block text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("footerLinksTitle")}
            </span>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 sm:justify-end">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-white/75 transition-colors hover:text-brand-red"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </nav>
        </div>

        <p className="mt-8 text-center text-[11px] text-white/40">
          © {year} 20FIT · {t("footerRights")}
        </p>
      </div>
    </footer>
  );
}
