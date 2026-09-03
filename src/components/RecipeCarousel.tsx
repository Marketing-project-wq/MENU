import { RecipeCard } from "./RecipeCard";
import type { RecipeVM } from "../lib/types";

/**
 * Carousel resep yang bisa di-geser horizontal (scroll-snap). Memakai ulang RecipeCard
 * (kartu yang sama dengan grid), hanya dibungkus item berlebar tetap + snap. Tak ada
 * dependency library; aman untuk mobile (native touch scroll). Kalau kosong -> tak render.
 */
export function RecipeCarousel({ picks }: { picks: RecipeVM[] }) {
  if (!picks.length) return null;
  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
    >
      {picks.map((r, i) => (
        <div key={r.key} role="listitem" className="w-40 flex-none snap-start sm:w-48">
          <RecipeCard r={r} priority={i < 2} />
        </div>
      ))}
    </div>
  );
}
