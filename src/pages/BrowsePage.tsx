import { useEffect, useMemo, useState } from "react";
import { useRecipes, useLang } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { RecipeCard } from "../components/RecipeCard";
import { Filters, KCAL_RANGES, SORT_OPTIONS, type FilterState } from "../components/Filters";
import { FilterChips } from "../components/FilterChips";
import { Spinner } from "../components/Spinner";
import { useRouter } from "../router";
import { catLabel, dietLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

// Jumlah resep yang ditampilkan per "halaman" — sisanya baru dimuat pas klik "Muat lebih banyak".
const PAGE_SIZE = 15;

function readFiltersFromURL(): FilterState {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      q: params.get("q") || "",
      category: params.get("category") || "",
      diet: params.get("diet") || "",
      kcalRange: params.get("kcal") || "",
      sort: params.get("sort") || "",
    };
  } catch {
    return { q: "", category: "", diet: "", kcalRange: "", sort: "" };
  }
}

function filtersToQuery(f: FilterState): string {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.category) params.set("category", f.category);
  if (f.diet) params.set("diet", f.diet);
  if (f.kcalRange) params.set("kcal", f.kcalRange);
  if (f.sort) params.set("sort", f.sort);
  const s = params.toString();
  return s ? `?${s}` : "";
}

function applySort(list: RecipeVM[], sort: string): RecipeVM[] {
  if (!sort) return list;
  const sorted = [...list];
  switch (sort) {
    case "kcal-asc":
      return sorted.sort((a, b) => (a.kcal ?? Infinity) - (b.kcal ?? Infinity));
    case "kcal-desc":
      return sorted.sort((a, b) => (b.kcal ?? 0) - (a.kcal ?? 0));
    case "protein-desc":
      return sorted.sort((a, b) => (b.macros?.p ?? 0) - (a.macros?.p ?? 0));
    case "time-asc":
      return sorted.sort((a, b) => {
        const ta = (a.prepMinutes ?? 0) + (a.cookMinutes ?? 0) || Infinity;
        const tb = (b.prepMinutes ?? 0) + (b.cookMinutes ?? 0) || Infinity;
        return ta - tb;
      });
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

export function BrowsePage() {
  const { official, members, loading, error } = useRecipes();
  const { lang, t } = useLang();
  const { ensure } = useSocial();
  const { navigate } = useRouter();
  const [f, setF] = useState<FilterState>(() => readFiltersFromURL());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    navigate("/resep" + filtersToQuery(f), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.q, f.category, f.diet, f.kcalRange, f.sort]);

  const vms = useMemo(() => buildVMs(official, members, lang), [official, members, lang]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    vms.forEach((r) => r.category && set.add(r.category));
    return Array.from(set).sort();
  }, [vms]);

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const kcalDef = KCAL_RANGES.find((r) => r.value === f.kcalRange);
    const base = vms.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.ingredients.toLowerCase().includes(q)) return false;
      if (f.category && r.category !== f.category) return false;
      if (f.diet && !r.dietTypes.includes(f.diet)) return false;
      if (kcalDef && r.kcal != null && (r.kcal < kcalDef.min || r.kcal > kcalDef.max)) return false;
      if (kcalDef && r.kcal == null) return false;
      return true;
    });
    return applySort(base, f.sort);
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
  if (f.kcalRange) {
    const kcalDef = KCAL_RANGES.find((r) => r.value === f.kcalRange);
    if (kcalDef) activeFilterLabels.push(kcalDef.label[lang]);
  }
  if (f.sort) {
    const sortDef = SORT_OPTIONS.find((s) => s.value === f.sort);
    if (sortDef) activeFilterLabels.push(sortDef.label[lang]);
  }
  const hasActiveFilters = activeFilterLabels.length > 0;

  function removeFilter(key: keyof FilterState) {
    setF((prev) => ({ ...prev, [key]: "" }));
  }
  function clearAllFilters() {
    setF({ q: "", category: "", diet: "", kcalRange: "", sort: "" });
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
