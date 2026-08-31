import { useLang } from "../lib/store";
import { catLabel, dietLabel } from "../lib/i18n";
import { DIET_TYPES } from "../lib/constants";

export interface FilterState {
  q: string;
  category: string;
  diet: string;
}

export function Filters({
  value,
  onChange,
  categories,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  categories: string[];
}) {
  const { t, lang } = useLang();
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        className="field sm:max-w-xs"
        placeholder={t("search")}
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        aria-label={t("search")}
      />
      <select
        className="field sm:max-w-[200px]"
        value={value.category}
        onChange={(e) => onChange({ ...value, category: e.target.value })}
        aria-label={t("allCategories")}
      >
        <option value="">{t("allCategories")}</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {catLabel(c, lang)}
          </option>
        ))}
      </select>
      <select
        className="field sm:max-w-[200px]"
        value={value.diet}
        onChange={(e) => onChange({ ...value, diet: e.target.value })}
        aria-label={t("allDiets")}
      >
        <option value="">{t("allDiets")}</option>
        {DIET_TYPES.map((d) => (
          <option key={d} value={d}>
            {dietLabel(d, lang)}
          </option>
        ))}
      </select>
    </div>
  );
}
