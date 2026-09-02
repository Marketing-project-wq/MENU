import { useEffect, useMemo, useState } from "react";
import { useRecipes, useLang } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { RecipeCard } from "../components/RecipeCard";
import { Filters, type FilterState } from "../components/Filters";
import { FilterChips } from "../components/FilterChips";
import { Spinner } from "../components/Spinner";
import { useRouter } from "../router";
import { catLabel, dietLabel } from "../lib/i18n";

// Jumlah resep yang ditampilkan per "halaman" — sisanya baru dimuat pas klik "Muat lebih banyak".
const PAGE_SIZE = 15;

/** Baca filter awal dari URL (?q=&category=&diet=) supaya link bisa dibagikan & bertahan saat refresh. */
function readFiltersFromURL(): FilterState {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      q: params.get("q") || "",
      category: params.get("category") || "",
      diet: params.get("diet") || "",
    };
  } catch {
    return { q: "", category: "", diet: "" };
  }
}

function filtersToQuery(f: FilterState): string {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.category) params.set("category", f.category);
  if (f.diet) params.set("diet", f.diet);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function BrowsePage() {
  const { official, members, loading, error } = useRecipes();
  const { lang, t } = useLang();
  const { ensure } = useSocial();
  const { navigate } = useRouter();
  const [f, setF] = useState<FilterState>(() => readFiltersFromURL());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filter aktif -> URL query param (shareable, bertahan saat refresh).
  useEffect(() => {
    navigate("/" + filtersToQuery(f), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.q, f.category, f.diet]);

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

  const activeFilterLabels: string[] = [];
  if (f.q.trim()) activeFilterLabels.push(`"${f.q.trim()}"`);
  if (f.category) activeFilterLabels.push(catLabel(f.category, lang));
  if (f.diet) activeFilterLabels.push(dietLabel(f.diet, lang));
  const hasActiveFilters = activeFilterLabels.length > 0;

  function removeFilter(key: keyof FilterState) {
    setF((prev) => ({ ...prev, [key]: "" }));
  }
  function clearAllFilters() {
    setF({ q: "", category: "", diet: "" });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">
          {t("tagline")}
        </h1>
        <p className="mt-1 text-sm text-fg/55">{t("reviewNote")}</p>
      </section>

      {/* Bilah filter -- "kaca ringan" (satu bar kecil, aman diburamkan). */}
      <div className="glass-light mb-2 rounded-2xl p-3">
        <Filters value={f} onChange={setF} categories={categories} />
      </div>

      <FilterChips value={f} onRemove={removeFilter} onClearAll={clearAllFilters} />

      {loading ? (
        <Spinner label={t("loading")} />
      ) : error && vms.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">
          <p>
            {hasActiveFilters
              ? `${t("noResultsFiltered")} (${activeFilterLabels.join(" + ")})`
              : t("noResults")}
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={clearAllFilters} className="btn-ghost mt-3">
              {t("clearAllFilters")}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-fg/40">
            {visible.length} / {filtered.length} {t("recipesWord")}
          </p>
          {/* SATU wadah kaca besar ("kaca padat") membungkus grid -- bukan per-kartu (mahal
              di scroll HP kelas menengah). Kartu di dalamnya tetap padat/opak (app-card). */}
          <div className="glass-solid rounded-2xl p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((r, i) => (
                <RecipeCard key={r.key} r={r} priority={i < 3} />
              ))}
            </div>
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
