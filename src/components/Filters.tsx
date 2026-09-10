import { useLang } from "../lib/store";
import { catLabel, dietLabel } from "../lib/i18n";
import { DIET_TYPES } from "../lib/constants";

export interface FilterState {
  q: string;
  category: string;
  diet: string;
  kcalRange: string;
  sort: string;
}

export const KCAL_RANGES: { value: string; label: { id: string; en: string }; min: number; max: number }[] = [
  { value: "0-300", label: { id: "< 300 kal", en: "< 300 cal" }, min: 0, max: 300 },
  { value: "300-500", label: { id: "300–500 kal", en: "300–500 cal" }, min: 300, max: 500 },
  { value: "500-700", label: { id: "500–700 kal", en: "500–700 cal" }, min: 500, max: 700 },
  { value: "700+", label: { id: "700+ kal", en: "700+ cal" }, min: 700, max: Infinity },
];

export const SORT_OPTIONS: { value: string; label: { id: string; en: string } }[] = [
  { value: "kcal-asc", label: { id: "Kalori terendah", en: "Lowest calories" } },
  { value: "kcal-desc", label: { id: "Kalori tertinggi", en: "Highest calories" } },
  { value: "protein-desc", label: { id: "Protein tertinggi", en: "Most protein" } },
  { value: "time-asc", label: { id: "Tercepat dimasak", en: "Quickest to cook" } },
  { value: "name-asc", label: { id: "Nama A–Z", en: "Name A–Z" } },
];

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
  const activeCls = "border-brand-red/60 ring-2 ring-brand-red/10 text-brand-red";
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <input
        className={"field sm:max-w-xs" + (value.q ? " " + activeCls : "")}
        placeholder={t("search")}
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        aria-label={t("search")}
      />
      <select
        className={"field sm:max-w-[200px]" + (value.category ? " " + activeCls : "")}
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
        className={"field sm:max-w-[200px]" + (value.diet ? " " + activeCls : "")}
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
      <select
        className={"field sm:max-w-[200px]" + (value.kcalRange ? " " + activeCls : "")}
        value={value.kcalRange}
        onChange={(e) => onChange({ ...value, kcalRange: e.target.value })}
        aria-label={t("allCalories")}
      >
        <option value="">{t("allCalories")}</option>
        {KCAL_RANGES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label[lang]}
          </option>
        ))}
      </select>
      <select
        className={"field sm:max-w-[200px]" + (value.sort ? " " + activeCls : "")}
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value })}
        aria-label={t("sortBy")}
      >
        <option value="">{t("sortBy")}</option>
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}
