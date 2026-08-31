import type { RecipeStep } from "../lib/types";

/** Langkah cara membuat bernomor; tiap langkah bisa punya foto proses (step berfoto). */
export function StepList({ steps }: { steps: RecipeStep[] }) {
  if (!steps.length) return null;
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            {s.t && <p className="text-sm leading-relaxed text-fg/80">{s.t}</p>}
            {s.photo && (
              <img
                src={s.photo}
                alt={`Langkah ${i + 1}`}
                loading="lazy"
                className="mt-2 max-h-72 w-full rounded-xl object-cover"
              />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
