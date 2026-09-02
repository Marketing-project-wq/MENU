import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { useLang, useRecipes } from "../lib/store";
import { useSocial } from "../lib/social";
import { api, type SavedRow } from "../lib/api";
import { buildSlugMap, normalizeMember, normalizeOfficial } from "../lib/normalize";
import { RecipeCard } from "../components/RecipeCard";
import { Spinner } from "../components/Spinner";
import type { PublishedContribution, RecipeVM } from "../lib/types";

export function SavedPage() {
  const { t, lang } = useLang();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { official, members: globalMembers } = useRecipes();
  const { ensure } = useSocial();

  // Peta slug kanonik (sama persis dgn yg dipakai Browse/Detail) supaya link kartu
  // tersimpan konsisten dgn slug yang dicari DetailPage — bukan dihitung ulang dari
  // subset data getSaved() yang bisa berbeda urutan/isinya.
  const slugMap = useMemo(
    () => buildSlugMap(official, globalMembers, lang),
    [official, globalMembers, lang]
  );
  const [rows, setRows] = useState<SavedRow[] | null>(null);
  const [members, setMembers] = useState<Record<string, PublishedContribution>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    setLoading(true);
    api
      .getSaved()
      .then((res) => {
        if (!alive) return;
        setRows(res.saved);
        setMembers(res.members);
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setRows([]);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  // Muat jumlah heart utk resep tersimpan (batch, dedupe di store).
  useEffect(() => {
    if (rows && rows.length) ensure(rows.map((r) => ({ source: r.source, id: r.menu_id })));
  }, [rows, ensure]);

  if (authLoading) return <Spinner label={t("loading")} />;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-extrabold text-fg">{t("savedRecipes")}</h1>
        <p className="mt-2 text-sm text-fg/60">{t("loginToSeeSaved")}</p>
        <button onClick={() => login("in")} className="btn-primary mt-4">
          {t("login")}
        </button>
      </div>
    );
  }

  if (loading || rows === null) return <Spinner label={t("loading")} />;

  // Resolusi tiap baris tersimpan -> RecipeVM (skip yang tak tersedia lagi).
  const officialById = new Map(official.map((r) => [r.id, r]));
  const vms: RecipeVM[] = [];
  for (const row of rows) {
    if (row.source === "official") {
      const o = officialById.get(row.menu_id);
      if (o) {
        const vm = normalizeOfficial(o, lang);
        vm.slug = slugMap.get(vm.key) ?? vm.slug;
        vms.push(vm);
      }
    } else {
      const m = members[row.menu_id];
      if (m) {
        const vm = normalizeMember(m, lang);
        vm.slug = slugMap.get(vm.key) ?? vm.slug;
        vms.push(vm);
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-extrabold tracking-tight text-fg">{t("savedRecipes")}</h1>
      {vms.length === 0 ? (
        <p className="mt-6 text-sm text-fg/60">{t("emptySaved")}</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {vms.map((r) => (
            <RecipeCard key={r.key} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
