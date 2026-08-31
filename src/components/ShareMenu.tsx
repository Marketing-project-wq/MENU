import { useEffect, useState } from "react";
import { useLang } from "../lib/store";

/**
 * Popover bagikan resep: link terlihat + tombol salin, tombol share langsung
 * ke WhatsApp/Telegram/Facebook/X, dan (kalau device mendukung) tombol share
 * sheet bawaan HP supaya semua app yang user punya muncul.
 */
export function ShareMenu({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : undefined;
  const canNativeShare = !!nav?.share;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    try {
      await nav!.share!({ title, url });
      onClose();
    } catch {
      /* dibatalkan user — biarkan popover terbuka */
    }
  }

  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);

  const targets = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
      cls: "bg-[#25D366]/10 text-[#1a8e4b] dark:text-[#25D366]",
      icon: "💬",
    },
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encUrl}&text=${encTitle}`,
      cls: "bg-[#229ED9]/10 text-[#1a7ba8] dark:text-[#229ED9]",
      icon: "✈️",
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      cls: "bg-[#1877F2]/10 text-[#1877F2]",
      icon: "📘",
    },
    {
      key: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`,
      cls: "bg-fg/10 text-fg",
      icon: "✕",
    },
  ];

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
        aria-label={t("shareTitle")}
        className="w-full max-w-sm rounded-t-2xl bg-card p-4 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-fg">{t("shareTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full text-fg/50 hover:bg-fg/10"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="field flex-1 truncate text-xs"
          />
          <button
            type="button"
            onClick={copyLink}
            className="btn-primary shrink-0 whitespace-nowrap !px-3 !py-2 text-xs"
          >
            {copied ? t("linkCopied") : t("copyLink")}
          </button>
        </div>

        <p className="label mb-2 mt-4">{t("shareVia")}</p>
        <div className="grid grid-cols-4 gap-2">
          {targets.map((tg) => (
            <a
              key={tg.key}
              href={tg.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={"flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold " + tg.cls}
            >
              <span className="text-xl leading-none" aria-hidden>
                {tg.icon}
              </span>
              {tg.label}
            </a>
          ))}
        </div>

        {canNativeShare && (
          <button type="button" onClick={nativeShare} className="btn-ghost mt-3 w-full text-sm">
            {t("moreApps")}
          </button>
        )}
      </div>
    </div>
  );
}
