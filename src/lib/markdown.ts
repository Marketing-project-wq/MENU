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
      ? `<img src="${safe}" alt="${escapeHtml(alt)}" class="my-5 max-h-[28rem] w-full rounded-2xl object-cover" loading="lazy">`
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
      html.push(`<h3 class="mt-6 mb-1.5 text-base font-bold text-fg">${inline(line.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      closeList();
      html.push(`<h2 class="mt-8 mb-2 text-xl font-extrabold tracking-tight text-fg">${inline(line.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      closeList();
      html.push(`<h2 class="mt-8 mb-2 text-2xl font-extrabold tracking-tight text-fg">${inline(line.replace(/^#\s+/, ""))}</h2>`);
    } else if (/^>\s?/.test(line)) {
      // Kutipan / catatan bergaya (mis. tip atau ringkasan). Dipisah dari prosa biasa.
      closeList();
      html.push(
        `<blockquote class="my-4 border-l-4 border-brand-red/40 bg-fg/[0.03] py-2 pl-4 pr-3 text-[15px] italic leading-7 text-fg/70">${inline(
          line.replace(/^>\s?/, "")
        )}</blockquote>`
      );
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push('<ul class="my-4 list-disc space-y-2 pl-5 text-[15px] leading-7 text-fg/80 marker:text-brand-red/50">');
        inList = true;
      }
      html.push(`<li class="pl-1">${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      html.push(`<p class="my-4 text-[15px] leading-7 text-fg/80">${inline(line)}</p>`);
    }
  }
  closeList();
  return html.join("\n");
}
