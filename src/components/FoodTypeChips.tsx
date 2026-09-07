import { useMemo } from "react";
import { useRouter } from "../router";
import { useLang } from "../lib/store";
import { catLabel, dietLabel } from "../lib/i18n";
import { FoodImage } from "./FoodImage";
import type { Lang, RecipeVM } from "../lib/types";

// Toggle tipe makanan PALING ATAS beranda -- pakai FOTO ASLI resep (lewat FoodImage/resolveFoodPhoto),
// bukan emoji/ikon, untuk 7 tipe yang paling sering dicari user. 6 dari 7 = kategori katalog asli
// (category), 1 (Keto) = tag diet (dietTypes) karena "Keto" bukan category di katalog (cat: bukan
// diet, lihat js/recipes.js) -- makanya route-nya beda: /resep?diet=keto vs /resep?category=X.
interface FoodType {
  key: string;
  href: string;
  match: (r: RecipeVM) => boolean;
  label: (lang: Lang) => string;
}

const FOOD_TYPES: FoodType[] = [
  { key: "Vegetarian", href: "/resep?category=Vegetarian", match: (r) => r.category === "Vegetarian", label: (l) => catLabel("Vegetarian", l) },
  { key: "Keto", href: "/resep?diet=keto", match: (r) => r.dietTypes.includes("keto"), label: (l) => dietLabel("keto", l) },
  { key: "Chicken", href: "/resep?category=Chicken", match: (r) => r.category === "Chicken", label: (l) => catLabel("Chicken", l) },
  { key: "Fish", href: "/resep?category=Fish", match: (r) => r.category === "Fish", label: (l) => catLabel("Fish", l) },
  { key: "Snack", href: "/resep?category=Snack", match: (r) => r.category === "Snack", label: (l) => catLabel("Snack", l) },
  { key: "Rice", href: "/resep?category=Rice", match: (r) => r.category === "Rice", label: (l) => catLabel("Rice", l) },
  { key: "Noodle", href: "/resep?category=Noodle", match: (r) => r.category === "Noodle", label: (l) => catLabel("Noodle", l) },
];

export function FoodTypeChips({ vms }: { vms: RecipeVM[] }) {
  const { navigate } = useRouter();
  const { lang, t } = useLang();

  // Satu resep asli per tipe (foto representatif) -- tipe yang belum ada resepnya di katalog
  // (mis. "Fish"/"Keto" masih tipis datanya) otomatis disembunyikan, bukan tampil dgn foto kosong.
  const chips = useMemo(() => {
    const out: { type: FoodType; recipe: RecipeVM }[] = [];
    for (const type of FOOD_TYPES) {
      const recipe = vms.find(type.match);
      if (recipe) out.push({ type, recipe });
    }
    return out;
  }, [vms]);

  if (chips.length === 0) return null;

  return (
    <div
      className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible"
      role="group"
      aria-label={t("homeHeroTitle")}
    >
      {chips.map(({ type, recipe }) => (
        <button
          key={type.key}
          type="button"
          onClick={() => navigate(type.href)}
          className="flex flex-none flex-col items-center gap-1.5"
        >
          <span className="block h-16 w-16 overflow-hidden rounded-full border-2 border-fg/10 transition-colors hover:border-brand-red/60 sm:h-20 sm:w-20">
            <FoodImage
              id={recipe.id}
              photoQ={recipe.photoQ}
              photoName={recipe.photoName}
              photoUrl={recipe.photoUrl}
              emoji={recipe.emoji}
              tint={recipe.tint}
              alt={type.label(lang)}
              className="h-full w-full"
              emojiClass="text-2xl"
              widths={[80, 160]}
              sizes="80px"
            />
          </span>
          <span className="max-w-[4.5rem] truncate text-xs font-medium text-fg/75">{type.label(lang)}</span>
        </button>
      ))}
    </div>
  );
}
