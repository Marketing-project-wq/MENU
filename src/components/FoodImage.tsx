import { useEffect, useRef, useState } from "react";
import { resolveFoodPhoto } from "../lib/foodphoto";

/**
 * Foto makanan dengan placeholder emoji+tint. Kontribusi member pakai photoUrl (upload mereka);
 * resep resmi di-resolve lazy (IntersectionObserver) dari API my.20fit.id. Fallback ke emoji
 * kalau belum/tidak ada foto atau gambar gagal dimuat.
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
  }, [id, photoQ, photoName, photoUrl]);

  const show = url && !failed;
  return (
    <div
      ref={ref}
      className={"flex items-center justify-center overflow-hidden " + className}
      style={{ backgroundColor: show ? undefined : hexToTint(tint) }}
    >
      {show ? (
        <img
          src={url as string}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover object-center"
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
