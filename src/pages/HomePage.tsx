import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "../router";
import { useLang, useRecipes } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { api } from "../lib/api";
import { ArticleCard } from "../components/ArticleCard";
import { RecipeCard } from "../components/RecipeCard";
import { Spinner } from "../components/Spinner";
import type { ArticleSummary } from "../lib/types";

/**
 * Home (Tahap 5): tiga bagian — Artikel (utama/hero, kartu lebih besar), Resep pilihan, dan
 * Eat Now. Tiap bagian punya "lihat semua". Bukan tiga blok sama besar (artikel diberi porsi
 * lebih). Browse resep pindah ke /resep; URL detail /resep/{slug} tak berubah.
 */
export function HomePage() {
  const { t, lang } = useLang();
  const { official, members, loading } = useRecipes();
  const { ensure } = useSocial();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [eatNowKeys, setEatNowKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    api.articles().then((a) => {
      if (alive) setArticles(a);
    });
    api.eatNowKeys().then((items) => {
      if (alive) setEatNowKeys(new Set(items.map((i) => `${i.source}:${i.menu_id}`)));
    });
    return () => {
      alive = false;
    };
  }, []);

  const vms = useMemo(() => buildVMs(official, members, lang), [official, members, lang]);
  const recipePicks = useMemo(() => vms.slice(0, 4), [vms]);
  const eatNowPicks = useMemo(
    () => vms.filter((r) => eatNowKeys.has(`${r.source}:${r.id}`)).slice(0, 4),
    [vms, eatNowKeys]
  );

  useEffect(() => {
    const list = [...recipePicks, ...eatNowPicks];
    if (list.length) ensure(list.map((r) => ({ source: r.source, id: r.id })));
  }, [recipePicks, eatNowPicks, ensure]);

  const articlePicks = articles.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-8 rounded-2xl bg-brand-red/5 p-6 text-center sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">{t("homeHeroTitle")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-fg/60">{t("homeHeroSub")}</p>
        <Link to="/resep" className="btn-primary mt-4 inline-flex">
          {t("browseAllRecipes")}
        </Link>
      </section>

      {/* Artikel — bagian utama (kartu lebih besar, sampai 6). */}
      {articlePicks.length > 0 && (
        <HomeSection title={t("homeArticlesHeading")} to="/artikel">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {articlePicks.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </HomeSection>
      )}

      {/* Resep pilihan */}
      <HomeSection title={t("homeRecipesHeading")} to="/resep">
        {loading && vms.length === 0 ? (
          <Spinner label={t("loading")} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recipePicks.map((r) => (
              <RecipeCard key={r.key} r={r} />
            ))}
          </div>
        )}
      </HomeSection>

      {/* Eat Now (kalau ada pemetaan) */}
      {eatNowPicks.length > 0 && (
        <HomeSection title={t("homeEatNowHeading")} to="/eat-now">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {eatNowPicks.map((r) => (
              <RecipeCard key={r.key} r={r} />
            ))}
          </div>
        </HomeSection>
      )}
    </div>
  );
}

function HomeSection({ title, to, children }: { title: string; to: string; children: ReactNode }) {
  const { t } = useLang();
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-fg">{title}</h2>
        <Link to={to} className="text-sm font-semibold text-brand-red">
          {t("seeAll")} →
        </Link>
      </div>
      {children}
    </section>
  );
}
