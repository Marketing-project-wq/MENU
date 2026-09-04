import { useEffect, useMemo, useState } from "react";
import { useLang, useRecipes } from "../lib/store";
import { useSocial } from "../lib/social";
import { buildVMs } from "../lib/normalize";
import { RecipeCard } from "../components/RecipeCard";
import { EatNowButton } from "../components/EatNowButton";
import { Spinner } from "../components/Spinner";
import { catLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

/**
 * Halaman "Pesan Sekarang": daftar SEMUA menu (dari katalog/published yang sudah dimuat),
 * dikelompokkan per kategori + cari & filter. Tiap menu punya tombol "Eat Now" -> link ke
 * kategori GrabFood yang relevan (lihat EatNowButton/grab.ts). Klik KARTU -> detail resep.
 * (Dulu halaman ini cuma menampilkan resep yang dipetakan admin -> sering kosong; sekarang
 * menampilkan seluruh menu dengan sumber data yang sama.)
 */
export function EatNowPage() {
  const { official, members, loading } = useRecipes();
  const { t, lang } = useLang();
  const { ensure } = useSocial();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const vms = useMemo(() => buildVMs(official, members, lang), [official, members, lang]);

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("eatNowPageTitle")}</h1>
        <p className="mt-1 text-sm text-fg/55">{t("eatNowPageSub")}</p>
      </section>

      {loading ? (
        <Spinner label={t("loading")} />
      ) : (
        <>
          <div className="glass-light mb-5 flex flex-wrap gap-2 rounded-2xl p-3">
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
                    <div key={r.key} className="flex flex-col">
                      <RecipeCard r={r} />
                      <EatNowButton r={r} className="mt-2 w-full" />
                    </div>
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
