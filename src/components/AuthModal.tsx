import { useEffect, useState, type FormEvent } from "react";
import { useLang } from "../lib/store";
import { supabase } from "../lib/supabase";
import { Icon } from "./Icon";

export type AuthMode = "in" | "up" | "reset" | "newpw";

/**
 * Daftar / Masuk LANGSUNG di recepie.20fit.id — tanpa lompat ke my.20fit.id.
 * Akun = pool Supabase 20FIT yang sama (cpvzwqptzcxnwzfzgrmt), jadi login di sini
 * juga berlaku untuk simpan-resep, submit, dan produk 20FIT lain. Hanya email +
 * password (pilihan owner). Kalau "Confirm email" di Supabase MASIH aktif, signUp
 * tak mengembalikan session -> kita tampilkan pesan "cek email" (degradasi anggun).
 */
export function AuthModal({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Escape menutup dialog.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Ganti mode -> bersihkan pesan (email dipertahankan supaya nyaman).
  useEffect(() => {
    setErr(null);
    setNotice(null);
  }, [mode]);

  function mapErr(msg: string): string {
    const m = (msg || "").toLowerCase();
    if (m.includes("invalid login")) return t("authErrInvalidLogin");
    if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already"))
      return t("authErrExists");
    if (m.includes("password")) return t("authPwMin");
    return t("authErrGeneric");
  }

  const emailValid = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setNotice(null);
    const em = email.trim();

    if (mode !== "newpw" && !emailValid(em)) {
      setErr(t("authEmailInvalid"));
      return;
    }

    try {
      if (mode === "in") {
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email: em, password });
        if (error) return setErr(mapErr(error.message));
        onClose();
        return;
      }

      if (mode === "up") {
        if (password.length < 6) return setErr(t("authPwMin"));
        setBusy(true);
        const { data, error } = await supabase.auth.signUp({
          email: em,
          password,
          options: name.trim() ? { data: { full_name: name.trim() } } : undefined,
        });
        if (error) return setErr(mapErr(error.message));
        if (data.session) onClose(); // instant-active (Confirm email OFF) -> langsung masuk
        else setNotice(t("authConfirmSent")); // fallback kalau konfirmasi masih aktif
        return;
      }

      if (mode === "reset") {
        setBusy(true);
        // Jangan bocorkan apakah email terdaftar: pesan sama apa pun hasilnya.
        await supabase.auth.resetPasswordForEmail(em, { redirectTo: window.location.origin });
        setNotice(t("authResetSent"));
        return;
      }

      // mode === "newpw" (kembali dari link reset -> sesi recovery aktif)
      if (password.length < 6) return setErr(t("authPwMin"));
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return setErr(mapErr(error.message));
      setNotice(t("authPwUpdated"));
      window.setTimeout(onClose, 1200);
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "in"
      ? t("authSignInTitle")
      : mode === "up"
        ? t("authSignUpTitle")
        : mode === "reset"
          ? t("authResetTitle")
          : t("authNewPasswordTitle");

  const submitLabel = busy
    ? t("authProcessing")
    : mode === "in"
      ? t("authSignInBtn")
      : mode === "up"
        ? t("authSignUpBtn")
        : mode === "reset"
          ? t("authResetBtn")
          : t("authUpdatePwBtn");

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-extrabold tracking-tight text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full text-fg/50 hover:bg-fg/10"
            aria-label={t("close")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {(mode === "in" || mode === "up") && (
          <p className="mt-1 text-[13px] leading-5 text-fg/55">{t("authWelcome")}</p>
        )}
        {mode === "reset" && <p className="mt-1 text-[13px] leading-5 text-fg/55">{t("authResetIntro")}</p>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === "up" && (
            <div>
              <label className="label mb-1 block">{t("authName")}</label>
              <input
                className="field w-full"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("authNamePlaceholder")}
                autoComplete="name"
              />
            </div>
          )}

          {mode !== "newpw" && (
            <div>
              <label className="label mb-1 block">{t("authEmail")}</label>
              <input
                className="field w-full"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          )}

          {mode !== "reset" && (
            <div>
              <label className="label mb-1 block">
                {mode === "newpw" ? t("authNewPassword") : t("authPassword")}
              </label>
              <div className="relative">
                <input
                  className="field w-full pr-16"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto h-7 rounded-md px-2 text-xs font-semibold text-fg/60 hover:bg-fg/10"
                >
                  {showPw ? t("authHidePw") : t("authShowPw")}
                </button>
              </div>
            </div>
          )}

          {err && (
            <p className="rounded-lg bg-brand-red/10 px-3 py-2 text-[13px] font-medium text-brand-red" role="alert">
              {err}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
              {notice}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {submitLabel}
          </button>
        </form>

        {/* Tautan navigasi antar-mode */}
        <div className="mt-4 flex flex-col items-center gap-2 text-[13px]">
          {mode === "in" && (
            <>
              <button type="button" className="font-semibold text-brand-red hover:underline" onClick={() => onModeChange("up")}>
                {t("authToSignUp")}
              </button>
              <button type="button" className="text-fg/55 hover:text-fg hover:underline" onClick={() => onModeChange("reset")}>
                {t("authForgot")}
              </button>
            </>
          )}
          {mode === "up" && (
            <button type="button" className="font-semibold text-brand-red hover:underline" onClick={() => onModeChange("in")}>
              {t("authToSignIn")}
            </button>
          )}
          {mode === "reset" && (
            <button type="button" className="text-fg/55 hover:text-fg hover:underline" onClick={() => onModeChange("in")}>
              {t("authBackToSignIn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
