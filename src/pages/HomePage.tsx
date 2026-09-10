import { useEffect, useMemo, useState, type ReactNode, type FormEvent } from "react";
import { Link } from "../router";
import { useRouter } from "../router";
import { useLang, useRecipes } from "../lib/store";
import { useAuth } from "../lib/auth";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { api } from "../lib/api";
import { GRABFOOD_HOME } from "../lib/constants";
import { ArticleCard } from "../components/ArticleCard";
import { RecipeCard } from "../components/RecipeCard";
import { RecipeCarousel } from "../components/RecipeCarousel";
import { FoodTypeChips } from "../components/FoodTypeChips";
import { Icon } from "../components/Icon";
import { Spinner } from "../components/Spinner";
import { pickFavorites } from "../lib/favorites";
import { getReadMinutesMap } from "../lib/readtime";
import type { ArticleSummary, RecipeVM } from "../lib/types";

// Beranda pakai DATA ASLI: artikel in-house + resep dari katalog (difilter dari tag diet
// yang benar-benar ada), plus link-out jujur ke GrabFood utk "tempat makan". Tak ada data karangan.
const HEALTHY_DIETS = ["vegetarian", "vegan", "pescatarian", "low-carb"];
const DIET_DIETS = ["high-protein", "keto", "low-carb"];
const QUICK_MAX_MINUTES = 15;

function pickByDiet(vms: RecipeVM[], diets: string[], n: number): RecipeVM[] {
  return vms.filter((r) => r.dietTypes.some((d) => diets.includes(d))).slice(0, n);
}

function pickQuick(vms: RecipeVM[], maxMin: number, n: number): RecipeVM[] {
  return vms
    .filter((r) => {
      const total = (r.prepMinutes ?? 0) + (r.cookMinutes ?? 0);
      return total > 0 && total <= maxMin;
    })
    .sort((a, b) => {
      const ta = (a.prepMinutes ?? 0) + (a.cookMinutes ?? 0);
      const tb = (b.prepMinutes ?? 0) + (b.cookMinutes ?? 0);
      return ta - tb;
    })
    .slice(0, n);
}

/** UTM supaya trafik keluar ke GrabFood bisa diukur (tanpa mengubah tujuan / tanpa scraping). */
function grabUrl(): string {
  const utm = "utm_source=recipe.20fit.id&utm_medium=home_places&utm_campaign=eat_now";
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
  const { user, isAuthenticated, login } = useAuth();
  const { navigate } = useRouter();
  const { ensure } = useSocial();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [eatNowKeys, setEatNowKeys] = useState<Set<string>>(new Set());
  const [readMins, setReadMins] = useState<Record<string, number>>({});
  const [heroQ, setHeroQ] = useState("");

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
  const quickPicks = useMemo(() => pickQuick(vms, QUICK_MAX_MINUTES, 4), [vms]);
  const favoritePicks = useMemo(() => pickFavorites(vms, 12), [vms]);
  const eatNowPicks = useMemo(
    () => vms.filter((r) => eatNowKeys.has(`${r.source}:${r.id}`)).slice(0, 4),
    [vms, eatNowKeys]
  );
  const articlePicks = articles.slice(0, 5); // "Top 5 untuk dibaca hari ini" (terbaru; API sudah urut terbaru)

  useEffect(() => {
    const list = [...favoritePicks, ...healthyPicks, ...dietPicks, ...quickPicks, ...eatNowPicks];
    if (list.length) ensure(list.map((r) => ({ source: r.source, id: r.id })));
  }, [favoritePicks, healthyPicks, dietPicks, quickPicks, eatNowPicks, ensure]);

  function handleHeroSearch(e: FormEvent) {
    e.preventDefault();
    const q = heroQ.trim();
    if (q) navigate(`/resep?q=${encodeURIComponent(q)}`);
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Hero */}
      <section className="mb-8 text-center">
        {isAuthenticated && displayName ? (
          <p className="mb-1 text-sm font-medium text-fg/55">{t("homeGreeting").replace("{name}", displayName)}</p>
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">{t("homeHeroTitle")}</h1>
        {vms.length > 0 && (
          <p className="mt-1 text-sm text-fg/45">
            {t("homeRecipeCount").replace("{n}", String(vms.length))}
          </p>
        )}

        {/* Search bar */}
        <form onSubmit={handleHeroSearch} className="mx-auto mt-4 flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg/35">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="search"
              value={heroQ}
              onChange={(e) => setHeroQ(e.target.value)}
              placeholder={t("search")}
              className="w-full rounded-xl border border-fg/10 bg-card py-2.5 pl-9 pr-3 text-sm text-fg placeholder:text-fg/35 focus:border-brand-red/40 focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            />
          </div>
          <button type="submit" className="btn-primary flex-none rounded-xl px-4 py-2.5 text-sm">
            {t("searchBtn")}
          </button>
        </form>

        <div className="mt-4">
          <FoodTypeChips vms={vms} />
        </div>
      </section>

      {/* CTA signup banner for guests */}
      {!isAuthenticated && (
        <section className="mb-8">
          <div className="app-card overflow-hidden">
            <div className="flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-left">
              <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand-red/10 text-brand-red">
                <Icon name="sparkles" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-fg">{t("homeCtaTitle")}</h3>
                <p className="mt-0.5 text-xs text-fg/55">{t("homeCtaDesc")}</p>
              </div>
              <div className="flex flex-none gap-2">
                <button type="button" onClick={() => login("up")} className="btn-primary px-4 py-2 text-sm">
                  {t("signUp")}
                </button>
                <button type="button" onClick={() => login("in")} className="btn-ghost px-4 py-2 text-sm">
                  {t("login")}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

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

          {/* Resep Cepat — siap dalam 15 menit atau kurang. */}
          {quickPicks.length > 0 && (
            <HomeSection title={t("homeQuickHeading")} desc={t("homeQuickSub")} to="/resep?sort=time-asc">
              <RecipeGrid picks={quickPicks} />
            </HomeSection>
          )}
        </>
      )}

      {/* Rekomendasi Tempat Makan — link-out JUJUR ke GrabFood + resep yang sudah dipetakan admin. */}
      <HomeSection title={t("homePlacesHeading")} desc={t("homePlacesSub")} to="/eat-now">
        <div className="app-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-fg/5 text-fg/55" aria-hidden>
              <Icon name="scooter" size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-fg">{t("placesGrabTitle")}</h3>
              <p className="mt-0.5 text-xs text-fg/55">{t("placesGrabDesc")}</p>
            </div>
            <a
              href={grabUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex flex-none items-center gap-1.5 px-4 py-2 text-sm"
            >
              {t("placesGrabBtn")}
              <Icon name="external" size={15} />
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
        <Link to={to} className="inline-flex flex-none items-center gap-1 text-sm font-semibold text-brand-red">
          {t("seeAll")}
          <Icon name="arrowRight" size={15} />
        </Link>
      </div>
      {children}
    </section>
  );
}
