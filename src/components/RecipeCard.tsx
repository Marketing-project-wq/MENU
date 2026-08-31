import { Link, recipeHref } from "../router";
import { SourceBadge } from "./SourceBadge";
import { FoodImage } from "./FoodImage";
import { useLang } from "../lib/store";
import { useSocial } from "../lib/social";
import { dietLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

export function RecipeCard({ r }: { r: RecipeVM }) {
  const { t, lang } = useLang();
  const { count } = useSocial();
  const hearts = count(r.source, r.id);
  return (
    <Link
      to={recipeHref(r.source, r.id)}
      className="app-card group block overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-36">
        <FoodImage
          id={r.id}
          photoQ={r.photoQ}
          photoName={r.photoName}
          photoUrl={r.photoUrl}
          emoji={r.emoji}
          tint={r.tint}
          alt={r.name}
          className="h-full w-full"
          emojiClass="text-5xl"
        />
        <div className="absolute left-2 top-2">
          <SourceBadge source={r.source} />
        </div>
        {hearts > 0 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {hearts}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-fg">
          {r.name}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {r.kcal != null && (
            <span className="chip bg-fg/5 text-fg/70">
              {r.kcal} {t("calories")}
            </span>
          )}
          {r.dietTypes.slice(0, 2).map((d) => (
            <span key={d} className="chip bg-fg/5 text-fg/60">
              {dietLabel(d, lang)}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
