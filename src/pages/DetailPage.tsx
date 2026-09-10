import { useEffect, useMemo, useState } from "react";
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
import { EatNowLinks } from "../components/EatNowLinks";
import { EatNowButton } from "../components/EatNowButton";
import { RelatedArticles } from "../components/RelatedArticles";
import { RecipeNotFound } from "../components/RecipeNotFound";
import { Icon } from "../components/Icon";
import { api } from "../lib/api";
import { catLabel, dietLabel } from "../lib/i18n";
import type { RecipeVM } from "../lib/types";

const MIN_PORTIONS = 1;
const MAX_PORTIONS = 12;

export function DetailPage({ slug }: { slug: string }) {
  const { official, members, loading } = useRecipes();
  const { lang, t } = useLang();

  const recipe: RecipeVM | undefined = useMemo(() => {
    const vms = buildVMs(official, members, lang);
    return vms.find((r) => r.slug === slug);
  }, [official, members, lang, slug]);

  // Kontrol porsi (F1) -- basis = porsi asli resep (default 1 bila tidak diisi). Skala ANGKA
  // gizi saja (kcal/makro); teks bahan sengaja TIDAK ikut diskalakan otomatis (lihat i18n.ts).
  const baseServings = recipe?.servings ?? 1;
  const [portions, setPortions] = useState(baseServings);

  // Reset ke porsi dasar tiap ganti resep (komponen tidak remount saat slug berubah).
  useEffect(() => {
    setPortions(recipe?.servings ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.key]);

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
  const ratio = baseServings > 0 ? portions / baseServings : 1;
  const isScaled = Math.abs(ratio - 1) > 1e-9;
  const scaledKcal = recipe.kcal != null ? Math.round(recipe.kcal * ratio) : null;
  const scaledMacros = recipe.macros && {
    p: Math.round(recipe.macros.p * ratio),
    c: Math.round(recipe.macros.c * ratio),
    f: Math.round(recipe.macros.f * ratio),
    fiber: recipe.macros.fiber != null ? Math.round(recipe.macros.fiber * ratio) : undefined,
    sugar: recipe.macros.sugar != null ? Math.round(recipe.macros.sugar * ratio) : undefined,
    sodium: recipe.macros.sodium != null ? Math.round(recipe.macros.sodium * ratio) : undefined,
  };
  const scaleMultiplierNumber = parseFloat(ratio.toFixed(2));

  return (
    <article className="mx-auto max-w-5xl px-4 py-6 print-area">
      <Link
        to="/resep"
        className="no-print inline-flex items-center gap-1 text-sm font-semibold text-fg/50 hover:text-brand-red"
      >
        <Icon name="arrowLeft" size={15} />
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
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="servings" size={16} className="text-fg/45" />
                  {recipe.servings} {t("servings")}
                </span>
              )}
              {recipe.prepMinutes != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="knife" size={16} className="text-fg/45" />
                  {t("prepTime")} {recipe.prepMinutes} {t("minutesShort")}
                </span>
              )}
              {recipe.cookMinutes != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={16} className="text-fg/45" />
                  {t("cookTime")} {recipe.cookMinutes} {t("minutesShort")}
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

          {/* Pesan langsung: tombol Eat Now -> kategori GrabFood yang relevan (link, bukan scraping). */}
          <div className="mt-3">
            <EatNowButton r={recipe} size="md" />
          </div>

          {/* Perkiraan gizi — SELALU ditandai perkiraan; sumber dibedakan. */}
          <div className="mt-5 rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="label mb-0">{t("nutrition")}</span>
              {scaledKcal != null && (
                <span className="text-lg font-bold text-fg">
                  {scaledKcal} <span className="text-xs font-medium text-fg/50">{t("calories")}</span>
                </span>
              )}
            </div>

            {/* Kontrol porsi (F1) — skala ANGKA gizi di bawah saja, teks bahan TIDAK ikut berubah. */}
            {recipe.kcal != null && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2">
                <span className="text-xs font-semibold text-fg/60">{t("portionControlLabel")}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPortions((p) => Math.max(MIN_PORTIONS, p - 1))}
                    disabled={portions <= MIN_PORTIONS}
                    aria-label={t("decreasePortions")}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-fg/15 text-sm font-bold text-fg/70 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-fg">{portions}</span>
                  <button
                    type="button"
                    onClick={() => setPortions((p) => Math.min(MAX_PORTIONS, p + 1))}
                    disabled={portions >= MAX_PORTIONS}
                    aria-label={t("increasePortions")}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-fg/15 text-sm font-bold text-fg/70 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {scaledMacros && (
              <>
                <MacroProportionBar p={scaledMacros.p} c={scaledMacros.c} f={scaledMacros.f} t={t} />
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <Macro label={t("protein")} value={`${scaledMacros.p} g`} color="bg-blue-500" />
                  <Macro label={t("carbs")} value={`${scaledMacros.c} g`} color="bg-amber-400" />
                  <Macro label={t("fat")} value={`${scaledMacros.f} g`} color="bg-rose-400" />
                </div>
                {(scaledMacros.fiber != null ||
                  scaledMacros.sugar != null ||
                  scaledMacros.sodium != null) && (
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                    {scaledMacros.fiber != null && <Macro label={t("fiber")} value={`${scaledMacros.fiber} g`} />}
                    {scaledMacros.sugar != null && <Macro label={t("sugar")} value={`${scaledMacros.sugar} g`} />}
                    {scaledMacros.sodium != null && <Macro label={t("sodium")} value={`${scaledMacros.sodium} mg`} />}
                  </div>
                )}
              </>
            )}
            <p className="mt-3 text-xs italic text-fg/45">
              {isOfficial ? t("estOfficial") : t("estUser")}
              {recipe.kcal != null && " — " + t("estimateForPortions").replace("{n}", String(portions))}
            </p>
          </div>

          {/* Dua kolom: Bahan | Cara membuat -- panel "kaca padat". Di HP jadi satu kolom mengalir. */}
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.35fr] md:gap-6">
            <section className="glass-solid rounded-2xl p-4">
              <div className="mb-1 flex items-center justify-between gap-2 border-b border-fg/10 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-fg/70">
                  {t("ingredients")}
                </h2>
                {isScaled && (
                  <span
                    className="chip bg-brand-red/10 text-brand-red"
                    title={t("ingredientsScaleNote")}
                  >
                    {t("ingredientsScaleBadge").replace("{n}", String(scaleMultiplierNumber))}
                  </span>
                )}
              </div>
              {isScaled && (
                <p className="mb-3 mt-2 text-xs text-fg/50">{t("ingredientsScaleNote")}</p>
              )}
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

          {/* Katering mitra 20FIT lebih dulu, baru layanan pesan-antar (Eat Now). */}
          <CatererList source={recipe.source} id={recipe.id} />
          <EatNowLinks source={recipe.source} id={recipe.id} />
          <RelatedArticles source={recipe.source} id={recipe.id} />
        </div>
      </div>
    </article>
  );
}

function Macro({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-card py-2">
      <div className="flex items-center justify-center gap-1 text-[11px] uppercase tracking-wide text-fg/40">
        {color && <span className={`inline-block h-2 w-2 rounded-full ${color}`} />}
        {label}
      </div>
      <div className="font-semibold text-fg">{value}</div>
    </div>
  );
}

function MacroProportionBar({ p, c, f, t }: { p: number; c: number; f: number; t: (k: string) => string }) {
  const pCal = p * 4;
  const cCal = c * 4;
  const fCal = f * 9;
  const total = pCal + cCal + fCal || 1;
  const pPct = Math.round((pCal / total) * 100);
  const cPct = Math.round((cCal / total) * 100);
  const fPct = 100 - pPct - cPct;
  return (
    <div className="mt-3">
      <div className="flex h-3 overflow-hidden rounded-full">
        <div className="bg-blue-500 transition-all" style={{ width: `${pPct}%` }} title={`${t("protein")} ${pPct}%`} />
        <div className="bg-amber-400 transition-all" style={{ width: `${cPct}%` }} title={`${t("carbs")} ${cPct}%`} />
        <div className="bg-rose-400 transition-all" style={{ width: `${fPct}%` }} title={`${t("fat")} ${fPct}%`} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-fg/50">
        <span><span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1" />{t("protein")} {pPct}%</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-1" />{t("carbs")} {cPct}%</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-rose-400 mr-1" />{t("fat")} {fPct}%</span>
      </div>
    </div>
  );
}
