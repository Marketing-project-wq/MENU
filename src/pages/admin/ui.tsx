import type { ButtonHTMLAttributes, ReactNode } from "react";

// Primitif UI CMS — meniru gaya admin-v2 my.20fit.id (judul Barlow Condensed kapital, isi Manrope,
// pill bulat, tombol kapital kecil, kartu bersudut lembut). Warna dari token tema situs
// (bg/card/fg + brand-red) supaya Terang/Gelap ikut otomatis.

export const ADMIN_BODY_FONT = { fontFamily: '"Manrope", system-ui, -apple-system, "Segoe UI", sans-serif' };
export const HEAD = "font-['Barlow_Condensed'] uppercase tracking-[0.06em]";

type BtnVariant = "primary" | "outline" | "ghost" | "danger";

export function Btn({
  variant = "outline",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md"; children: ReactNode }) {
  const base = `${HEAD} inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50`;
  const sz = size === "sm" ? "h-7 px-3 text-[11px]" : "h-9 px-4 text-[12px]";
  const v: Record<BtnVariant, string> = {
    primary: "bg-brand-red text-white hover:bg-[#a30d01]",
    outline: "border border-fg/15 bg-card text-fg hover:border-fg/40",
    ghost: "text-fg/60 hover:bg-fg/5 hover:text-fg",
    danger: "border border-brand-red/30 bg-card text-brand-red hover:bg-brand-red/10",
  };
  return (
    <button type="button" className={`${base} ${sz} ${v[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Pill bersegmen (ID|EN, TERANG|GELAP, filter periode) — yang aktif putih + teks merah. */
export function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-0.5 rounded-full bg-fg/[0.06] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`${HEAD} h-7 rounded-full px-3 text-[11px] font-bold transition-colors ${
            value === o.value ? "bg-card text-brand-red shadow-sm" : "text-fg/55 hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Tab bergaris bawah merah (RESEP OFFICIAL | KONTRIBUSI MEMBER | EAT NOW). */
export function Tabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; badge?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-fg/10">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`${HEAD} relative -mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] font-bold transition-colors ${
            value === o.value ? "border-brand-red text-brand-red" : "border-transparent text-fg/60 hover:text-fg"
          }`}
        >
          {o.label}
          {!!o.badge && (
            <span className="rounded-full bg-brand-red px-1.5 py-px text-[10px] leading-4 text-white">{o.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Tag({ children, tone = "mute" }: { children: ReactNode; tone?: "mute" | "live" | "off" | "warn" }) {
  const t = {
    mute: "text-fg/60",
    live: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    off: "bg-fg/10 text-fg/55",
    warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  }[tone];
  return (
    <span className={`${HEAD} inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${t}`}>
      {children}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={`${HEAD} mb-1 block text-[11px] font-bold text-fg/55`}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-fg/45">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-fg/15 bg-card px-3 py-2 text-[13px] text-fg outline-none transition placeholder:text-fg/35 focus:border-brand-red/60 focus:ring-2 focus:ring-brand-red/10";

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  const t = {
    info: "border-fg/10 bg-fg/[0.03] text-fg/70",
    error: "border-brand-red/25 bg-brand-red/[0.06] text-brand-red",
    ok: "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300",
  }[tone];
  return <div className={`rounded-xl border px-3.5 py-2.5 text-[12.5px] leading-relaxed ${t}`}>{children}</div>;
}
