import { useEffect, useMemo } from "react";
import { Link } from "../router";
import { useRecipes, useLang } from "../lib/store";
import { buildVMs } from "../lib/normalize";
import { SourceBadge } from "../components/SourceBadge";
import { Spinner } from "../components/Spinner";
import { FoodImage } from "../components/FoodImage";
import { ActionBar } from "../components/ActionBar";
import { IngredientGroups } from "../components/IngredientGroups";
import { StepList } from "../components/StepList";
import { CatererList } from "../components/CatererList";
import { RecipeNotFound } from "../components/RecipeNotFound";
import { api } from "../lib/api";
import { catLabel, dietLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

export function DetailPage({ slug }: { slug: string }) {
  const { official, members, loading } = useRecipes();
  const { lang, t } = useLang();

  const recipe: RecipeVM | undefined = useMemo(() => {
    const vms = buildVMs(official, members, lang);
    return vms.find((r) => r.slug === slug);
  }, [official, members, lang, slug]);

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

  if (!recipe) return <RecipeNotFound />;

  const isOfficial = recipe.source === "official";

  return (
    <article className="mx-auto max-w-5xl px-4 py-6 print-area">
      <Link to="/" className="no-print text-sm font-semibold text-fg/50 hover:text-brand-red">
        {t("backToBrowse")}
      </Link>

      <div className="mt-3 overflow-hidden app-card">
        <FoodImage
          id={recipe.id}
          photoQ={recipe.photoQ}
          photoName={recipe.photoName}
          photoUrl={recipe.photoUrl}
          emoji={recipe.emoji}
          tint={recipe.tint}
          alt={recipe.name}
          className="aspect-[4/3] w-full"
          aspectRatio="4/3"
          emojiClass="text-7xl"
          priority
          widths={[480, 768, 992]}
          sizes="(min-width: 1024px) 992px, 100vw"
        />

        <div className="p-5 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SourceBadge source={recipe.source} />
            {recipe.category && (
              <span className="chip bg-fg/5 text-fg/60">{catLabel(recipe.category, lang)}</span>
            )}
            {recipe.dietTypes.map((d) => (
              <span key={d} className="chip bg-fg/5 text-fg/60">
                {dietLabel(d, lang)}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{recipe.name}</h1>
          <p className="mt-1 text-sm text-fg/55">
            {t("byPrefix")} <span className="font-semibold text-fg/75">{recipe.creatorName}</span>
          </p>

          {(recipe.servings != null || recipe.cookMinutes != null || recipe.prepMinutes != null) && (
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-fg/60">
              {recipe.servings != null && (
                <span>
                  🍽️ {recipe.servings} {t("servings")}
                </span>
              )}
              {recipe.prepMinutes != null && (
                <span>
                  🔪 {t("prepTime")} {recipe.prepMinutes} {t("minutesShort")}
                </span>
              )}
              {recipe.cookMinutes != null && (
                <span>
                  ⏱️ {t("cookTime")} {recipe.cookMinutes} {t("minutesShort")}
                </span>
              )}
            </div>
          )}

          {(recipe.equipment || recipe.prepNote) && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-500/25 dark:bg-amber-500/10">
              {recipe.equipment && (
                <p className="text-amber-800 dark:text-amber-200">
                  <span className="font-bold">{t("equipmentLabel")}:</span> {recipe.equipment}
                </p>
              )}
              {recipe.prepNote && (
                <p className={"text-amber-800 dark:text-amber-200" + (recipe.equipment ? " mt-1.5" : "")}>
                  <span className="font-bold">{t("prepNoteLabel")}:</span> {recipe.prepNote}
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <ActionBar source={recipe.source} id={recipe.id} name={recipe.name} />
          </div>

          {/* Perkiraan gizi — SELALU ditandai perkiraan; sumber dibedakan. */}
          <div className="mt-5 rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="label mb-0">{t("nutrition")}</span>
              {recipe.kcal != null && (
                <span className="text-lg font-bold text-fg">
                  {recipe.kcal} <span className="text-xs font-medium text-fg/50">{t("calories")}</span>
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
            <p className="mt-3 text-xs italic text-fg/45">
              {isOfficial ? t("estOfficial") : t("estUser")}
            </p>
          </div>

          {/* Dua kolom: Bahan | Cara membuat -- panel "kaca padat". Di HP jadi satu kolom mengalir. */}
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.35fr] md:gap-6">
            <section className="glass-solid rounded-2xl p-4">
              <h2 className="mb-3 border-b border-fg/10 pb-2 text-sm font-bold uppercase tracking-wide text-fg/70">
                {t("ingredients")}
              </h2>
              <IngredientGroups groups={recipe.ingredientGroups} />
            </section>

            <section className="glass-solid rounded-2xl p-4">
              <h2 className="mb-3 border-b border-fg/10 pb-2 text-sm font-bold uppercase tracking-wide text-fg/70">
                {t("steps")}
              </h2>
              <StepList steps={recipe.stepList} />
              {recipe.commonMistake && (
                <p className="mt-3 rounded-lg bg-brand-red/5 p-2.5 text-xs text-fg/70">
                  <span className="font-bold text-brand-red">{t("commonMistakeLabel")}:</span> {recipe.commonMistake}
                </p>
              )}
            </section>
          </div>

          <CatererList source={recipe.source} id={recipe.id} />
        </div>
      </div>
    </article>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card py-2">
      <div className="text-[11px] uppercase tracking-wide text-fg/40">{label}</div>
      <div className="font-semibold text-fg">{value}</div>
    </div>
  );
}
