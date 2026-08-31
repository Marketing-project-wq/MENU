import { useLang } from "../lib/store";
import type { Source } from "../lib/types";

export function SourceBadge({ source }: { source: Source }) {
  const { t } = useLang();
  if (source === "official") {
    return (
      <span className="chip bg-brand-red/10 text-brand-red" title="Resep resmi 20FIT">
        ● {t("official")}
      </span>
    );
  }
  return (
    <span className="chip bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" title="Kontribusi member (sudah direview admin)">
      ● {t("member")}
    </span>
  );
}
