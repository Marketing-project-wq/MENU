import { useEffect, useState } from "react";
import { Link } from "../router";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/store";
import { api } from "../lib/api";
import { RecipeForm, emptyValues } from "../components/RecipeForm";
import type { MineResponse, RewardConfig } from "../lib/types";

/** Catatan ajakan sumbang-resep + food scanner. Angka SELALU dari server (reward-config /
 *  mine), tak pernah hardcode -- server bisa ubah ambang/hadiah tanpa deploy frontend. */
function RewardNote({ lang, reward, mine }: { lang: "id" | "en"; reward: RewardConfig | null; mine: MineResponse | null }) {
  const L = (id: string, en: string) => (lang === "id" ? id : en);
  if (!reward) return null;

  const have = mine?.approved_published ?? 0;
  const target = reward.per_cycle;
  const pct = Math.min(100, Math.round((have / target) * 100));

  return (
    <div className="app-card mb-4 p-4">
      <p className="font-bold text-fg">
        {L(
          `Sumbang ${reward.per_cycle} resep, dapat ${reward.reward_scan} kredit scan gratis.`,
          `Contribute ${reward.per_cycle} recipes, get ${reward.reward_scan} free scanner credits.`
        )}
      </p>
      <p className="mt-1 text-sm text-fg/60">
        {L(
          "Scanner-nya membantu kamu memotret makanan dan langsung tahu kalori serta gizinya, supaya asupan harianmu lebih terjaga.",
          "The scanner lets you photograph your food and instantly see its calories and nutrition, so your daily intake stays on track."
        )}
      </p>

      {mine && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-fg/60">
            <span>{L(`${have} dari ${target} resep`, `${have} of ${target} recipes`)}</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-fg/10">
            <div className="h-full rounded-full bg-brand-red" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <p className="mt-2 text-xs italic text-fg/45">
        {L(
          "Hanya resep yang sudah disetujui admin DAN tayang yang dihitung -- resep yang masih ditinjau atau ditolak belum ikut terhitung.",
          "Only recipes that are admin-approved AND published are counted -- recipes still under review or rejected don't count yet."
        )}
      </p>
    </div>
  );
}

export function SubmitPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { t, lang } = useLang();
  const [doneId, setDoneId] = useState<string | null>(null);
  const [reward, setReward] = useState<RewardConfig | null>(null);
  const [mine, setMine] = useState<MineResponse | null>(null);

  useEffect(() => {
    api.rewardConfig().then(setReward).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) api.mine().then(setMine).catch(() => {});
  }, [isAuthenticated]);

  if (isLoading) return null;

  if (doneId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-3 text-lg font-bold text-fg">
          {lang === "id" ? "Resep terkirim!" : "Recipe submitted!"}
        </h2>
        <p className="mt-2 text-sm text-fg/60">
          {lang === "id"
            ? "Resepmu masuk antrian review admin. Belum tayang sampai disetujui."
            : "Your recipe is in the admin review queue. It won't be public until approved."}
        </p>
        {!isAuthenticated && (
          <p className="mx-auto mt-3 max-w-sm text-xs text-fg/50">
            {lang === "id"
              ? "Kamu mengirim tanpa login, jadi statusnya tak bisa dipantau dari sini. Login lain kali supaya bisa lihat progres & dapat kredit scan gratis."
              : "You submitted without logging in, so its status can't be tracked here. Log in next time to follow progress & earn free scanner credits."}
          </p>
        )}
        <div className="mt-5 flex justify-center gap-2">
          {isAuthenticated ? (
            <Link to="/submission-saya" className="btn-primary">
              {t("mySubmissions")}
            </Link>
          ) : (
            <Link to="/resep" className="btn-primary">
              {lang === "id" ? "Jelajah resep" : "Browse recipes"}
            </Link>
          )}
          <button className="btn-ghost" onClick={() => setDoneId(null)}>
            {lang === "id" ? "Kirim lagi" : "Submit another"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-extrabold tracking-tight text-fg">{t("submit")}</h1>
      <div className="mt-3">
        <RewardNote lang={lang} reward={reward} mine={mine} />
      </div>

      {/* Kirim tanpa login DIBOLEHKAN. Banner ini menjelaskan bahwa resep tetap ditinjau admin,
          dan mengajak login (OPSIONAL) demi kredit scan + pantau status. Bukan gerbang wajib. */}
      {!isAuthenticated && (
        <div className="mb-3 rounded-xl border border-fg/10 bg-fg/[0.03] p-3 text-xs text-fg/70">
          <p>
            {lang === "id"
              ? "Kamu belum login — nggak masalah, resep tetap bisa dikirim dan akan ditinjau admin dulu sebelum tayang. Login (opsional) untuk dapat kredit scan gratis & memantau status resepmu."
              : "You're not logged in — that's fine, you can still submit and an admin will review it before it goes live. Log in (optional) to earn free scanner credits & track your recipe's status."}
          </p>
          <div className="mt-2 flex gap-2">
            <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => login("in")}>
              {t("login")}
            </button>
            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => login("up")}>
              {t("signUp")}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
        {t("reviewNote")}
      </div>
      <div className="mt-5">
        <RecipeForm
          initial={emptyValues()}
          submitLabel={t("submit")}
          draftKey="menu20fit_submit_draft"
          onSubmit={async (body) => {
            const res = await api.submit(body);
            setDoneId(res.id ?? "ok");
          }}
        />
      </div>
    </div>
  );
}
