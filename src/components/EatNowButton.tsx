import { grabUrlForCategory } from "../lib/grab";
import { useLang } from "../lib/store";
import { api } from "../lib/api";
import type { RecipeVM } from "../lib/types";

/**
 * Tombol "Eat Now" -> LINK JUJUR ke halaman cuisine GrabFood yang relevan dengan kategori menu
 * (mis. menu Nasi -> kategori Nasi di GrabFood). BUKAN scraping / BUKAN menarik data Grab;
 * hanya redirect ke halaman kategori publik mereka (buka tab baru). Klik dicatat best-effort.
 * Dipakai di kartu (halaman Pesan) & halaman detail resep.
 */
export function EatNowButton({
  r,
  className = "",
  size = "sm",
}: {
  r: RecipeVM;
  className?: string;
  size?: "sm" | "md";
}) {
  const { t } = useLang();
  const pad = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  return (
    <button
      type="button"
      title={t("eatNowGrabHint")}
      onClick={(e) => {
        // Kartu resep dibungkus <Link> (anchor). Cegah navigasi ke detail saat tombol diklik.
        e.preventDefault();
        e.stopPropagation();
        void api.trackDeliveryClick(r.source, r.id, "grabfood");
        window.open(grabUrlForCategory(r.category, r.source + ":" + r.id), "_blank", "noopener,noreferrer");
      }}
      className={"btn-primary inline-flex items-center justify-center gap-1 " + pad + " " + className}
    >
      🛵 {t("eatNowBtn")} ↗
    </button>
  );
}
