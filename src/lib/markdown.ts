// Renderer Markdown MINIMAL & AMAN (tanpa dependency). Escape HTML dulu, lalu HANYA emit tag
// yang kita kontrol; link/gambar hanya http(s). Dipakai utk body artikel (ditulis admin) — cukup
// untuk heading, bold, italic, list, link, gambar, paragraf. Bukan Markdown penuh, tapi aman.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeUrl(u: string): string | null {
  return /^https?:\/\//i.test(u) ? u : null;
}

function inline(s: string): string {
  let out = escapeHtml(s);
  // gambar ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    const safe = safeUrl(url);
    return safe
      ? `<img src="${safe}" alt="${escapeHtml(alt)}" class="my-3 max-h-96 w-full rounded-xl object-cover" loading="lazy">`
      : "";
  });
  // link [teks](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    const safe = safeUrl(url);
    return safe
      ? `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="text-brand-red underline">${text}</a>`
      : text;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

/** Balik HTML aman dari Markdown sederhana. Dipakai dgn dangerouslySetInnerHTML. */
export function renderMarkdown(md: string): string {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      closeList();
      html.push(`<h3 class="mt-5 mb-1 text-base font-bold text-fg">${inline(line.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      closeList();
      html.push(`<h2 class="mt-6 mb-2 text-lg font-extrabold text-fg">${inline(line.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      closeList();
      html.push(`<h2 class="mt-6 mb-2 text-xl font-extrabold text-fg">${inline(line.replace(/^#\s+/, ""))}</h2>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push('<ul class="my-2 list-disc space-y-1 pl-5 text-fg/80">');
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      html.push(`<p class="my-2 leading-relaxed text-fg/80">${inline(line)}</p>`);
    }
  }
  closeList();
  return html.join("\n");
}
