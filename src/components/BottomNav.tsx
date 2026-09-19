import { Link, useRouter } from "../router";
import { useLang } from "../lib/store";
import { Icon, type IconName } from "./Icon";

/* Bilah navigasi bawah ala app (mobile) — bikin recipe.20fit.id kerasa seperti aplikasi,
 * bukan halaman web. Cuma tampil di layar kecil (<sm); di >=sm nav lengkap sudah ada di
 * Header. Latar HITAM brand + aksen MERAH utk tab aktif. Menghormati safe-area (notch /
 * home-indicator) lewat env(safe-area-inset-bottom) supaya pas saat di-install (standalone).
 *
 * 5 tujuan utama saja (biar bersih). Aksi sekunder (Kirim Resep / Submission Saya) tetap
 * ada di Header mobile — tidak ada yang jadi tak terjangkau. */
export function BottomNav() {
  const { path } = useRouter();
  const { t } = useLang();

  const tabs: { to: string; icon: IconName; label: string }[] = [
    { to: "/", icon: "home", label: t("homeNav") },
    { to: "/resep", icon: "utensils", label: t("browse") },
    { to: "/eat-now", icon: "scooter", label: "Eat Now" }, // istilah brand, ringkas utk tab
    { to: "/tersimpan", icon: "bookmark", label: t("saved") },
    { to: "/artikel", icon: "note", label: t("articlesNav") },
  ];

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-brand-dark/95 backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map((tab) => {
          const active = tab.to === "/" ? path === "/" : path.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold leading-none transition-colors " +
                (active ? "text-brand-red" : "text-white/55 hover:text-white")
              }
            >
              <Icon name={tab.icon} size={22} strokeWidth={active ? 2.1 : 1.75} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
