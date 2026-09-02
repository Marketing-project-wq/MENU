import { Link } from "../router";
import { useLang } from "../lib/store";
import type { ArticleSummary } from "../lib/types";

export function ArticleCard({ a }: { a: ArticleSummary }) {
  const { t } = useLang();
  return (
    <Link
      to={`/artikel/${encodeURIComponent(a.slug)}`}
      className="app-card group block overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-36 bg-fg/5">
        {a.cover_url ? (
          <img src={a.cover_url} alt={a.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl" aria-hidden>
            📝
          </div>
        )}
        {a.category && (
          <span className="chip absolute left-2 top-2 bg-black/45 text-white backdrop-blur">{a.category}</span>
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
