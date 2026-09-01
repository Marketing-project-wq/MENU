import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useSocial } from "../lib/social";
import { useLang } from "../lib/store";
import { setPendingSave } from "../lib/pendingSave";
import { ShareMenu } from "./ShareMenu";
import type { Source } from "../lib/types";

/**
 * Bar aksi resep: Suka (heart), Simpan, Bagikan, Cetak.
 * Suka BEBAS tanpa login (sesi anonim di server). Simpan butuh login (guest -> ajakan masuk/daftar).
 * Jumlah heart dari server, tak bisa dicurangi client.
 */
export function ActionBar({ source, id, name }: { source: Source; id: string; name: string }) {
  const { t } = useLang();
  const { isAuthenticated, login } = useAuth();
  const { count, reacted, saved, ensure, toggleReact, toggleSave } = useSocial();
  const [needLogin, setNeedLogin] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    ensure([{ source, id }]);
  }, [source, id, ensure]);

  const liked = reacted(source, id);
  const isSaved = saved(source, id);
  const n = count(source, id);

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      // Ingat resep ini -- begitu dia balik login/daftar, langsung tersimpan otomatis
      // (lihat lib/auth.tsx), tak perlu mencari ulang.
      setPendingSave({ source, id });
      setNeedLogin(true);
      return;
    }
    void toggleSave(source, id).catch(() => {});
  };

  return (
    <div className="no-print">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void toggleReact(source, id).catch(() => {})}
          aria-pressed={liked}
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition " +
            (liked
              ? "border-brand-red bg-brand-red/10 text-brand-red"
              : "border-fg/15 text-fg/70 hover:border-brand-red/50 hover:text-brand-red")
          }
        >
          <Heart filled={liked} />
          <span>{n}</span>
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          aria-pressed={isSaved}
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition " +
            (isSaved
              ? "border-brand-red bg-brand-red/10 text-brand-red"
              : "border-fg/15 text-fg/70 hover:border-brand-red/50 hover:text-brand-red")
          }
        >
          <Bookmark filled={isSaved} />
          <span>{isSaved ? t("saved") : t("save")}</span>
        </button>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-fg/15 px-3 py-1.5 text-sm font-semibold text-fg/70 transition hover:border-fg/30"
        >
          <ShareIcon />
          <span>{t("share")}</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border border-fg/15 px-3 py-1.5 text-sm font-semibold text-fg/70 transition hover:border-fg/30"
        >
          <PrinterIcon />
          <span>{t("print")}</span>
        </button>
      </div>

      {needLogin && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
          <span>{t("loginToInteract")}</span>
          <button type="button" onClick={() => login("in")} className="font-bold underline">
            {t("login")}
          </button>
          <span aria-hidden>·</span>
          <button type="button" onClick={() => login("up")} className="font-bold underline">
            {t("signUp")}
          </button>
        </div>
      )}

      {shareOpen && (
        <ShareMenu url={window.location.href} title={name} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
function Bookmark({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
function PrinterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
