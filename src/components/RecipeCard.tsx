import { Link, recipeHref } from "../router";
import { SourceBadge } from "./SourceBadge";
import { useLang } from "../lib/store";
import { dietLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

export function RecipeCard({ r }: { r: RecipeVM }) {
  const { t, lang } = useLang();
  return (
    <Link
      to={recipeHref(r.source, r.id)}
      className="app-card group block overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="relative flex h-36 items-center justify-center"
        style={{ backgroundColor: r.photoUrl ? undefined : hexToTint(r.tint) }}
      >
        {r.photoUrl ? (
          <img
            src={r.photoUrl}
            alt={r.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-5xl" aria-hidden>
            {r.emoji}
          </span>
        )}
        <div className="absolute left-2 top-2">
          <SourceBadge source={r.source} />
        </div>
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

// Warna tint dibuat sangat lembut sebagai latar placeholder.
function hexToTint(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#f0ede5";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}
