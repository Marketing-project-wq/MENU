import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useLang } from "../lib/store";
import type { DeliveryLink, Source } from "../lib/types";

const PROVIDER_LABEL: Record<DeliveryLink["provider"], string> = {
  grabfood: "GrabFood",
  gofood: "GoFood",
};

/** Tambah parameter UTM kita ke URL keluar (utk ukur trafik keluar) -- pakai URL API supaya
 *  aman kalau URL tujuan sudah punya query string sendiri (mis. ?category=...). */
function withUtm(url: string, provider: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "recipe20fit");
    u.searchParams.set("utm_medium", "eatnow");
    u.searchParams.set("utm_campaign", provider);
    return u.toString();
  } catch {
    return url; // URL tak valid -- jangan pecahkan tautan, kirim apa adanya
  }
}

/**
 * "Eat Now" -- tautan biasa ke halaman kategori publik GrabFood/GoFood, BUKAN daftar
 * restoran real-time (itu baru dimuat di sisi mereka setelah user isi alamat). TANPA
 * API/scraping. Disembunyikan SELURUHNYA kalau resep belum dipetakan (bukan tombol ke
 * halaman umum yang tak relevan). Ditampilkan SETELAH katering mitra 20FIT (CatererList) --
 * mitra sendiri didahulukan krn kita dapat komisi dari situ, GrabFood/GoFood murni
 * mengirim trafik keluar tanpa apa-apa buat kita.
 */
export function EatNowSection({ source, id }: { source: Source; id: string }) {
  const { t, lang } = useLang();
  const [links, setLinks] = useState<DeliveryLink[] | null>(null);

  useEffect(() => {
    let alive = true;
    api.deliveryLinks(source, id).then((list) => {
      if (alive) setLinks(list);
    });
    return () => {
      alive = false;
    };
  }, [source, id]);

  if (!links || links.length === 0) return null;

  function handleClick(link: DeliveryLink) {
    void api.trackDeliveryClick(link.provider, source, id);
  }

  return (
    <div className="glass-solid mt-6 rounded-2xl p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-fg/70">{t("eatNowTitle")}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.id} className="rounded-xl bg-card p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">
                  {t("eatNowSearchPrefix")} <span className="text-brand-red">{link.label}</span> {lang === "id" ? "di" : "on"}{" "}
                  {PROVIDER_LABEL[link.provider]}
                </p>
                <p className="mt-0.5 text-xs text-fg/50">{t("eatNowGrabfoodHint")}</p>
              </div>
              <a
                href={withUtm(link.url, link.provider)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleClick(link)}
                className="btn-ghost flex-none px-3 py-1.5 text-xs"
              >
                {PROVIDER_LABEL[link.provider]} →
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs italic text-fg/40">{t("eatNowDisclaimer")}</p>
    </div>
  );
}
