import { useState } from "react";

/**
 * Cover/ilustrasi artikel dengan JARING PENGAMAN.
 *
 * Foto artikel bersumber dari stok pihak ketiga (URL eksternal). Kalau sebuah URL gagal muat,
 * jangan tampilkan ikon "gambar rusak" — ganti dengan tile ber-brand 20FIT (gradient + ikon).
 * Ini membuat halaman tetap rapi walau ada foto yang hilang/berubah di sumbernya.
 */
export function CoverImage({
  src,
  alt,
  className = "",
  emoji = "🍽️",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  emoji?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={
          className +
          " grid place-items-center bg-gradient-to-br from-brand-red/20 via-amber-100/50 to-brand-red/10 text-5xl dark:via-amber-500/10"
        }
        aria-hidden
      >
        {emoji}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={className + " object-cover"}
    />
  );
}
