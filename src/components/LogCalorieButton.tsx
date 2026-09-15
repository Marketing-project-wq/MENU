import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/store";
import { logToCalories } from "../lib/calorieLog";
import type { Nutrients } from "../lib/types";

/**
 * "Tambah ke kalori harianku" — kirim kcal + makro yang SUDAH diskalakan sesuai porsi terpilih ke
 * tracker Calories 20FIT (`my20fit_daily_log.cal_items`, lihat lib/calorieLog.ts). Belum login →
 * ajakan masuk/daftar (in-place, sama seperti ActionBar). Angka = PERKIRAAN (disclaimer di blok gizi).
 */
export function LogCalorieButton({
  name,
  kcal,
  macros,
  portions,
}: {
  name: string;
  kcal: number;
  macros: Pick<Nutrients, "p" | "c" | "f"> | null;
  portions: number;
}) {
  const { t } = useLang();
  const { isAuthenticated, login } = useAuth();
  const [state, setState] = useState<"idle" | "logging" | "done" | "error">("idle");
  const [needLogin, setNeedLogin] = useState(false);

  async function handleClick() {
    setNeedLogin(false);
    if (!isAuthenticated) {
      setNeedLogin(true);
      return;
    }
    setState("logging");
    const res = await logToCalories({
      name,
      kcal,
      p: macros?.p ?? 0,
      c: macros?.c ?? 0,
      f: macros?.f ?? 0,
    });
    if (res === "ok") {
      setState("done");
      window.setTimeout(() => setState("idle"), 3500);
    } else if (res === "unauthenticated") {
      setState("idle");
      setNeedLogin(true);
    } else {
      setState("error");
    }
  }

  const label =
    state === "logging" ? t("logging") : state === "done" ? t("loggedToCalories") : t("logToCalories");

  return (
    <div className="no-print mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "logging"}
        aria-live="polite"
        className={
          "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-60 " +
          (state === "done"
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-brand-red/40 text-brand-red hover:bg-brand-red/5")
        }
      >
        {state === "done" ? <CheckIcon /> : <PlusIcon />}
        <span>{label}</span>
        {state !== "done" && state !== "logging" && (
          <span className="text-xs font-medium text-fg/45">
            · {kcal} {t("calories")} · {portions} {t("servings")}
          </span>
        )}
      </button>

      {state === "error" && (
        <p className="mt-1.5 text-xs font-medium text-brand-red" role="alert">
          {t("logCaloriesError")}
        </p>
      )}

      {needLogin && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
          <span>{t("logCaloriesLoginPrompt")}</span>
          <button type="button" onClick={() => login("in")} className="font-bold underline">
            {t("login")}
          </button>
          <span aria-hidden>·</span>
          <button type="button" onClick={() => login("up")} className="font-bold underline">
            {t("signUp")}
          </button>
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
