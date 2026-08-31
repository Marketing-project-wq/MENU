import { Link } from "../router";
import { useLang } from "../lib/store";

export function RecipeNotFound() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-center">
      <p className="text-sm text-fg/60">404 — {t("notFound")}</p>
      <Link to="/" className="mt-3 inline-block text-sm font-semibold text-brand-red">
        {t("backToBrowse")}
      </Link>
    </div>
  );
}
