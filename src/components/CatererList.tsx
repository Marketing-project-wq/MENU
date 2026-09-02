import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useLang } from "../lib/store";
import type { Caterer, Source } from "../lib/types";

/** Jarak haversine (km) antara dua titik lat/lng. */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function waLink(phone: string, text: string): string {
  const digits = phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Direktori katering pihak ketiga yang menjual resep ini -- MURNI INFORMASI, tanpa transaksi
 * lewat 20FIT (dikonfirmasi user). Urutan default: terverifikasi dulu lalu sort_order manual
 * (dari server, lihat /api/menu/:id/caterers). "Terdekat" dihitung DI SINI dari lokasi browser
 * (izin user) -- kalau ditolak, JANGAN halaman kosong: mundur ke urutan default + tawarkan
 * filter area manual. TIDAK ADA pengurutan "terpopuler" -- datanya belum cukup (baru mulai
 * dicatat lewat /api/menu/caterer-click), jadi opsi itu sengaja disembunyikan dulu.
 */
export function CatererList({ source, id }: { source: Source; id: string }) {
  const { t, lang } = useLang();
  const [caterers, setCaterers] = useState<Caterer[] | null>(null);
  const [sortNearest, setSortNearest] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [area, setArea] = useState<string>("");

  useEffect(() => {
    let alive = true;
    api.caterers(source, id).then((list) => {
      if (alive) setCaterers(list);
    });
    return () => {
      alive = false;
    };
  }, [source, id]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    (caterers || []).forEach((c) => c.area && set.add(c.area));
    return Array.from(set).sort();
  }, [caterers]);

  const visible = useMemo(() => {
    let list = caterers || [];
    if (area) list = list.filter((c) => c.area === area || c.delivery_areas?.includes(area));
    if (sortNearest && userLoc) {
      const withDist = list.map((c) => ({
        c,
        d: c.latitude != null && c.longitude != null ? distanceKm(userLoc.lat, userLoc.lng, c.latitude, c.longitude) : null,
      }));
      withDist.sort((a, b) => {
        if (a.d == null && b.d == null) return 0;
        if (a.d == null) return 1;
        if (b.d == null) return -1;
        return a.d - b.d;
      });
      return withDist;
    }
    return list.map((c) => ({ c, d: null as number | null }));
  }, [caterers, area, sortNearest, userLoc]);

  function tryNearest() {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError(t("caterersLocationDenied"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortNearest(true);
      },
      () => {
        setSortNearest(false);
        setLocError(t("caterersLocationDenied"));
      },
      { timeout: 8000 }
    );
  }

  function handleOrderClick(c: Caterer, url: string) {
    void api.trackCatererClick(c.id, source, id);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!caterers || caterers.length === 0) return null;

  return (
    <div className="glass-solid mt-6 rounded-2xl p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-fg/70">{t("caterersTitle")}</h2>
      <p className="mt-1 text-xs text-fg/50">{t("caterersDisclaimer")}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={sortNearest ? () => setSortNearest(false) : tryNearest}
          className={
            "chip border " +
            (sortNearest ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-fg/15 text-fg/70")
          }
        >
          📍 {sortNearest ? t("caterersSortNearest") : t("caterersSortDefault")}
        </button>
        {areas.length > 1 && (
          <select
            className="field w-auto max-w-[160px] py-1 text-xs"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option value="">{t("caterersAreaAll")}</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </div>
      {locError && <p className="mt-2 text-xs text-fg/50">{locError}</p>}

      <ul className="mt-3 space-y-2">
        {visible.map(({ c, d }) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl bg-card p-3">
            {c.logo_url ? (
              <img src={c.logo_url} alt={c.name} className="h-12 w-12 flex-none rounded-lg object-cover" />
            ) : (
              <div className="grid h-12 w-12 flex-none place-items-center rounded-lg bg-fg/5 text-xl" aria-hidden>
                🍱
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-fg">{c.name}</span>
                {c.is_verified && (
                  <span className="chip flex-none bg-emerald-600/10 text-[10px] text-emerald-700 dark:text-emerald-400">
                    ✓ {t("caterersVerifiedBadge")}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-fg/50">
                {[c.area, d != null ? `${d.toFixed(1)} ${t("caterersDistanceKm")}` : null].filter(Boolean).join(" · ")}
              </p>
              {(c.price != null || c.min_order != null) && (
                <p className="mt-0.5 text-xs text-fg/60">
                  {c.price != null && `Rp${c.price.toLocaleString(lang === "id" ? "id-ID" : "en-US")}`}
                  {c.portion_note ? ` (${c.portion_note})` : ""}
                  {c.min_order != null && ` · ${t("caterersMinOrder")} Rp${c.min_order.toLocaleString(lang === "id" ? "id-ID" : "en-US")}`}
                </p>
              )}
            </div>
            <div className="flex flex-none gap-1.5">
              {c.whatsapp && (
                <button
                  type="button"
                  onClick={() => handleOrderClick(c, waLink(c.whatsapp!, `Halo, saya mau pesan dari menu 20FIT.`))}
                  className="btn-ghost px-2.5 py-1.5 text-xs"
                >
                  {t("caterersWhatsappBtn")}
                </button>
              )}
              {c.order_url && (
                <button
                  type="button"
                  onClick={() => handleOrderClick(c, c.order_url!)}
                  className="btn-primary px-2.5 py-1.5 text-xs"
                >
                  {t("caterersOrderBtn")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
