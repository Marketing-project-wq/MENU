import { useLang } from "../lib/store";
import { catLabel, dietLabel } from "../lib/i18n";
import type { FilterState } from "./Filters";

interface ActiveFilter {
  key: keyof FilterState;
  label: string;
}

export function FilterChips({
  value,
  onRemove,
  onClearAll,
}: {
  value: FilterState;
  onRemove: (key: keyof FilterState) => void;
  onClearAll: () => void;
}) {
  const { t, lang } = useLang();

  const active: ActiveFilter[] = [];
  if (value.q.trim()) active.push({ key: "q", label: `${t("searchPrefix")}: ${value.q.trim()}` });
  if (value.category) active.push({ key: "category", label: catLabel(value.category, lang) });
  if (value.diet) active.push({ key: "diet", label: dietLabel(value.diet, lang) });

  if (active.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={t("dietType")}>
      {active.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onRemove(f.key)}
          className="chip inline-flex items-center gap-1.5 bg-brand-red/10 text-brand-red hover:bg-brand-red/15"
          aria-label={`${t("removeFilterAria")}: ${f.label}`}
        >
          <span>{f.label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ))}
      {active.length > 1 && (
        <button type="button" onClick={onClearAll} className="text-xs font-semibold text-fg/50 underline hover:text-fg">
          {t("clearAllFilters")}
        </button>
      )}
    </div>
  );
}
