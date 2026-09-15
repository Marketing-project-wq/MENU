import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/store";
import { api } from "../lib/api";
import { getSessionTokens } from "../lib/supabase";
import { URLS } from "../lib/constants";
import { Spinner } from "../components/Spinner";

type Gate = "checking" | "guest" | "denied" | "granted";

/**
 * Pintu /admin di recepie.20fit.id — BUKAN CMS-nya, tapi GERBANG ke CMS my.20fit.id yang
 * sudah ada (approve/reject menu, tulis artikel, dll). Prinsip:
 *
 *  - Role dicek SERVER-SIDE: GET /api/admin/me -> requireAdmin di my.20fit (Bearer token,
 *    lookup my20fit_admin_roles). UI ini hanya menampilkan hasilnya, tidak menentukan akses.
 *  - Non-admin -> "akses ditolak" (halaman CMS tak pernah kebuka dari sini).
 *  - Admin -> hand-off SSO: sesi Supabase yang SAMA di-seat di my.20fit lewat URL fragment (#),
 *    lalu admin masuk ke CMS dalam keadaan sudah login. Nol perubahan backend.
 */
export function AdminGate() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { t } = useLang();
  const [gate, setGate] = useState<Gate>("checking");
  const [role, setRole] = useState<string>("");
  const openedRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      setGate("checking");
      return;
    }
    if (!isAuthenticated) {
      setGate("guest");
      return;
    }
    let alive = true;
    setGate("checking");
    api
      .adminMe()
      .then((me) => {
        if (alive) {
          setRole(me.role || "");
          setGate("granted");
        }
      })
      .catch(() => {
        // 401/403 (bukan admin) atau error jaringan -> tolak. Gerbang tetap tertutup.
        if (alive) setGate("denied");
      });
    return () => {
      alive = false;
    };
  }, [isAuthenticated, isLoading]);

  async function openCms() {
    // Hand-off SSO: my.20fit meng-seat sesi yang SAMA dari URL fragment
    // (#access_token&refresh_token) — token TAK pernah terkirim ke server / tak masuk log dan
    // langsung di-strip di sana (Supabase detectSessionInUrl). Pola SAMA dengan SSO 20FIT lain
    // (menu/calories/photo). Kalau sesi tak terbaca -> URL polos (my.20fit minta login admin
    // sendiri). Target /admin-dashboard: redirect server (302) mempertahankan fragment ke
    // halaman CMS, sementara /admin (client redirect) akan membuang fragment.
    const tok = await getSessionTokens();
    const url = tok
      ? `${URLS.ADMIN_CMS}#access_token=${encodeURIComponent(tok.access_token)}&refresh_token=${encodeURIComponent(
          tok.refresh_token
        )}`
      : URLS.ADMIN_CMS;
    window.location.assign(url);
  }

  // Auto hand-off SEKALI begitu terverifikasi admin. Tombol manual tetap ada sbg cadangan
  // (mis. kalau assign ke-blok atau user balik pakai tombol Back).
  useEffect(() => {
    if (gate === "granted" && !openedRef.current) {
      openedRef.current = true;
      void openCms();
    }
  }, [gate]);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-6 text-center">
        {gate === "checking" && <Spinner label={t("adminChecking")} />}

        {gate === "guest" && (
          <>
            <h1 className="text-lg font-bold text-fg">{t("adminGateTitle")}</h1>
            <p className="mt-2 text-sm text-fg/60">{t("adminGuestBody")}</p>
            <div className="mt-5 flex justify-center">
              <button className="btn-primary" onClick={() => login("in")}>
                {t("login")}
              </button>
            </div>
          </>
        )}

        {gate === "denied" && (
          <>
            <h1 className="text-lg font-bold text-fg">{t("adminDeniedTitle")}</h1>
            <p className="mt-2 text-sm text-fg/60">{t("adminDeniedBody")}</p>
            <a className="btn-ghost mt-5" href="/">
              {t("adminBackHome")}
            </a>
          </>
        )}

        {gate === "granted" && (
          <>
            <h1 className="text-lg font-bold text-fg">
              {t("adminGrantedTitle")}
              {role ? ` · ${role}` : ""}
            </h1>
            <p className="mt-2 text-sm text-fg/60">{t("adminOpening")}</p>
            <div className="mt-4">
              <Spinner />
            </div>
            <button className="btn-primary mt-3" onClick={() => void openCms()}>
              {t("adminOpenCms")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
