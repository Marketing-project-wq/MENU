import { useEffect, useState } from "react";
import { Link } from "../router";
import { api } from "../lib/api";
import { useLang } from "../lib/store";
import type { ArticleSummary, Source } from "../lib/types";

/** "Mau makan di luar?" — artikel rekomendasi tempat makan yang terkait resep ini. Sembunyi kalau kosong. */
export function RelatedArticles({ source, id }: { source: Source; id: string }) {
  const { t } = useLang();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    let alive = true;
    api.recipeArticles(source, id).then((a) => {
      if (alive) setArticles(a);
    });
    return () => {
      alive = false;
    };
  }, [source, id]);

  if (!articles.length) return null;

  return (
    <div className="glass-solid mt-6 rounded-2xl p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-fg/70">{t("recipeRelatedArticles")}</h2>
      <ul className="mt-3 space-y-2">
        {articles.map((a) => (
          <li key={a.id}>
            <Link
              to={`/artikel/${encodeURIComponent(a.slug)}`}
              className="flex items-center gap-3 rounded-xl bg-card p-3 transition hover:shadow-sm"
            >
              {a.cover_url ? (
                <img src={a.cover_url} alt="" className="h-12 w-12 flex-none rounded-lg object-cover" />
              ) : (
                <div className="grid h-12 w-12 flex-none place-items-center rounded-lg bg-fg/5" aria-hidden>
                  📝
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-fg">{a.title}</div>
                {a.excerpt && <div className="truncate text-xs text-fg/50">{a.excerpt}</div>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
