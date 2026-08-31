import { useEffect, useMemo, useState } from "react";
import { useRecipes, useLang } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { RecipeCard } from "../components/RecipeCard";
import { Filters, type FilterState } from "../components/Filters";
import { Spinner } from "../components/Spinner";

// Jumlah resep yang ditampilkan per "halaman" — sisanya baru dimuat pas klik "Muat lebih banyak".
const PAGE_SIZE = 15;

export function BrowsePage() {
  const { official, members, loading, error } = useRecipes();
  const { lang, t } = useLang();
  const { ensure } = useSocial();
  const [f, setF] = useState<FilterState>({ q: "", category: "", diet: "" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const vms = useMemo(() => buildVMs(official, members, lang), [official, members, lang]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    vms.forEach((r) => r.category && set.add(r.category));
    return Array.from(set).sort();
  }, [vms]);

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return vms.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (f.category && r.category !== f.category) return false;
      if (f.diet && !r.dietTypes.includes(f.diet)) return false;
      return true;
    });
  }, [vms, f]);

  // Filter/pencarian berubah -> mulai lagi dari halaman pertama.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [f]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // Muat jumlah heart (+ state user) hanya utk resep yang benar-benar terlihat — di-batch & dedupe di store.
  useEffect(() => {
    if (visible.length) ensure(visible.map((r) => ({ source: r.source, id: r.id })));
  }, [visible, ensure]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">
          {t("tagline")}
        </h1>
        <p className="mt-1 text-sm text-fg/55">{t("reviewNote")}</p>
      </section>

      <div className="mb-4">
        <Filters value={f} onChange={setF} categories={categories} />
      </div>

      {loading ? (
        <Spinner label={t("loading")} />
      ) : error && vms.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">{t("noResults")}</div>
      ) : (
        <>
          <p className="mb-3 text-xs text-fg/40">
            {visible.length} / {filtered.length} {t("recipesWord")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((r) => (
              <RecipeCard key={r.key} r={r} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                {t("loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
