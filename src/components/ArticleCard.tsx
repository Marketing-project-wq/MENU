import { Link } from "../router";
import { useLang } from "../lib/store";
import { CoverImage } from "./CoverImage";
import type { ArticleSummary } from "../lib/types";

export function ArticleCard({ a, readMinutes }: { a: ArticleSummary; readMinutes?: number | null }) {
  const { t } = useLang();
  const mins = readMinutes ?? a.read_minutes ?? null;
  return (
    <Link
      to={`/artikel/${encodeURIComponent(a.slug)}`}
      className="app-card group block overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-36 bg-fg/5">
        <CoverImage src={a.cover_url} alt={a.title} className="h-full w-full" emoji="📝" />
        {a.category && (
          <span className="chip absolute left-2 top-2 bg-black/45 text-white backdrop-blur">{a.category}</span>
        )}
        {mins != null && (
          <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            {mins} {t("readTime")}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-fg">{a.title}</h3>
        {a.excerpt && <p className="mt-1 line-clamp-2 text-xs text-fg/55">{a.excerpt}</p>}
        {a.author_name && (
          <p className="mt-1.5 text-[11px] text-fg/40">
            {t("articleBy")} {a.author_name}
          </p>
        )}
      </div>
    </Link>
  );
}
