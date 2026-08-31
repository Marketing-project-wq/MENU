import { useEffect, useMemo } from "react";
import { useRouter, recipeHref } from "../router";
import { useRecipes, useLang } from "../lib/store";
import { buildVMs } from "../lib/normalize";
import { Spinner } from "../components/Spinner";
import { RecipeNotFound } from "../components/RecipeNotFound";

/**
 * Menangani URL resep lama /resep/{source}/{id} (sudah tersebar sebelum slug nama
 * dipakai) — cari resepnya, lalu redirect (replace, bukan push) ke /resep/{slug}
 * supaya link lama tidak 404 dan riwayat browser tidak menumpuk URL lama.
 */
export function LegacyDetailRedirect({ source, id }: { source: string; id: string }) {
  const { official, members, loading } = useRecipes();
  const { lang, t } = useLang();
  const { navigate } = useRouter();

  const recipe = useMemo(() => {
    if (loading) return undefined;
    return buildVMs(official, members, lang).find((r) => r.source === source && r.id === id);
  }, [official, members, lang, loading, source, id]);

  useEffect(() => {
    if (recipe) navigate(recipeHref(recipe.slug), { replace: true });
  }, [recipe, navigate]);

  if (loading) return <Spinner label={t("loading")} />;
  if (!recipe) return <RecipeNotFound />;
  return <Spinner label={t("loading")} />; // ditemukan — redirect ke slug baru sedang berjalan
}
