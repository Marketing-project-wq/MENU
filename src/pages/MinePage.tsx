import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/store";
import { api } from "../lib/api";
import { Spinner } from "../components/Spinner";
import { RecipeForm, type RecipeFormValues } from "../components/RecipeForm";
import { dietLabel, statusLabel } from "../lib/i18n";
import type { MineResponse, MySubmission } from "../lib/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

export function MinePage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { t, lang } = useLang();
  const [data, setData] = useState<MineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reviseId, setReviseId] = useState<string | null>(null);

  const L = (id: string, en: string) => (lang === "id" ? id : en);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setData(await api.mine());
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) load();
    else if (!isLoading) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-black/60">{t("loginToSubmit")}</p>
        <button className="btn-primary mt-4" onClick={() => login("in")}>
          {t("login")}
        </button>
      </div>
    );
  }

  if (loading) return <Spinner label={t("loading")} />;
  if (err) return <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-brand-red">{err}</div>;
  if (!data) return null;

  const toNext = data.per_cycle - data.toward_next;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-extrabold tracking-tight text-brand-dark">{t("mySubmissions")}</h1>

      {/* Progres reward */}
      <div className="mt-3 app-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-black/60">
            {L("Disetujui", "Approved")}: <b className="text-brand-dark">{data.approved}</b>
          </span>
          <span className="text-black/60">
            {L("Kredit diperoleh", "Credits earned")}: <b className="text-brand-dark">{data.credits_earned}</b>
          </span>
        </div>
        <p className="mt-2 text-xs text-black/45">
          {L(
            `${toNext} resep disetujui lagi untuk ${data.reward_scan} kredit scan berikutnya.`,
            `${toNext} more approved recipes for the next ${data.reward_scan} scan credits.`
          )}
        </p>
      </div>

      {data.submissions.length === 0 ? (
        <div className="mt-4 app-card p-6 text-center text-sm text-black/55">
          {L("Belum ada submission.", "No submissions yet.")}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {data.submissions.map((s) => (
            <li key={s.id} className="app-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-brand-dark">{s.name}</div>
                  <div className="mt-0.5 text-xs text-black/45">{dietLabel(s.diet_type, lang)}</div>
                </div>
                <span className={"chip " + (STATUS_STYLE[s.status] || "bg-black/5")}>
                  {statusLabel(s.status, lang)}
                </span>
              </div>
              {s.status === "rejected" && s.reject_reason && (
                <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                  <b>{L("Alasan", "Reason")}:</b> {s.reject_reason}
                </div>
              )}
              {s.status === "rejected" && (
                <button
                  className="btn-ghost mt-2 text-xs"
                  onClick={() => setReviseId(reviseId === s.id ? null : s.id)}
                >
                  {reviseId === s.id ? L("Tutup", "Close") : L("Revisi", "Revise")}
                </button>
              )}
              {reviseId === s.id && (
                <div className="mt-3 border-t border-black/5 pt-3">
                  <RecipeForm
                    initial={toFormValues(s)}
                    submitLabel={L("Kirim revisi", "Submit revision")}
                    onSubmit={async (body) => {
                      await api.revise(s.id, body);
                      setReviseId(null);
                      await load();
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function toFormValues(s: MySubmission): RecipeFormValues {
  return {
    name: s.name,
    diet_type: s.diet_type,
    ingredients: s.ingredients ?? "",
    steps: s.steps ?? "",
    est_kcal: s.est_kcal != null ? String(s.est_kcal) : "",
    photo_url: s.photo_url ?? null,
  };
}
