import type { CSSProperties, ReactNode } from "react";

/**
 * Set ikon garis (line-icon) minimalis 20FIT — SATU sumber untuk MENGGANTIKAN semua emoji di UI
 * menu, supaya tampilan bersih & konsisten (bukan campuran emoji warna-warni bawaan OS yang
 * berbeda-beda di tiap perangkat).
 *
 * Prinsip: semua stroke `currentColor` (ikut warna teks di sekitarnya), viewBox 24, tanpa fill
 * (kecuali titik kecil), stroke membulat. TIDAK memakai dependency luar (registry npm diblok
 * kebijakan org) — di-inline supaya ringan, aman, dan seragam.
 *
 * Dipakai lewat <Icon name="clock" /> — ukuran & warna diatur lewat prop `size` / className.
 */

export type IconName =
  | "servings"
  | "utensils"
  | "knife"
  | "clock"
  | "scooter"
  | "external"
  | "arrowLeft"
  | "arrowRight"
  | "arrowUp"
  | "arrowDown"
  | "pin"
  | "check"
  | "close"
  | "sun"
  | "moon"
  | "note"
  | "leaf"
  | "sprout"
  | "apple"
  | "activity"
  | "scale"
  | "lunchbox"
  | "pot"
  | "sparkles"
  | "fish"
  | "drumstick"
  | "steak"
  | "bowlRice"
  | "noodles"
  | "salad"
  | "store"
  | "whatsapp"
  | "telegram"
  | "facebook"
  | "xSocial";

// Isi tiap ikon (elemen anak <svg>). Digambar sesederhana mungkin supaya tetap terbaca di 16-20px.
const PATHS: Record<IconName, ReactNode> = {
  // — meta resep —
  servings: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  utensils: (
    <>
      <path d="M6 3v5a2 2 0 0 0 4 0V3" />
      <path d="M8 10v11" />
      <path d="M17 3c-1.3 1.3-2 3.4-2 6 0 1.9 1 2.8 2 2.8V21" />
    </>
  ),
  knife: (
    <>
      <path d="M4 20l7-7" />
      <path d="M11 13l5.5-6.5C17.4 5.4 19 5 20 6s.6 2.6-.5 3.6L13 15z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.2 1.8" />
    </>
  ),
  scooter: (
    <>
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M9 17.5h6" />
      <path d="M15 17.5 12 8H9" />
      <path d="M12 8h4l3 5" />
      <path d="M16 6h3" />
    </>
  ),
  // — panah / navigasi —
  external: (
    <>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H6" />
      <path d="M12 6l-6 6 6 6" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h13" />
      <path d="M12 6l6 6-6 6" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V6" />
      <path d="M6 12l6-6 6 6" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 5v13" />
      <path d="M6 12l6 6 6-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21c4.5-4.2 7-7.6 7-11a7 7 0 1 0-14 0c0 3.4 2.5 6.8 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  check: <path d="M5 12.5 10 17.5 19.5 7" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  // — header / tema —
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2 6 6M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5Z" />,
  note: (
    <>
      <path d="M6.5 3h7L18 7.5V21H6.5Z" />
      <path d="M13.5 3v5H18" />
      <path d="M9 12.5h6M9 16h6" />
    </>
  ),
  // — kategori artikel & tipe makanan —
  leaf: (
    <>
      <path d="M4 20C4 12 10.5 5.5 20 5.5c0 9.5-6.5 15.5-16 14.5Z" />
      <path d="M4.5 19.5C8 15 12 12.5 17 11" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13c-3.5 0-5-2-5-5 3.2 0 5 1.6 5 5Z" />
      <path d="M12 12c0-3.4 1.8-5 5-5 0 3-1.5 5-5 5Z" />
    </>
  ),
  apple: (
    <>
      <path d="M12 8c-1.5-2.4-6-2.1-6 2.5 0 4 2.7 8 5 8 .5 0 1-.3 1-.8s.5.8 1 .8c2.3 0 5-4 5-8 0-4.6-4.5-4.9-6-2.5Z" />
      <path d="M12 8c0-2 1-3.2 3-3.6" />
    </>
  ),
  activity: <path d="M3 12h4l2.5-7 4.5 14 2.5-7H21" />,
  scale: (
    <>
      <path d="M12 4v16" />
      <path d="M7 20h10" />
      <path d="M6.5 7.5h11" />
      <path d="M6.5 7.5 3.5 14a3 3 0 0 0 6 0Z" />
      <path d="M17.5 7.5 14.5 14a3 3 0 0 0 6 0Z" />
    </>
  ),
  lunchbox: (
    <>
      <rect x="4" y="6" width="16" height="13" rx="2.5" />
      <path d="M4 12h16" />
      <path d="M12 6v13" />
    </>
  ),
  pot: (
    <>
      <path d="M4 10h16v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5Z" />
      <path d="M3 10h18" />
      <path d="M4 12H2.5M20 12h1.5" />
      <path d="M9 6.5 8 5M15 6.5 16 5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.6 4.8L18.5 10l-4.9 1.2L12 16l-1.6-4.8L5.5 10l4.9-1.2Z" />
      <path d="M18.5 15l.6 1.8 1.9.6-1.9.6-.6 1.8-.6-1.8-1.9-.6 1.9-.6Z" />
    </>
  ),
  fish: (
    <>
      <path d="M3 12c3.5-4.5 9-5.5 13.5-3 1.8 1 3.5 2.7 5.5 3-2 .3-3.7 2-5.5 3-4.5 2.5-10 1.5-13.5-3Z" />
      <path d="M17 9.5c1.4 1 2.4 1.5 4.5 2.5" />
      <circle cx="8" cy="10.8" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  drumstick: (
    <>
      <path d="M14 4a4 4 0 0 1 5.7 5.6c-1.3 1.5-3.4 1.8-5 1.1L7.6 18l-1.6-1.6 7.1-7.1c-.7-1.6-.4-3.8 1-5.3Z" />
      <path d="M7.6 18l-2.8 1 1-2.8" />
    </>
  ),
  steak: (
    <>
      <path d="M6 8.5C6.6 5.8 9.1 4 12 4c4 0 7 2.6 7 6.2 0 1.6-1 2.9-2.5 3.1-1.2 3.8-8 3.6-9-.4C6 12.5 5.6 10.5 6 8.5Z" />
      <circle cx="14.6" cy="9.4" r="1.5" />
    </>
  ),
  bowlRice: (
    <>
      <path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M8 9.2c.7-1 1.3-1 2 0M12.5 8.4c.7-1 1.3-1 2 0" />
    </>
  ),
  noodles: (
    <>
      <path d="M4 12.5h14a7 7 0 0 1-14 0Z" />
      <path d="M8 12.5V7M11 12.5V6M14 12.5V7" />
      <path d="M15 5l5-2M15 7.2l5-2" />
    </>
  ),
  salad: (
    <>
      <path d="M4 11.5h16a8 8 0 0 1-16 0Z" />
      <path d="M12 11.5c-1.8-2.8 1-6 3-5-.3 2.6-1.3 4-3 5Z" />
      <path d="M12 11.5C10 9 6.5 10 6.6 12" />
    </>
  ),
  store: (
    <>
      <path d="M4.5 10.5V19h15v-8.5" />
      <path d="M3 6h18l1 4a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0Z" />
      <path d="M9.5 19v-4.5h5V19" />
    </>
  ),
  // — berbagi (share) —
  whatsapp: (
    <>
      <path d="M12 21a9 9 0 1 0-8.2-5.3L3 21l5.4-.8A9 9 0 0 0 12 21Z" />
      <path d="M9.2 9c-.2 0-.5 0-.7.4-.3.4-.9 1-.9 2.2 0 1.3.9 2.6 1 2.8.2.2 1.8 3 4.5 4 .6.3 1.1.4 1.5.3.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2l-.7-.3-1-.5c-.2 0-.3-.1-.5.1l-.6.8c-.1.1-.3.2-.5.1-.3-.1-1.1-.5-1.8-1.2-.6-.6-1-1.2-1.1-1.4-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5v-.4c0-.2-.5-1.3-.7-1.7-.1-.4-.3-.3-.4-.3Z" fill="currentColor" stroke="none" />
    </>
  ),
  telegram: <path d="M21 4 3 11l5.5 2 1.5 5 2.8-3.2L18 19l3-15ZM8.5 13 18 6l-7.6 8.2" />,
  facebook: (
    <path d="M15 4h-2.4A3.6 3.6 0 0 0 9 7.6V10H6.6v3.2H9V21h3.3v-7.8h2.4l.5-3.2h-2.9V7.9c0-.6.4-1 1-1H15V4Z" />
  ),
  xSocial: (
    <>
      <path d="M5 5l14 14" />
      <path d="M19 5 5 19" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
  style,
  strokeWidth = 1.75,
  title,
}: {
  name: IconName;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
  /** Bila diisi, ikon dianggap bermakna (bukan hiasan) dan diberi <title> untuk aksesibilitas. */
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}

/** Ikon kategori artikel 20FIT — memetakan nama kategori (dari DB) ke ikon garis yang relevan.
 *  Dipakai menggantikan emoji yang dulu menempel di judul artikel. Kategori tak dikenal -> `note`. */
export function categoryIconName(category?: string | null): IconName {
  const c = (category || "").toLowerCase();
  if (c.includes("camilan") || c.includes("snack")) return "apple";
  if (c.includes("gaya hidup") || c.includes("lifestyle")) return "activity";
  if (c.includes("makan sehat") || c.includes("healthy eating")) return "salad";
  if (c.includes("diet")) return "scale";
  if (c.includes("rekomendasi menu") || c.includes("menu")) return "lunchbox";
  if (c.includes("resep") || c.includes("dapur") || c.includes("recipe") || c.includes("kitchen")) return "pot";
  if (c.includes("tempat makan") || c.includes("place")) return "pin";
  if (c.includes("gizi") || c.includes("nutrisi") || c.includes("nutrition")) return "sparkles";
  if (c.includes("tips")) return "sparkles";
  return "note";
}
