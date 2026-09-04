import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "../router";
import { useLang, useRecipes } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { api } from "../lib/api";
import { catLabel } from "../lib/i18n";
import { GRABFOOD_HOME } from "../lib/constants";
import { ArticleCard } from "../components/ArticleCard";
import { RecipeCard } from "../components/RecipeCard";
import { Spinner } from "../components/Spinner";
import type { ArticleSummary, RecipeVM } from "../lib/types";

// Beranda pakai DATA ASLI: artikel in-house + resep dari katalog (difilter tag diet yang benar
// ada) + kategori nyata dari katalog + link-out jujur ke GrabFood. Tak ada data karangan.
const HEALTHY_DIETS = ["vegetarian", "vegan", "pescatarian", "low-carb"]; // "makan sehat" = nabati/ringan
const DIET_DIETS = ["high-protein", "keto", "low-carb"]; // "diet" = fokus makro

// Ikon per kategori makanan (kategori mentah dari katalog). Default -> piring.
const CAT_EMOJI: Record<string, string> = {
  Rice: "🍚", Chicken: "🍗", Beef: "🥩", Seafood: "🦐", Fish: "🐟",
  Vegetarian: "🥗", Vegan: "🌱", Pasta: "🍝", Noodle: "🍜", Breakfast: "🍳",
  Snack: "🍿", Salad: "🥙", Vegetable: "🥦", Tofu: "🧈", Meatballs: "🍲", Lamb: "🐑",
};

function pickByDiet(vms: RecipeVM[], diets: string[], n: number): RecipeVM[] {
  return vms.filter((r) => r.dietTypes.some((d) => diets.includes(d))).slice(0, n);
}

/** Link-out umum ke GrabFood (+UTM). Tanpa scraping. */
function grabHomeUrl(): string {
  const utm = "utm_source=recepie.20fit.id&utm_medium=home_places&utm_campaign=grabfood";
  return GRABFOOD_HOME + (GRABFOOD_HOME.includes("?") ? "&" : "?") + utm;
}

/**
 * Home: Hero + Jenis Makanan (kategori nyata) + Artikel + Rekomendasi Makan Sehat + Rekomendasi
 * Diet + Rekomendasi Tempat Makan (GrabFood). Tiap section punya judul + deskripsi jelas.
 */
export function HomePage() {
  const { t, lang } = useLang();
  const { official, members, loading } = useRecipes();
  const { ensure } = useSocial();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    let alive = true;
    api.articles().then((a) => {
      if (alive) setArticles(a);
    });
    return () => {
      alive = false;
    };
  }, []);

  const vms = useMemo(() => buildVMs(official, members, lang), [official, members, lang]);
  const healthyPicks = useMemo(() => pickByDiet(vms, HEALTHY_DIETS, 4), [vms]);
  const dietPicks = useMemo(() => pickByDiet(vms, DIET_DIETS, 4), [vms]);
  const articlePicks = articles.slice(0, 6);

  // Kategori nyata dari katalog (urut jumlah terbanyak), utk section "Jenis Makanan".
  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    vms.forEach((r) => {
      if (r.category) m.set(r.category, (m.get(r.category) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [vms]);

  useEffect(() => {
    const list = [...healthyPicks, ...dietPicks];
    if (list.length) ensure(list.map((r) => ({ source: r.source, id: r.id })));
  }, [healthyPicks, dietPicks, ensure]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Hero */}
      <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-red/10 via-amber-100/40 to-brand-red/5 p-7 text-center dark:via-amber-500/10 sm:p-12">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-4xl">{t("homeHeroTitle")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-fg/65 sm:text-base">{t("homeHeroSub")}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/resep" className="btn-primary">{t("browseAllRecipes")}</Link>
          <Link to="/eat-now" className="btn-ghost">🛵 {t("eatNowPageTitle")}</Link>
        </div>
      </section>

      {/* #6 Jenis Makanan -- kategori nyata dari data menu. Klik -> Jelajah ter-filter. */}
      {catCounts.length > 0 && (
        <HomeSection title={t("foodTypesHeading")} desc={t("foodTypesSub")} to="/resep">
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
            {catCounts.slice(0, 12).map(([c, n]) => (
              <Link
                key={c}
                to={`/resep?category=${encodeURIComponent(c)}`}
                className="app-card flex flex-col items-center gap-1 p-3 text-center transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-2xl" aria-hidden>{CAT_EMOJI[c] || "🍽️"}</span>
                <span className="text-xs font-semibold leading-tight text-fg">{catLabel(c, lang)}</span>
                <span className="text-[10px] text-fg/40">{n} menu</span>
              </Link>
            ))}
          </div>
        </HomeSection>
      )}

      {/* Artikel */}
      {articlePicks.length > 0 && (
        <HomeSection title={t("homeArticlesHeading")} desc={t("homeArticlesSub")} to="/artikel">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {articlePicks.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </HomeSection>
      )}

      {loading && vms.length === 0 ? (
        <Spinner label={t("loading")} />
      ) : (
        <>
          {healthyPicks.length > 0 && (
            <HomeSection title={t("homeHealthyHeading")} desc={t("homeHealthySub")} to="/resep?diet=vegetarian">
              <RecipeGrid picks={healthyPicks} />
            </HomeSection>
          )}
          {dietPicks.length > 0 && (
            <HomeSection title={t("homeDietHeading")} desc={t("homeDietSub")} to="/resep?diet=high-protein">
              <RecipeGrid picks={dietPicks} />
            </HomeSection>
          )}
        </>
      )}

      {/* Rekomendasi Tempat Makan -- link-out jujur ke GrabFood. */}
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
              href={grabHomeUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-none px-4 py-2 text-sm"
            >
              {t("placesGrabBtn")} ↗
            </a>
          </div>
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
    <section className="mb-9">
      <div className="mb-3 flex items-end justify-between gap-3">
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
