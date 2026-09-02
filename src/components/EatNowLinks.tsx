import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useLang } from "../lib/store";
import type { DeliveryLink, Source } from "../lib/types";

function providerName(p: string): string {
  const k = (p || "").toLowerCase();
  if (k === "grabfood") return "GrabFood";
  if (k === "gofood") return "GoFood";
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : "layanan";
}

/** Tambah parameter UTM milik kita supaya trafik keluar bisa diukur (tanpa mengubah tujuan). */
function withUtm(url: string, source: Source, id: string): string {
  const utm =
    "utm_source=recepie.20fit.id&utm_medium=eat_now&utm_campaign=recipe_delivery" +
    "&utm_content=" +
    encodeURIComponent(source + ":" + id);
  return url + (url.includes("?") ? "&" : "?") + utm;
}

/**
 * "Eat Now" -> pesan-antar pihak ketiga (GrabFood dll). Menautkan ke halaman KATEGORI publik
 * mereka -- BUKAN klaim "restoran X menjual ini" (daftar restoran muncul di sisi Grab setelah
 * user memasukkan alamat). Sembunyi TOTAL kalau resep belum dipetakan admin (tak ada tombol ke
 * halaman umum yang tak relevan). Tanpa logo GrabFood (ToS belum jelas) -- pakai teks saja.
 * Katering mitra 20FIT tampil lebih dulu (CatererList) -- ini pilihan berikutnya.
 */
export function EatNowLinks({ source, id }: { source: Source; id: string }) {
  const { t } = useLang();
  const [links, setLinks] = useState<DeliveryLink[] | null>(null);

  useEffect(() => {
    let alive = true;
    api.deliveryLinks(source, id).then((l) => {
      if (alive) setLinks(l);
    });
    return () => {
      alive = false;
    };
  }, [source, id]);

  if (!links || links.length === 0) return null;

  function open(link: DeliveryLink) {
    void api.trackDeliveryClick(source, id, link.provider);
    window.open(withUtm(link.url, source, id), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="glass-solid mt-6 rounded-2xl p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-fg/70">{t("eatNowTitle")}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => {
          const prov = providerName(link.provider);
          return (
            <li key={link.id} className="rounded-xl bg-card p-3">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-fg/5 text-xl"
                  aria-hidden
                >
                  🛵
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">
                    {t("eatNowFind")} {link.label} {t("eatNowOn")} {prov}
                  </p>
                  <p className="mt-0.5 text-xs text-fg/50">
                    {t("eatNowRedirectNote").replace("{provider}", prov)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => open(link)}
                  className="btn-primary flex-none px-3 py-1.5 text-xs"
                >
                  {prov} ↗
                </button>
              </div>
              <p className="mt-2 text-[11px] text-fg/40">
                {t("eatNowThirdParty").replace("{provider}", prov)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
