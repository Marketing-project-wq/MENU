import { useMemo, useState } from "react";
import { useRecipes, useLang } from "../lib/store";
import { buildVMs } from "../lib/normalize";
import { RecipeCard } from "../components/RecipeCard";
import { Filters, type FilterState } from "../components/Filters";
import { Spinner } from "../components/Spinner";

export function BrowsePage() {
  const { official, members, loading, error } = useRecipes();
  const { lang, t } = useLang();
  const [f, setF] = useState<FilterState>({ q: "", category: "", diet: "" });

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-dark">
          {t("tagline")}
        </h1>
        <p className="mt-1 text-sm text-black/55">{t("reviewNote")}</p>
      </section>

      <div className="mb-4">
        <Filters value={f} onChange={setF} categories={categories} />
      </div>

      {loading ? (
        <Spinner label={t("loading")} />
      ) : error && vms.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-black/60">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-black/60">{t("noResults")}</div>
      ) : (
        <>
          <p className="mb-3 text-xs text-black/40">
            {filtered.length} {t("recipesWord")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((r) => (
              <RecipeCard key={r.key} r={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
