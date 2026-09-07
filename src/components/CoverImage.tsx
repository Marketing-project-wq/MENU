import { useState } from "react";
import { Icon, type IconName } from "./Icon";

/**
 * Cover/ilustrasi artikel dengan JARING PENGAMAN.
 *
 * Foto artikel bersumber dari URL eksternal. Kalau sebuah URL gagal muat, jangan tampilkan ikon
 * "gambar rusak" bawaan browser — ganti dengan tile ber-brand 20FIT (gradient + ikon garis
 * minimalis, bukan emoji). Ini membuat halaman tetap rapi walau ada foto yang hilang/berubah di
 * sumbernya. `icon` boleh diisi ikon kategori supaya placeholder tetap relevan dengan isinya.
 */
export function CoverImage({
  src,
  alt,
  className = "",
  icon = "note",
  iconSize = 40,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  icon?: IconName;
  iconSize?: number;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={
          className +
          " grid place-items-center bg-gradient-to-br from-brand-red/15 via-amber-100/40 to-brand-red/5 text-brand-red/50 dark:via-amber-500/10"
        }
        aria-hidden
      >
        <Icon name={icon} size={iconSize} strokeWidth={1.5} />
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
