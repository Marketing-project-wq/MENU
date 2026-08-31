import { useState } from "react";
import { Link } from "../router";
import { useAuth } from "../lib/auth";
import { useLang } from "../lib/store";
import { api } from "../lib/api";
import { RecipeForm, emptyValues } from "../components/RecipeForm";

export function SubmitPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { t, lang } = useLang();
  const [doneId, setDoneId] = useState<string | null>(null);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-fg/60">{t("loginToSubmit")}</p>
        <button className="btn-primary mt-4" onClick={() => login("in")}>
          {t("login")}
        </button>
      </div>
    );
  }

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
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/submission-saya" className="btn-primary">
            {t("mySubmissions")}
          </Link>
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
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
        {t("reviewNote")}
      </div>
      <div className="mt-5">
        <RecipeForm
          initial={emptyValues()}
          submitLabel={t("submit")}
          onSubmit={async (body) => {
            const res = await api.submit(body);
            setDoneId(res.id ?? "ok");
          }}
        />
      </div>
    </div>
  );
}
