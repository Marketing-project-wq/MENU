import { useEffect, useMemo, useRef, useState } from "react";
import { useRecipes, useLang } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { api } from "../lib/api";
import { RecipeCard } from "../components/RecipeCard";
import { Filters, type FilterState } from "../components/Filters";
import { FilterChips } from "../components/FilterChips";
import { Spinner } from "../components/Spinner";
import { useRouter } from "../router";
import { catLabel, dietLabel } from "../lib/i18n";
import { BROWSE_PAGE_SIZE } from "../lib/constants";
import type { RecipeVM } from "../lib/types";

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

  // Filter aktif -> URL query param (shareable, bertahan saat refresh).
  useEffect(() => {
    navigate("/" + filtersToQuery(f), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.q, f.category, f.diet]);

  // Kategori dropdown dari katalog resmi (sudah termuat penuh di context utk keperluan
  // lain -- detail/tersimpan -- jadi aman dipakai di sini tanpa request tambahan).
  const categories = useMemo(() => {
    const set = new Set<string>();
    official.forEach((r) => r.cat && set.add(r.cat));
    return Array.from(set).sort();
  }, [official]);

  // Peta kanonik key -> RecipeVM (slug SUDAH didisambiguasi terhadap katalog PENUH, sama
  // seperti yg dipakai DetailPage/SavedPage) -- halaman ini hanya memutuskan ITEM MANA &
  // URUTAN APA yang ditampilkan (lewat /api/menu/browse), bukan menghitung slug sendiri.
  const canonical = useMemo(() => {
    const map = new Map<string, RecipeVM>();
    buildVMs(official, members, lang).forEach((r) => map.set(r.key, r));
    return map;
  }, [official, members, lang]);

  // ---- Pagination server-side sungguhan ("Load more") ----
  const [items, setItems] = useState<RecipeVM[]>([]);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // memuat halaman pertama utk filter saat ini
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const reqId = useRef(0); // cegah race: respons lambat dari filter LAMA tak boleh timpa filter BARU

  function toVMs(res: { official: typeof official; members: typeof members }): RecipeVM[] {
    const out: RecipeVM[] = [];
    res.members.forEach((m) => {
      const vm = canonical.get(`member:${m.id}`);
      if (vm) out.push(vm);
    });
    res.official.forEach((o) => {
      const vm = canonical.get(`official:${o.id}`);
      if (vm) out.push(vm);
    });
    return out;
  }

  async function loadPage(offset: number, replace: boolean) {
    const myReq = ++reqId.current;
    if (replace) {
      setPageLoading(true);
      setPageError(null);
    } else {
      setLoadingMore(true);
    }
    try {
      const res = await api.browse({
        q: f.q.trim() || undefined,
        category: f.category || undefined,
        diet: f.diet || undefined,
        lang,
        offset,
        limit: BROWSE_PAGE_SIZE,
      });
      if (myReq !== reqId.current) return; // respons basi (filter sudah ganti lagi)
      const vms = toVMs(res);
      setItems((prev) => (replace ? vms : [...prev, ...vms]));
      setTotal(res.total);
      setHasMore(res.has_more);
      setNextOffset(res.next_offset);
      setPageError(null);
    } catch (e: any) {
      if (myReq !== reqId.current) return;
      setPageError(e?.message || t("loadMoreFailed"));
      if (replace) setItems([]);
    } finally {
      if (myReq !== reqId.current) return;
      setPageLoading(false);
      setLoadingMore(false);
    }
  }

  // Filter/pencarian berubah -> reset ke halaman pertama (bukan nambah di bawah filter lama).
  // Pencarian teks di-debounce dikit supaya tak nembak request tiap ketikan.
  useEffect(() => {
    if (canonical.size === 0 && loading) return; // tunggu katalog penuh termuat dulu (utk resolusi slug)
    const t2 = setTimeout(() => {
      loadPage(0, true);
    }, f.q ? 300 : 0);
    return () => clearTimeout(t2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.q, f.category, f.diet, canonical, loading]);

  // Muat jumlah heart (+ state user) hanya utk resep yang benar-benar terlihat — di-batch & dedupe di store.
  useEffect(() => {
    if (items.length) ensure(items.map((r) => ({ source: r.source, id: r.id })));
  }, [items, ensure]);

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

      {loading || pageLoading ? (
        <Spinner label={t("loading")} />
      ) : error && items.length === 0 && !pageError ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">{error}</div>
      ) : items.length === 0 && pageError ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">
          <p className="text-brand-red">{pageError}</p>
          <button type="button" onClick={() => loadPage(0, true)} className="btn-ghost mt-3">
            {t("retry")}
          </button>
        </div>
      ) : items.length === 0 ? (
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
            {items.length} / {total} {t("recipesWord")}
          </p>
          {/* SATU wadah kaca besar ("kaca padat") membungkus grid -- bukan per-kartu (mahal
              di scroll HP kelas menengah). Kartu di dalamnya tetap padat/opak (app-card). */}
          <div className="glass-solid rounded-2xl p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((r, i) => (
                <RecipeCard key={r.key} r={r} priority={i < 3} />
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            {pageError && <p className="text-sm text-brand-red">{pageError}</p>}
            {hasMore ? (
              <button
                type="button"
                className="btn-ghost disabled:opacity-50"
                disabled={loadingMore}
                onClick={() => loadPage(nextOffset, false)}
              >
                {loadingMore ? t("loading") : pageError ? t("retry") : t("loadMore")}
              </button>
            ) : (
              <p className="text-xs text-fg/40">{t("allShown")}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
