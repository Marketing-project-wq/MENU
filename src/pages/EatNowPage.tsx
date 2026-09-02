import { useEffect, useMemo, useState } from "react";
import { useRecipes, useLang } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { api } from "../lib/api";
import { RecipeCard } from "../components/RecipeCard";
import { Spinner } from "../components/Spinner";
import type { EatNowLink, RecipeVM } from "../lib/types";

/**
 * Halaman "Eat Now" khusus (Tahap 4) -- daftar SEMUA resep yang sudah dipetakan admin ke
 * GrabFood/GoFood, dikelompokkan per kategori (label pemetaan, mis. "Nasi Goreng"). Sama
 * sekali TANPA API/scraping -- link di sini persis link kategori publik yang sudah dipakai
 * di EatNowSection.tsx pada halaman detail resep, cuma dikumpulkan jadi satu halaman.
 *
 * Resolusi resep dilakukan di KLIEN (bukan server) supaya reuse penuh katalog+buildVMs()
 * yang sudah dimuat RecipesProvider -- pola sama dgn BrowsePage. Entri pemetaan yang
 * resepnya sudah tak ada di katalog (mis. kontribusi member dihapus/di-unpublish setelah
 * dipetakan) dilewati diam-diam, bukan dianggap error.
 */
export function EatNowPage() {
  const { official, members, loading } = useRecipes();
  const { lang, t } = useLang();
  const { ensure } = useSocial();

  const [links, setLinks] = useState<EatNowLink[] | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let alive = true;
    api.eatNowLinks().then((list) => {
      if (alive) setLinks(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const canonical = useMemo(() => {
    const map = new Map<string, RecipeVM>();
    buildVMs(official, members, lang).forEach((r) => map.set(r.source + ":" + r.id, r));
    return map;
  }, [official, members, lang]);

  // Kelompok kategori -> daftar resep unik (satu resep bisa muncul di >1 kategori kalau
  // dipetakan ke >1 link, mis. GrabFood + GoFood dgn label beda).
  const groups = useMemo(() => {
    if (!links) return [];
    const byLabel = new Map<string, Map<string, RecipeVM>>();
    for (const link of links) {
      const vm = canonical.get(link.source + ":" + link.menu_id);
      if (!vm) continue; // resep sudah tak ada di katalog -- lewati diam-diam
      if (!byLabel.has(link.label)) byLabel.set(link.label, new Map());
      byLabel.get(link.label)!.set(vm.key, vm);
    }
    return Array.from(byLabel.entries())
      .map(([label, vmMap]) => ({ label, recipes: Array.from(vmMap.values()) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [links, canonical]);

  const categories = useMemo(() => groups.map((g) => g.label), [groups]);

  const filteredGroups = useMemo(() => {
    const query = q.trim().toLowerCase();
    return groups
      .filter((g) => !category || g.label === category)
      .map((g) => ({
        label: g.label,
        recipes: query ? g.recipes.filter((r) => r.name.toLowerCase().includes(query)) : g.recipes,
      }))
      .filter((g) => g.recipes.length > 0);
  }, [groups, category, q]);

  const allVisible = useMemo(() => filteredGroups.flatMap((g) => g.recipes), [filteredGroups]);
  useEffect(() => {
    if (allVisible.length) ensure(allVisible.map((r) => ({ source: r.source, id: r.id })));
  }, [allVisible, ensure]);

  const isLoading = loading || links === null;
  const hasAnyMapping = groups.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("eatNowPageTitle")}</h1>
        <p className="mt-1 text-sm text-fg/55">{t("eatNowPageIntro")}</p>
      </section>

      {isLoading ? (
        <Spinner label={t("loading")} />
      ) : !hasAnyMapping ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">{t("eatNowEmptyAll")}</div>
      ) : (
        <>
          <div className="glass-light mb-5 flex flex-col gap-2 rounded-2xl p-3 sm:flex-row">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("eatNowSearchPlaceholder")}
              className="field flex-1"
              aria-label={t("eatNowSearchPlaceholder")}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field sm:w-56"
              aria-label={t("eatNowAllCategories")}
            >
              <option value="">{t("eatNowAllCategories")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="app-card p-6 text-center text-sm text-fg/60">{t("eatNowEmptyFiltered")}</div>
          ) : (
            <div className="space-y-8">
              {filteredGroups.map((g) => (
                <section key={g.label}>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fg/60">
                    {g.label}
                  </h2>
                  <div className="glass-solid rounded-2xl p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {g.recipes.map((r) => (
                        <RecipeCard key={r.key} r={r} />
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-xs italic text-fg/40">{t("eatNowDisclaimer")}</p>
        </>
      )}
    </div>
  );
}
