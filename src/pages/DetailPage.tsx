import { useEffect, useMemo, type ReactNode } from "react";
import { Link } from "../router";
import { useRecipes, useLang } from "../lib/store";
import { buildVMs } from "../lib/normalize";
import { SourceBadge } from "../components/SourceBadge";
import { Spinner } from "../components/Spinner";
import { api } from "../lib/api";
import { catLabel, dietLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function DetailPage({ routeKey }: { routeKey: string }) {
  const { official, members, loading } = useRecipes();
  const { lang, t } = useLang();

  const recipe: RecipeVM | undefined = useMemo(() => {
    const vms = buildVMs(official, members, lang);
    return vms.find((r) => r.key === routeKey);
  }, [official, members, lang, routeKey]);

  // Best-effort: catat buka detail (sinyal minat) — hanya sekali per resep.
  useEffect(() => {
    if (!recipe) return;
    api.logOpen({
      menu_id: recipe.id,
      name: recipe.name,
      types: recipe.dietTypes,
      cat: recipe.category || undefined,
      kcal: recipe.kcal,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.key]);

  if (loading) return <Spinner label={t("loading")} />;

  if (!recipe) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-sm text-black/60">404 — {t("notFound")}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-semibold text-brand-red">
          {t("backToBrowse")}
        </Link>
      </div>
    );
  }

  const isOfficial = recipe.source === "official";

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/" className="text-sm font-semibold text-black/50 hover:text-brand-red">
        {t("backToBrowse")}
      </Link>

      <div className="mt-3 overflow-hidden app-card">
        <div
          className="flex h-52 items-center justify-center"
          style={{ backgroundColor: recipe.photoUrl ? undefined : tint(recipe.tint) }}
        >
          {recipe.photoUrl ? (
            <img src={recipe.photoUrl} alt={recipe.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-7xl" aria-hidden>
              {recipe.emoji}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SourceBadge source={recipe.source} />
            {recipe.category && (
              <span className="chip bg-black/5 text-black/60">{catLabel(recipe.category, lang)}</span>
            )}
            {recipe.dietTypes.map((d) => (
              <span key={d} className="chip bg-black/5 text-black/60">
                {dietLabel(d, lang)}
              </span>
            ))}
          </div>

          <h1 className="text-xl font-extrabold tracking-tight text-brand-dark">{recipe.name}</h1>

          {/* Perkiraan gizi — SELALU ditandai perkiraan; sumber dibedakan. */}
          <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="label mb-0">{t("nutrition")}</span>
              {recipe.kcal != null && (
                <span className="text-lg font-bold text-brand-dark">
                  {recipe.kcal}{" "}
                  <span className="text-xs font-medium text-black/50">{t("calories")}</span>
                </span>
              )}
            </div>
            {recipe.macros && (
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <Macro label={t("protein")} value={`${recipe.macros.p} g`} />
                <Macro label={t("carbs")} value={`${recipe.macros.c} g`} />
                <Macro label={t("fat")} value={`${recipe.macros.f} g`} />
              </div>
            )}
            <p className="mt-3 text-xs italic text-black/45">
              {isOfficial ? t("estOfficial") : t("estUser")}
            </p>
          </div>

          <Section title={t("ingredients")}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-black/75">
              {lines(recipe.ingredients).map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("steps")}>
            <div className="space-y-1.5 whitespace-pre-line text-sm leading-relaxed text-black/75">
              {recipe.steps}
            </div>
          </Section>
        </div>
      </div>
    </article>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white py-2">
      <div className="text-[11px] uppercase tracking-wide text-black/40">{label}</div>
      <div className="font-semibold text-brand-dark">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-black/70">{title}</h2>
      {children}
    </section>
  );
}

function tint(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#f0ede5";
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0.12)`;
}
