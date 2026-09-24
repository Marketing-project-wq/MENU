import { useRef, useState, useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Strip geser horizontal, FULL-BLEED (menyentuh tepi layar via -mx-4), dengan:
 *  - fade kiri/kanan berwarna latar halaman -> kartu yang mengintip di tepi membaur mulus
 *    ("geser untuk lihat lagi"), bukan seperti terpotong. Tampil di mobile & desktop.
 *  - panah geser di DESKTOP (di atas fade, z-20). Di mobile cukup digeser jari.
 *
 * Reusable: tiap anak WAJIB membawa lebar tetap sendiri + `flex-none snap-start`
 * (mis. `w-40 flex-none snap-start`). Dipakai carousel resep & artikel beranda.
 */
export function Carousel({ children, label }: { children: ReactNode; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function updateArrows() {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  // Pasang listener sekali; posisi panah/fade dihitung ulang saat isi berubah (efek kedua).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);
  useEffect(() => {
    updateArrows();
  }, [children]);

  function scroll(dir: -1 | 1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <div className="group/carousel relative">
      {/* Lapisan full-bleed: -mx-4 membatalkan padding halaman supaya strip & fade menyentuh
          tepi LAYAR yang sebenarnya. px-4 di dalam menyelaraskan kartu pertama ke gutter. */}
      <div className="relative -mx-4">
        <div
          ref={ref}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label={label}
        >
          {children}
        </div>

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
