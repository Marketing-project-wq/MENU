import { useRouter } from "../router";
import { useLang } from "../lib/store";
import { catLabel } from "../lib/i18n";
import { Icon, type IconName } from "./Icon";

// Ikon garis per tipe makanan (hiasan; kunci = nilai kategori mentah dari katalog). Menggantikan
// emoji lama supaya konsisten dengan sistem ikon 20FIT.
const FOOD_ICON: Record<string, IconName> = {
  Chicken: "drumstick",
  Beef: "steak",
  Seafood: "fish",
  Vegetarian: "salad",
  Vegan: "sprout",
  Rice: "bowlRice",
  Pasta: "noodles",
  Noodle: "noodles",
};

// Urutan tampil yang diinginkan; kategori lain yang tak terdaftar ditaruh di belakang (stabil).
const PREFERRED_ORDER = ["Chicken", "Beef", "Seafood", "Vegetarian", "Vegan", "Rice", "Pasta", "Noodle"];

function orderCategories(cats: string[]): string[] {
  const known = PREFERRED_ORDER.filter((c) => cats.includes(c));
  const rest = cats.filter((c) => !PREFERRED_ORDER.includes(c)).sort();
  return [...known, ...rest];
}

/**
 * Baris "toggle" tipe makanan di bagian paling atas. Klik satu chip -> langsung masuk ke
 * halaman Resep (/resep) dalam keadaan SUDAH terfilter kategori itu (dibaca BrowsePage dari
 * ?category=). Memakai kolom kategori yang memang sudah ada di katalog (Chicken/Beef/Seafood/…),
 * bukan match nama. Kategori diteruskan dari pemanggil (kategori yang benar-benar ada di data).
 */
export function FoodTypeChips({ categories }: { categories: string[] }) {
  const { navigate } = useRouter();
  const { t, lang } = useLang();
  const ordered = orderCategories(categories);
  if (ordered.length === 0) return null;

  return (
    <section className="mb-8" aria-label={t("homeFoodTypesHeading")}>
      <h2 className="text-lg font-extrabold tracking-tight text-fg">{t("homeFoodTypesHeading")}</h2>
      <p className="mt-0.5 mb-3 text-xs text-fg/55">{t("homeFoodTypesSub")}</p>
      {/* Bisa digeser horizontal di HP; membungkus di layar lebar. Tak menambah tinggi berlebih. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {ordered.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => navigate(`/resep?category=${encodeURIComponent(cat)}`)}
            className="chip inline-flex flex-none items-center gap-1.5 border border-fg/15 bg-card text-fg/80 transition-colors hover:border-brand-red/60 hover:text-brand-red"
          >
            <Icon name={FOOD_ICON[cat] ?? "utensils"} size={16} className="flex-none text-fg/60" />
            <span className="whitespace-nowrap">{catLabel(cat, lang)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
