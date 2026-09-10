import { useRef, useState, useEffect } from "react";
import { RecipeCard } from "./RecipeCard";
import { Icon } from "./Icon";
import type { RecipeVM } from "../lib/types";

export function RecipeCarousel({ picks }: { picks: RecipeVM[] }) {
  if (!picks.length) return null;
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [picks]);

  function scroll(dir: -1 | 1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <div className="group/carousel relative">
      {canLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-card p-2 shadow-md border border-fg/10 text-fg/60 hover:text-fg hover:shadow-lg transition sm:flex items-center justify-center"
          aria-label="Scroll left"
        >
          <Icon name="arrowLeft" size={18} />
        </button>
      )}
      <div
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {picks.map((r, i) => (
          <div key={r.key} role="listitem" className="w-40 flex-none snap-start sm:w-48">
            <RecipeCard r={r} priority={i < 2} />
          </div>
        ))}
      </div>
      {canRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-card p-2 shadow-md border border-fg/10 text-fg/60 hover:text-fg hover:shadow-lg transition sm:flex items-center justify-center"
          aria-label="Scroll right"
        >
          <Icon name="arrowRight" size={18} />
        </button>
      )}
      {canRight && (
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-[rgb(var(--bg))] to-transparent" />
      )}
    </div>
  );
}
