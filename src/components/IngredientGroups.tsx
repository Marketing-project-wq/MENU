import type { IngredientGroup } from "../lib/types";

/** Daftar bahan dikelompokkan (mis. "Bumbu Halus"). title null = tanpa judul kelompok. */
export function IngredientGroups({ groups }: { groups: IngredientGroup[] }) {
  if (!groups.length) return null;
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.title && (
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-red/80">
              {g.title}
            </h3>
          )}
          <ul className="space-y-1.5">
            {g.items.map((it, i) => (
              <li key={i} className="flex gap-2 text-sm text-fg/80">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-red/40" aria-hidden />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
