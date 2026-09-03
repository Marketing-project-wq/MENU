import { Link } from "../router";
import { useLang } from "../lib/store";
import { pickBi } from "../lib/normalize";
import { CoverImage } from "./CoverImage";
import type { ArticleSummary } from "../lib/types";

export function ArticleCard({ a }: { a: ArticleSummary }) {
  const { t, lang } = useLang();
  const title = pickBi(a.title, lang);
  const excerpt = pickBi(a.excerpt, lang);
  const category = pickBi(a.category, lang);
  return (
    <Link
      to={`/artikel/${encodeURIComponent(a.slug)}`}
      className="app-card group block overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-36 bg-fg/5">
        <CoverImage src={a.cover_url} alt={title} className="h-full w-full" emoji="📝" />
        {category && (
          <span className="chip absolute left-2 top-2 bg-black/45 text-white backdrop-blur">{category}</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-fg">{title}</h3>
        {excerpt && <p className="mt-1 line-clamp-2 text-xs text-fg/55">{excerpt}</p>}
        {a.author_name && (
          <p className="mt-1.5 text-[11px] text-fg/40">
            {t("articleBy")} {a.author_name}
          </p>
        )}
      </div>
    </Link>
  );
}
