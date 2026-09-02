import { useEffect, useMemo, useState } from "react";
import { useLang, useRecipes } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { api } from "../lib/api";
import { RecipeCard } from "../components/RecipeCard";
import { Spinner } from "../components/Spinner";
import { catLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

/**
 * Halaman "Eat Now" (Tahap 4): resep yang punya >=1 tautan pesan-antar aktif (dari
 * /api/menu/eat-now), dikelompokkan per kategori, + cari & filter. VM (nama/foto/kategori)
 * diambil dari katalog/published yang sudah dimuat -> reuse RecipeCard. Klik kartu -> detail,
 * di sana tombol pesan (katering + Eat Now) berada.
 */
export function EatNowPage() {
  const { official, members, loading } = useRecipes();
  const { t, lang } = useLang();
  const { ensure } = useSocial();
  const [keys, setKeys] = useState<Set<string> | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    let alive = true;
    api.eatNowKeys().then((items) => {
      if (alive) setKeys(new Set(items.map((i) => `${i.source}:${i.menu_id}`)));
    });
    return () => {
      alive = false;
    };
  }, []);

  const vms = useMemo(() => {
    if (!keys) return [];
    return buildVMs(official, members, lang).filter((r) => keys.has(`${r.source}:${r.id}`));
  }, [official, members, lang, keys]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    vms.forEach((r) => r.category && s.add(r.category));
    return Array.from(s).sort();
  }, [vms]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return vms.filter((r) => {
      if (term && !r.name.toLowerCase().includes(term)) return false;
      if (cat && r.category !== cat) return false;
      return true;
    });
  }, [vms, q, cat]);

  useEffect(() => {
    if (filtered.length) ensure(filtered.map((r) => ({ source: r.source, id: r.id })));
  }, [filtered, ensure]);

  const groups = useMemo(() => {
    const m = new Map<string, RecipeVM[]>();
    filtered.forEach((r) => {
      const key = r.category || "__other__";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    });
    return Array.from(m.entries());
  }, [filtered]);

  const isLoading = loading || keys === null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("eatNowPageTitle")}</h1>
        <p className="mt-1 text-sm text-fg/55">{t("eatNowPageSub")}</p>
      </section>

      {isLoading ? (
        <Spinner label={t("loading")} />
      ) : vms.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/60">{t("eatNowEmpty")}</div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <input
              className="field max-w-[240px]"
              placeholder={t("eatNowSearchPh")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {categories.length > 1 && (
              <select className="field w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="">{t("eatNowAllCat")}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {catLabel(c, lang)}
                  </option>
                ))}
              </select>
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="app-card p-6 text-center text-sm text-fg/60">{t("noResults")}</div>
          ) : (
            groups.map(([gkey, list]) => (
              <section key={gkey} className="mb-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-fg/60">
                  {gkey === "__other__" ? t("eatNowOther") : catLabel(gkey, lang)}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((r) => (
                    <RecipeCard key={r.key} r={r} />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
