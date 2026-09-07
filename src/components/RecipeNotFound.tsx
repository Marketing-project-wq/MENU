import { Link } from "../router";
import { useLang } from "../lib/store";
import { Icon } from "./Icon";

export function RecipeNotFound() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-center">
      <p className="text-sm text-fg/60">404 — {t("notFound")}</p>
      <Link to="/resep" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-red">
        <Icon name="arrowLeft" size={15} />
        {t("backToBrowse")}
      </Link>
    </div>
  );
}
