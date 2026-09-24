import { RecipeCard } from "./RecipeCard";
import { Carousel } from "./Carousel";
import type { RecipeVM } from "../lib/types";

export function RecipeCarousel({ picks }: { picks: RecipeVM[] }) {
  if (!picks.length) return null;
  return (
    <Carousel label="Resep favorit">
      {picks.map((r, i) => (
        <div key={r.key} role="listitem" className="w-40 flex-none snap-start sm:w-48">
          <RecipeCard r={r} priority={i < 2} />
        </div>
      ))}
    </Carousel>
  );
}
