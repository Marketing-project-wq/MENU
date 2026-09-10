import { Link, recipeHref } from "../router";
import { FoodImage } from "./FoodImage";
import { Icon } from "./Icon";
import { useLang } from "../lib/store";
import { useSocial } from "../lib/social";
import { dietLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

export function RecipeCard({ r, priority = false }: { r: RecipeVM; priority?: boolean }) {
  const { t, lang } = useLang();
  const { count } = useSocial();
  const hearts = count(r.source, r.id);
  const totalMinutes = (r.prepMinutes ?? 0) + (r.cookMinutes ?? 0);
  return (
    <Link
      to={recipeHref(r.slug)}
      className="app-card group block overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square p-2.5" style={{ aspectRatio: "1 / 1", padding: "0.625rem" }}>
        <FoodImage
          id={r.id}
          photoQ={r.photoQ}
          photoName={r.photoName}
          photoUrl={r.photoUrl}
          emoji={r.emoji}
          tint={r.tint}
          alt={r.name}
          className="h-full w-full rounded-xl"
          aspectRatio="1 / 1"
          emojiClass="text-4xl"
          priority={priority}
        />
        {hearts > 0 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {hearts}
          </div>
        )}
        {totalMinutes > 0 && (
          <div className="absolute left-2 bottom-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
            <Icon name="clock" size={11} strokeWidth={2} />
            {totalMinutes} {t("minutesShort")}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-fg">
          {r.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-fg/45">
          {t("byPrefix")} {r.creatorName}
        </p>
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
        {r.macros && <MacroBar p={r.macros.p} c={r.macros.c} f={r.macros.f} />}
      </div>
    </Link>
  );
}

function MacroBar({ p, c, f }: { p: number; c: number; f: number }) {
  const total = p + c + f || 1;
  const pPct = Math.round((p / total) * 100);
  const cPct = Math.round((c / total) * 100);
  const fPct = 100 - pPct - cPct;
  return (
    <div className="mt-2">
      <div className="flex h-1.5 overflow-hidden rounded-full">
        <div className="bg-blue-500" style={{ width: `${pPct}%` }} />
        <div className="bg-amber-400" style={{ width: `${cPct}%` }} />
        <div className="bg-rose-400" style={{ width: `${fPct}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-fg/50">
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mr-0.5" />P {p}g</span>
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 mr-0.5" />C {c}g</span>
        <span><span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 mr-0.5" />F {f}g</span>
      </div>
    </div>
  );
}
