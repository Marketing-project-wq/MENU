import { useEffect, useMemo, useState } from "react";
import { useLang } from "../lib/store";
import { api } from "../lib/api";
import { pickBi } from "../lib/normalize";
import { ArticleCard } from "../components/ArticleCard";
import { Spinner } from "../components/Spinner";
import type { ArticleSummary } from "../lib/types";

/** Daftar artikel rekomendasi tempat makan (in-house, bukan WordPress). */
export function ArticlesPage() {
  const { t, lang } = useLang();
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [cat, setCat] = useState("");

  useEffect(() => {
    let alive = true;
    api.articles().then((a) => {
      if (alive) setArticles(a);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Kategori dibaca sesuai lang aktif -- filter di-reset kalau ganti bahasa (nilai lama, mis.
  // "Tips Sehat", tak selalu punya padanan persis di sisi EN).
  const categories = useMemo(() => {
    const s = new Set<string>();
    (articles || []).forEach((a) => {
      const c = pickBi(a.category, lang);
      if (c) s.add(c);
    });
    return Array.from(s).sort();
  }, [articles, lang]);

  useEffect(() => {
    setCat("");
  }, [lang]);

  const filtered = useMemo(
    () => (articles || []).filter((a) => !cat || pickBi(a.category, lang) === cat),
    [articles, cat, lang]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("articlesTitle")}</h1>
        <p className="mt-1 text-sm text-fg/55">{t("articlesSub")}</p>
      </section>

      {articles === null ? (
        <Spinner label={t("loading")} />
      ) : articles.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">{t("articlesEmpty")}</div>
      ) : (
        <>
          {categories.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => setCat("")}
                className={
                  "chip border " +
                  (cat === "" ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-fg/15 text-fg/60")
                }
              >
                {t("eatNowAllCat")}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={
                    "chip border " +
                    (cat === c ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-fg/15 text-fg/60")
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
