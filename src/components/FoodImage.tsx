import { useEffect, useRef, useState } from "react";
import { resolveFoodPhoto } from "../lib/foodphoto";
import { buildSrcSet, sizedUrl } from "../lib/imageTransform";

const CARD_WIDTHS = [220, 440]; // kartu daftar: ~1x & ~2x kerapatan layar di slot ~220px
const CARD_SIZES = "(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw";

/**
 * Foto makanan dengan placeholder emoji+tint. Kontribusi member pakai photoUrl (upload mereka);
 * resep resmi di-resolve lazy (IntersectionObserver) dari API my.20fit.id. Fallback ke emoji
 * kalau belum/tidak ada foto atau gambar gagal dimuat.
 *
 * Ukuran gambar: srcset+sizes minta ukuran yang PAS ke slotnya (bukan kirim foto AI 1024px penuh
 * ke kartu 150px) -- lihat lib/imageTransform. `priority` untuk kartu pertama yang langsung
 * kelihatan (above the fold): dimuat SEKARANG (bukan nunggu IntersectionObserver) + fetchpriority
 * tinggi, ~15 lainnya tetap lazy + progresif saat discroll.
 */
export function FoodImage({
  id,
  photoQ,
  photoName,
  photoUrl,
  emoji,
  tint,
  alt,
  className = "",
  emojiClass = "text-5xl",
  priority = false,
  widths = CARD_WIDTHS,
  sizes = CARD_SIZES,
  aspectRatio,
}: {
  id: string;
  photoQ?: string | null;
  photoName?: string | null;
  photoUrl?: string | null;
  emoji: string;
  tint: string;
  alt: string;
  className?: string;
  emojiClass?: string;
  priority?: boolean;
  widths?: number[];
  sizes?: string;
  /** Dipakai kalau parent TIDAK punya tinggi tetap (mis. hero detail, bukan kartu daftar) --
   *  kunci rasio lewat inline style ini, bukan cuma class Tailwind aspect-[..]. */
  aspectRatio?: string;
}) {
  const [url, setUrl] = useState<string | null>(photoUrl || null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFailed(false);
    if (photoUrl) {
      setUrl(photoUrl);
      return;
    }
    setUrl(null);
    if (!photoQ && !photoName) return;

    let alive = true;
    const el = ref.current;
    const run = () =>
      resolveFoodPhoto(id, photoQ || "", photoName || "").then((u) => {
        if (alive && u) setUrl(u);
      });

    // Kartu prioritas (langsung kelihatan) -> resolve sekarang, tak perlu nunggu scroll.
    if (priority) {
      run();
      return () => {
        alive = false;
      };
    }

    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (ents) => {
          ents.forEach((e) => {
            if (e.isIntersecting) {
              io?.disconnect();
              run();
            }
          });
        },
        { rootMargin: "300px" }
      );
      io.observe(el);
    } else {
      run();
    }
    return () => {
      alive = false;
      io?.disconnect();
    };
  }, [id, photoQ, photoName, photoUrl, priority]);

  const show = url && !failed;
  // huruf kecil semua ("fetchpriority", bukan fetchPriority) -- React 18 tak mem-forward
  // atribut kamelCase yang tak dikenalinya ke DOM, beda dgn React 19.
  const imgProps = priority
    ? { loading: "eager" as const, fetchpriority: "high" as const }
    : { loading: "lazy" as const };
  return (
    <div
      ref={ref}
      className={"flex items-center justify-center overflow-hidden " + className}
      // width/height (atau aspectRatio)/overflow inline JUGA (bukan cuma lewat class Tailwind) --
      // kalau file CSS pernah gagal termuat (mis. cache CDN nunjuk ke nama file lama yang sudah
      // tak ada di server), foto tetap kepotong pas ke framenya, bukan tampil segede aslinya.
      // aspectRatio dipakai kalau parent tak punya tinggi tetap (height:100% akan runtuh ke 0).
      style={
        aspectRatio
          ? { backgroundColor: show ? undefined : hexToTint(tint), width: "100%", aspectRatio, overflow: "hidden" }
          : { backgroundColor: show ? undefined : hexToTint(tint), width: "100%", height: "100%", overflow: "hidden" }
      }
    >
      {show ? (
        <img
          src={sizedUrl(url as string, widths[widths.length - 1])}
          srcSet={buildSrcSet(url as string, widths)}
          sizes={sizes}
          alt={alt}
          {...imgProps}
          decoding="async"
          // object-position 50% 42% (bukan tengah-tengah matematis) -- kalau frame TIDAK cocok
          // persis rasio sumbernya (mis. fallback TheMealDB yang landscape, bukan hasil AI 1:1),
          // titik yang dipertahankan sedikit di ATAS tengah, karena bagian menarik dari foto
          // makanan (piring/isi utama) biasanya ada di situ, bukan di baris paling bawah gambar.
          className="h-full w-full object-cover"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 42%" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={emojiClass} aria-hidden>
          {emoji}
        </span>
      )}
    </div>
  );
}

function hexToTint(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "rgba(0,0,0,0.05)";
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0.12)`;
}
