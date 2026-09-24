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
      {/* Lapisan FULL-BLEED (–mx-4 membatalkan padding halaman) supaya strip geser menyentuh
          tepi layar. Fade KIRI/KANAN ikut di lapisan ini -> menempel di tepi layar yang
          sebenarnya (bukan masuk 1rem), jadi kartu yang "mengintip" terlihat SENGAJA bisa
          digeser, bukan seperti kepotong. pb utk ruang bayangan kartu saat hover. */}
      <div className="relative -mx-4">
        <div
          ref={ref}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
        >
          {picks.map((r, i) => (
            <div key={r.key} role="listitem" className="w-40 flex-none snap-start sm:w-48">
              <RecipeCard r={r} priority={i < 2} />
            </div>
          ))}
        </div>

        {/* Petunjuk "masih ada lagi" — tampil di mobile & desktop. Warna = latar halaman,
            jadi kartu yang terpotong membaur mulus ke latar (bukan terlihat error terpotong). */}
        {canLeft && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[rgb(var(--bg))] to-transparent"
            aria-hidden="true"
          />
        )}
        {canRight && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[rgb(var(--bg))] to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Panah geser — DESKTOP saja (di atas fade). Mobile cukup digeser jari + fade. */}
      {canLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute -left-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-fg/10 bg-card p-2 text-fg/60 shadow-md transition hover:text-fg hover:shadow-lg sm:flex"
          aria-label="Scroll left"
        >
          <Icon name="arrowLeft" size={18} />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute -right-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-fg/10 bg-card p-2 text-fg/60 shadow-md transition hover:text-fg hover:shadow-lg sm:flex"
          aria-label="Scroll right"
        >
          <Icon name="arrowRight" size={18} />
        </button>
      )}
    </div>
  );
}
