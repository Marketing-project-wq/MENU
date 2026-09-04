import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "../router";
import { useLang, useRecipes } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { api } from "../lib/api";
import { GRABFOOD_HOME } from "../lib/constants";
import { ArticleCard } from "../components/ArticleCard";
import { RecipeCard } from "../components/RecipeCard";
import { RecipeCarousel } from "../components/RecipeCarousel";
import { FoodTypeChips } from "../components/FoodTypeChips";
import { Spinner } from "../components/Spinner";
import { pickFavorites } from "../lib/favorites";
import { getReadMinutesMap } from "../lib/readtime";
import type { ArticleSummary, RecipeVM } from "../lib/types";

// Beranda pakai DATA ASLI: artikel in-house + resep dari katalog (difilter dari tag diet
// yang benar-benar ada), plus link-out jujur ke GrabFood utk "tempat makan". Tak ada data karangan.
const HEALTHY_DIETS = ["vegetarian", "vegan", "pescatarian", "low-carb"]; // "makan sehat" = nabati/ringan
const DIET_DIETS = ["high-protein", "keto", "low-carb"]; // "diet" = fokus makro (protein/keto)

function pickByDiet(vms: RecipeVM[], diets: string[], n: number): RecipeVM[] {
  return vms.filter((r) => r.dietTypes.some((d) => diets.includes(d))).slice(0, n);
}

/** UTM supaya trafik keluar ke GrabFood bisa diukur (tanpa mengubah tujuan / tanpa scraping). */
function grabUrl(): string {
  const utm = "utm_source=recepie.20fit.id&utm_medium=home_places&utm_campaign=eat_now";
  return GRABFOOD_HOME + (GRABFOOD_HOME.includes("?") ? "&" : "?") + utm;
}

/**
 * Home: Artikel (utama) + Rekomendasi Makan Sehat + Rekomendasi Diet (dua-duanya dari katalog
 * resep nyata, difilter tag diet) + Rekomendasi Tempat Makan (link-out GrabFood). Browse resep
 * di /resep; URL detail /resep/{slug} tak berubah.
 */
export function HomePage() {
  const { t, lang } = useLang();
  const { official, members, loading } = useRecipes();
  const { ensure } = useSocial();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [eatNowKeys, setEatNowKeys] = useState<Set<string>>(new Set());
  const [readMins, setReadMins] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    api.articles().then((a) => {
      if (alive) setArticles(a);
    });
    api.eatNowKeys().then((items) => {
      if (alive) setEatNowKeys(new Set(items.map((i) => `${i.source}:${i.menu_id}`)));
    });
    // Peta menit-baca (dari body artikel). Best-effort: kalau kosong, kartu tampil tanpa "min read".
    getReadMinutesMap().then((m) => {
      if (alive) setReadMins(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  const vms = useMemo(() => buildVMs(official, members, lang), [official, members, lang]);
  const healthyPicks = useMemo(() => pickByDiet(vms, HEALTHY_DIETS, 4), [vms]);
  const dietPicks = useMemo(() => pickByDiet(vms, DIET_DIETS, 4), [vms]);
  const favoritePicks = useMemo(() => pickFavorites(vms, 12), [vms]);
  const eatNowPicks = useMemo(
    () => vms.filter((r) => eatNowKeys.has(`${r.source}:${r.id}`)).slice(0, 4),
    [vms, eatNowKeys]
  );
  // Kategori tipe makanan yang benar-benar ada di katalog (untuk chip filter paling atas).
  const foodCategories = useMemo(() => {
    const set = new Set<string>();
    vms.forEach((r) => r.category && set.add(r.category));
    return Array.from(set);
  }, [vms]);
  const articlePicks = articles.slice(0, 5); // "Top 5 untuk dibaca hari ini" (terbaru; API sudah urut terbaru)

  // Muat jumlah heart untuk resep yang tampil (batch + dedupe di store).
  useEffect(() => {
    const list = [...favoritePicks, ...healthyPicks, ...dietPicks, ...eatNowPicks];
    if (list.length) ensure(list.map((r) => ({ source: r.source, id: r.id })));
  }, [favoritePicks, healthyPicks, dietPicks, eatNowPicks, ensure]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-8 rounded-2xl bg-brand-red/5 p-6 text-center sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">{t("homeHeroTitle")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-fg/60">{t("homeHeroSub")}</p>
        <Link to="/resep" className="btn-primary mt-4 inline-flex">
          {t("browseAllRecipes")}
        </Link>
      </section>

      {/* Toggle tipe makanan (paling atas) -- klik -> /resep sudah terfilter kategori itu. */}
      <FoodTypeChips categories={foodCategories} />

      {/* Resep Favorit -- carousel bisa digeser horizontal. */}
      {favoritePicks.length > 0 && (
        <HomeSection title={t("homeFavoritesHeading")} desc={t("homeFavoritesSub")} to="/resep">
          <RecipeCarousel picks={favoritePicks} />
        </HomeSection>
      )}

      {/* Top 5 Artikel untuk dibaca hari ini -- kartu tampilkan "X min read" di depan. */}
      {articlePicks.length > 0 && (
        <HomeSection title={t("homeTopArticlesHeading")} desc={t("homeTopArticlesSub")} to="/artikel">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {articlePicks.map((a) => (
              <ArticleCard key={a.id} a={a} readMinutes={readMins[a.slug]} />
            ))}
          </div>
        </HomeSection>
      )}

      {loading && vms.length === 0 ? (
        <Spinner label={t("loading")} />
      ) : (
        <>
          {/* Rekomendasi Makan Sehat — resep nabati/ringan dari katalog. */}
          {healthyPicks.length > 0 && (
            <HomeSection title={t("homeHealthyHeading")} desc={t("homeHealthySub")} to="/resep?diet=vegetarian">
              <RecipeGrid picks={healthyPicks} />
            </HomeSection>
          )}

          {/* Rekomendasi Diet — resep tinggi protein / keto / rendah karbo. */}
          {dietPicks.length > 0 && (
            <HomeSection title={t("homeDietHeading")} desc={t("homeDietSub")} to="/resep?diet=high-protein">
              <RecipeGrid picks={dietPicks} />
            </HomeSection>
          )}
        </>
      )}

      {/* Rekomendasi Tempat Makan — link-out JUJUR ke GrabFood + resep yang sudah dipetakan admin. */}
      <HomeSection title={t("homePlacesHeading")} desc={t("homePlacesSub")} to="/eat-now">
        <div className="app-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-fg/5 text-2xl" aria-hidden>
              🛵
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-fg">{t("placesGrabTitle")}</h3>
              <p className="mt-0.5 text-xs text-fg/55">{t("placesGrabDesc")}</p>
            </div>
            <a
              href={grabUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-none px-4 py-2 text-sm"
            >
              {t("placesGrabBtn")} ↗
            </a>
          </div>

          {eatNowPicks.length > 0 && (
            <div className="mt-4 border-t border-fg/10 pt-4">
              <RecipeGrid picks={eatNowPicks} />
            </div>
          )}
        </div>
      </HomeSection>
    </div>
  );
}

function RecipeGrid({ picks }: { picks: RecipeVM[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {picks.map((r) => (
        <RecipeCard key={r.key} r={r} />
      ))}
    </div>
  );
}

function HomeSection({
  title,
  desc,
  to,
  children,
}: {
  title: string;
  desc?: string;
  to: string;
  children: ReactNode;
}) {
  const { t } = useLang();
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight text-fg">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-fg/55">{desc}</p>}
        </div>
        <Link to={to} className="flex-none text-sm font-semibold text-brand-red">
          {t("seeAll")} →
        </Link>
      </div>
      {children}
    </section>
  );
}
