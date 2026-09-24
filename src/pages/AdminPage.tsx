import { useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "../lib/auth";
import { useAdmin, adminApi, type Submission, type ArticleRow, type ArticleCreateInput, type AuditEntry, type AdminMember, type AdminRole, type AdminStats } from "../lib/admin";
import { useLang, useRecipes } from "../lib/store";
import { supabase } from "../lib/supabase";
import { Spinner } from "../components/Spinner";
import { Icon } from "../components/Icon";
import { Link } from "../router";
import { renderMarkdown } from "../lib/markdown";

type Tab = "stats" | "submissions" | "articles" | "audit" | "admins";

function AdminHeader({ email, onLogout }: { email?: string; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-fg/10 bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold tracking-tight text-fg">
            <span className="text-brand-red">20FIT</span> Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="hidden text-xs text-fg/45 sm:block">{email}</span>}
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-fg/50 hover:text-fg/70">
            <Icon name="arrowRight" size={13} className="rotate-180" />
            Ke situs
          </Link>
          <button type="button" onClick={onLogout} className="rounded-lg bg-fg/5 px-3 py-1.5 text-xs font-semibold text-fg/50 hover:bg-fg/10">
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}

function AdminLoginForm() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const em = email.trim();
    if (!em || !password) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: em, password });
      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("invalid login")) setErr("Email atau password salah.");
        else setErr("Gagal masuk. Coba lagi.");
      }
    } catch {
      setErr("Terjadi kesalahan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f0] dark:bg-[#0e0f0b]">
      <div className="app-card mx-4 w-full max-w-sm p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-red/10 text-brand-red">
            <Icon name="sparkles" size={28} />
          </div>
          <h1 className="text-xl font-extrabold text-fg">Admin CMS</h1>
          <p className="mt-1 text-sm text-fg/55">Masuk dengan akun admin</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-fg/60">Email</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="field w-full"
              placeholder="admin@20fit.id"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-fg/60">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="field w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto grid h-7 w-7 place-items-center rounded-md text-fg/40 hover:bg-fg/10 hover:text-fg/60"
                aria-label={showPw ? t("authHidePw") : t("authShowPw")}
              >
                <Icon name={showPw ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
          </div>

          {err && (
            <p className="rounded-lg bg-brand-red/10 px-3 py-2 text-[13px] font-medium text-brand-red">
              {err}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
            {busy ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <Link to="/" className="mt-4 block text-center text-xs text-fg/40 hover:text-fg/60">
          Kembali ke situs
        </Link>
      </div>
    </div>
  );
}

export function AdminPage() {
  const { t } = useLang();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { isAdmin, role, loading: adminLoading, mustChangePassword } = useAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#0e0f0b]">
        <AdminHeader onLogout={logout} />
        <div className="mx-auto max-w-5xl px-4 py-12">
          <Spinner label={t("loading")} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f0] dark:bg-[#0e0f0b]">
        <div className="app-card mx-4 max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-500">
            <Icon name="close" size={28} />
          </div>
          <h1 className="text-xl font-extrabold text-fg">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-fg/55">
            Akunmu ({user?.email}) tidak punya akses admin. Hubungi superadmin jika ini keliru.
          </p>
          <Link to="/" className="mt-4 block text-xs text-fg/40 hover:text-fg/60">
            Kembali ke situs
          </Link>
        </div>
      </div>
    );
  }

  // Wajib ganti password saat login pertama (akun dibuat/di-reset dengan password sementara).
  if (mustChangePassword) {
    return <ForceChangePassword email={user?.email ?? ""} onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#0e0f0b]">
      <AdminHeader email={user?.email} onLogout={logout} />
      <AdminDashboard role={role!} userId={user!.id} userEmail={user?.email ?? ""} />
    </div>
  );
}

// Gerbang "wajib ganti password". Blokir akses CMS sampai admin set password baru sendiri.
// Sukses -> matikan flag di DB -> reload (useAdmin baca ulang -> flag false -> CMS terbuka).
function ForceChangePassword({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const strongEnough = pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!strongEnough) {
      setErr("Password minimal 12 karakter, campur huruf besar, kecil, dan angka.");
      return;
    }
    if (pw !== pw2) {
      setErr("Konfirmasi password tidak sama.");
      return;
    }
    setBusy(true);
    try {
      await adminApi.setMyPassword(pw);
      await adminApi.clearMustChangePassword();
      window.location.reload();
    } catch (e2: any) {
      setErr(e2?.message || "Gagal ganti password. Coba lagi.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f5f0] dark:bg-[#0e0f0b] px-4">
      <div className="app-card w-full max-w-sm p-6">
        <h1 className="text-lg font-extrabold text-fg">Ganti password dulu</h1>
        <p className="mt-1 text-sm text-fg/55">
          Akun <span className="font-semibold text-fg/75">{email}</span> pakai password sementara.
          Demi keamanan, set password baru yang cuma kamu tahu sebelum masuk CMS.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="relative">
            <input
              className="field w-full pr-16"
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password baru (min 12, ada huruf besar/kecil/angka)"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto h-7 rounded-md px-2 text-xs font-semibold text-fg/60 hover:bg-fg/10"
            >
              {showPw ? "Sembunyi" : "Lihat"}
            </button>
          </div>
          <input
            className="field w-full"
            type={showPw ? "text" : "password"}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Ulangi password baru"
            autoComplete="new-password"
            required
          />
          {err && (
            <p className="rounded-lg bg-brand-red/10 px-3 py-2 text-[13px] font-medium text-brand-red" role="alert">
              {err}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy || !strongEnough || pw !== pw2}>
            {busy ? "Menyimpan…" : "Simpan & masuk"}
          </button>
        </form>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 block w-full text-center text-xs text-fg/40 hover:text-fg/60"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({
  role,
  userId,
  userEmail,
}: {
  role: string;
  userId: string;
  userEmail: string;
}) {
  const [tab, setTab] = useState<Tab>("stats");

  const navItems: { key: Tab; label: string }[] = [
    { key: "stats", label: "Statistik" },
    { key: "submissions", label: "Resep" },
    { key: "articles", label: "Artikel" },
    { key: "audit", label: "Audit Log" },
    ...(role === "superadmin" ? [{ key: "admins" as Tab, label: "Kelola Admin" }] : []),
  ];

  const activeLabel = navItems.find((n) => n.key === tab)?.label ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:flex lg:gap-6">
      {/* Sidebar: baris pill di mobile, kolom kiri di desktop */}
      <aside className="lg:w-56 lg:flex-none">
        <div className="mb-4 hidden lg:block">
          <h1 className="text-lg font-extrabold tracking-tight text-fg">Admin CMS</h1>
          <p className="mt-0.5 truncate text-xs text-fg/45">{userEmail}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fg/35">{role}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto rounded-xl bg-fg/5 p-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0">
          {navItems.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => setTab(n.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition lg:w-full lg:text-left ${
                tab === n.key
                  ? "bg-card text-fg shadow-sm lg:bg-brand-red/10 lg:text-brand-red lg:shadow-none"
                  : "text-fg/50 hover:text-fg/70 lg:hover:bg-fg/5"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Konten */}
      <main className="mt-5 min-w-0 flex-1 lg:mt-0">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight text-fg lg:text-2xl">{activeLabel}</h2>
        {tab === "stats" && <StatsTab />}
        {tab === "submissions" && <SubmissionsTab userId={userId} />}
        {tab === "articles" && <ArticlesTab userId={userId} />}
        {tab === "audit" && <AuditTab />}
        {tab === "admins" && role === "superadmin" && <AdminManagementTab currentUserId={userId} />}
      </main>
    </div>
  );
}

// =============================================================================
// Tab: Resep Submissions
// =============================================================================
function SubmissionsTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"" | "pending" | "approved" | "rejected">("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getSubmissions(filter || undefined);
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function handleApprove(id: string) {
    setActionId(id);
    try {
      await adminApi.approveSubmission(id, userId);
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, status: "approved" as const, published: true } : s)));
    } catch (e: any) {
      alert("Gagal approve: " + e.message);
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setActionId(id);
    try {
      await adminApi.rejectSubmission(id, userId, rejectReason.trim());
      setItems((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "rejected" as const, published: false, reject_reason: rejectReason.trim() } : s
        )
      );
      setRejectId(null);
      setRejectReason("");
    } catch (e: any) {
      alert("Gagal reject: " + e.message);
    } finally {
      setActionId(null);
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === f ? "bg-brand-red text-white" : "bg-fg/5 text-fg/60 hover:bg-fg/10"
            }`}
          >
            {f === "" ? "Semua" : f === "pending" ? "Pending" : f === "approved" ? "Approved" : "Rejected"}
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto text-xs text-fg/40 hover:text-fg/60">
          Refresh
        </button>
      </div>

      {loading ? (
        <Spinner label="Memuat submissions…" />
      ) : error ? (
        <div className="app-card p-6 text-center text-sm text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/50">Tidak ada submission.</div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="app-card overflow-hidden">
              {/* Header row */}
              <div className="flex items-start gap-3 p-4">
                {s.photo_url && (
                  <img
                    src={s.photo_url}
                    alt=""
                    className="h-16 w-16 flex-none rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-fg">{s.name}</h3>
                    <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[s.status] ?? "bg-fg/10 text-fg/50"}`}>
                      {s.status}
                    </span>
                    {s.published && (
                      <span className="flex-none rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-fg/45">
                    {s.display_name || "Anonim"} &middot; {s.diet_type} &middot;{" "}
                    {s.est_kcal ? `${s.est_kcal} kkal` : "—"} &middot;{" "}
                    {new Date(s.created_at).toLocaleDateString("id-ID")}
                  </p>

                  {/* Expandable detail */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    className="mt-1 text-xs font-semibold text-brand-red hover:underline"
                  >
                    {expandedId === s.id ? "Tutup detail" : "Lihat detail"}
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-none gap-1.5">
                  {s.status === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={actionId === s.id}
                        onClick={() => handleApprove(s.id)}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {actionId === s.id ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRejectId(s.id); setRejectReason(""); }}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {s.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => { setRejectId(s.id); setRejectReason(""); }}
                      className="rounded-lg bg-fg/10 px-3 py-1.5 text-xs font-semibold text-fg/60 hover:bg-fg/15"
                    >
                      Tarik
                    </button>
                  )}
                  {s.status === "rejected" && (
                    <button
                      type="button"
                      disabled={actionId === s.id}
                      onClick={() => handleApprove(s.id)}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Re-approve
                    </button>
                  )}
                </div>
              </div>

              {/* Reject reason (existing) */}
              {s.reject_reason && s.status === "rejected" && (
                <div className="border-t border-fg/5 bg-red-50 px-4 py-2">
                  <p className="text-xs text-red-600">
                    <strong>Alasan ditolak:</strong> {s.reject_reason}
                  </p>
                </div>
              )}

              {/* Reject modal inline */}
              {rejectId === s.id && (
                <div className="border-t border-fg/10 bg-fg/[0.02] p-4">
                  <label className="block text-xs font-semibold text-fg/60">Alasan reject:</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-fg/10 bg-card px-3 py-2 text-sm text-fg placeholder:text-fg/30"
                    placeholder="Misal: foto tidak jelas, bahan belum lengkap…"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={!rejectReason.trim() || actionId === s.id}
                      onClick={() => handleReject(s.id)}
                      className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      Kirim Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectId(null)}
                      className="rounded-lg bg-fg/5 px-4 py-1.5 text-xs font-semibold text-fg/50 hover:bg-fg/10"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded detail */}
              {expandedId === s.id && (
                <div className="border-t border-fg/10 bg-fg/[0.02] p-4 text-xs text-fg/70">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-fg/50">Bahan:</p>
                      <p className="mt-0.5 whitespace-pre-wrap">{s.ingredients}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-fg/50">Langkah:</p>
                      <p className="mt-0.5 whitespace-pre-wrap">{s.steps}</p>
                    </div>
                  </div>
                  {s.equipment && (
                    <p className="mt-2"><strong>Alat:</strong> {s.equipment}</p>
                  )}
                  {s.prep_note && (
                    <p className="mt-1"><strong>Catatan persiapan:</strong> {s.prep_note}</p>
                  )}
                  <p className="mt-2 text-fg/40">
                    ID: {s.id} &middot; Porsi: {s.servings ?? "—"} &middot;
                    Masak: {s.cook_minutes ?? "—"} mnt &middot;
                    Prep: {s.prep_minutes ?? "—"} mnt
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab: Artikel
// =============================================================================
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const EMPTY_ARTICLE: ArticleCreateInput = {
  slug: "",
  title_id: "",
  title_en: "",
  excerpt_id: "",
  excerpt_en: "",
  body_md_id: "",
  body_md_en: "",
  category_id: "",
  category_en: "",
  cover_url: "",
  author_name: "",
  status: "draft",
};

function ArticlesTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ArticleRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setItems(await adminApi.getArticles());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(id: string, current: "draft" | "published") {
    const publish = current !== "published";
    try {
      await adminApi.updateArticlePublished(id, publish, userId);
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: publish ? "published" : "draft" } : a)));
    } catch (e: any) {
      alert("Gagal: " + e.message);
    }
  }

  function handleSaved(row: ArticleRow, mode: "create" | "edit") {
    setItems((prev) => (mode === "create" ? [row, ...prev] : prev.map((a) => (a.id === row.id ? row : a))));
    setShowCreate(false);
    setEditing(null);
  }

  function startEdit(a: ArticleRow) {
    setShowCreate(false);
    setEditing(a);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(a: ArticleRow) {
    if (!confirm(`Hapus artikel "${a.title_id || a.title_en}"? Permanen, tidak bisa dibatalkan.`)) return;
    setBusyId(a.id);
    try {
      await adminApi.deleteArticle(a.id, userId, a.title_id || a.title_en);
      setItems((prev) => prev.filter((x) => x.id !== a.id));
      if (editing?.id === a.id) setEditing(null);
    } catch (e: any) {
      alert("Gagal hapus: " + e.message);
    } finally {
      setBusyId(null);
    }
  }

  const formOpen = showCreate || editing !== null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-fg/40">{items.length} artikel</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={load} className="text-xs text-fg/40 hover:text-fg/60">
            Refresh
          </button>
          <button
            type="button"
            onClick={() => { setEditing(null); setShowCreate((s) => !s); }}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            {showCreate ? "Tutup" : "+ Tulis Artikel"}
          </button>
        </div>
      </div>

      {formOpen && (
        <ArticleForm
          key={editing?.id ?? "new"}
          userId={userId}
          existing={editing}
          onSaved={handleSaved}
          onCancel={() => { setShowCreate(false); setEditing(null); }}
        />
      )}

      {loading ? (
        <Spinner label="Memuat artikel…" />
      ) : error ? (
        <div className="app-card p-6 text-center text-sm text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/50">Belum ada artikel. Klik &ldquo;+ Tulis Artikel&rdquo;.</div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              className={`app-card flex items-center gap-3 p-3 ${editing?.id === a.id ? "ring-2 ring-brand-red/40" : ""}`}
            >
              {a.cover_url && (
                <img src={a.cover_url} alt="" className="h-12 w-12 flex-none rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-fg">{a.title_id || a.title_en}</h3>
                <p className="text-xs text-fg/45">
                  {a.category_id || a.category_en || "—"} &middot; {a.author_name ?? "—"} &middot;{" "}
                  {new Date(a.created_at).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex flex-none items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="rounded-lg bg-fg/5 px-3 py-1.5 text-xs font-semibold text-fg/60 hover:bg-fg/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(a.id, a.status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    a.status === "published"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-fg/10 text-fg/50 hover:bg-fg/15"
                  }`}
                >
                  {a.status === "published" ? "Published" : "Draft"}
                </button>
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => handleDelete(a)}
                  className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Form artikel — bilingual (ID + EN), dipakai untuk TULIS BARU dan EDIT.
// Slug otomatis dari judul ID saat buat baru; saat edit slug awal dari artikel (bisa diubah).
function ArticleForm({
  userId,
  existing,
  onSaved,
  onCancel,
}: {
  userId: string;
  existing: ArticleRow | null;
  onSaved: (row: ArticleRow, mode: "create" | "edit") => void;
  onCancel: () => void;
}) {
  const isEdit = existing !== null;
  const [f, setF] = useState<ArticleCreateInput>(() =>
    existing
      ? {
          slug: existing.slug,
          title_id: existing.title_id,
          title_en: existing.title_en,
          excerpt_id: existing.excerpt_id ?? "",
          excerpt_en: existing.excerpt_en ?? "",
          body_md_id: existing.body_md_id ?? "",
          body_md_en: existing.body_md_en ?? "",
          category_id: existing.category_id ?? "",
          category_en: existing.category_en ?? "",
          cover_url: existing.cover_url ?? "",
          author_name: existing.author_name ?? "",
          status: existing.status,
        }
      : EMPTY_ARTICLE
  );
  const [lang, setLang] = useState<"id" | "en">("id");
  const [view, setView] = useState<"write" | "preview">("write");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState<"" | "draft" | "publish">("");
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [coverErr, setCoverErr] = useState("");
  // Generate AI + sisip gambar (WordPress-style).
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [aiOpen, setAiOpen] = useState(!isEdit); // panel AI kebuka default saat tulis baru
  const [aiTopic, setAiTopic] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [coverOptions, setCoverOptions] = useState<string[]>([]);
  const [insertingImg, setInsertingImg] = useState(false);

  function set<K extends keyof ArticleCreateInput>(key: K, val: ArticleCreateInput[K]) {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  // Generate draft artikel dari AI: isi judul/slug/ringkasan/kategori/isi (ID+EN) + cari cover.
  async function runGenerate() {
    const topic = aiTopic.trim();
    if (!topic) { setAiErr("Isi dulu topik / ide judulnya."); return; }
    setAiErr("");
    setAiBusy(true);
    try {
      const r = await adminApi.generateArticleAI({ topic, notes: aiNotes.trim(), category: f.category_id?.trim() });
      setF((prev) => ({
        ...prev,
        title_id: r.title_id || prev.title_id,
        title_en: r.title_en || prev.title_en,
        excerpt_id: r.excerpt_id ?? prev.excerpt_id,
        excerpt_en: r.excerpt_en ?? prev.excerpt_en,
        body_md_id: r.body_md_id || prev.body_md_id,
        body_md_en: r.body_md_en || prev.body_md_en,
        category_id: r.category_id || prev.category_id,
        category_en: r.category_en || prev.category_en,
        slug: r.slug || prev.slug,
      }));
      if (r.slug) setSlugTouched(true); // pakai slug dari AI, jangan ditimpa dari judul
      // Cover: cari foto stok Pexels dari kata kunci AI (opsional — jangan gagalkan generate).
      if (r.image_query) {
        try {
          const photos = await adminApi.findStockPhotos(String(r.image_query));
          setCoverOptions(photos.urls || []);
          if (photos.url) setF((prev) => ({ ...prev, cover_url: prev.cover_url || (photos.url as string) }));
        } catch { /* foto opsional */ }
      }
      setAiOpen(false);
    } catch (e: any) {
      setAiErr(e?.message || "Gagal generate artikel.");
    } finally {
      setAiBusy(false);
    }
  }

  // Sisip gambar ke TENGAH artikel (ala WordPress): upload -> tulis ![alt](url) di posisi kursor.
  async function insertBodyImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setErr("Format gambar harus JPG, PNG, WEBP, atau GIF.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Ukuran gambar maksimal 5MB.");
      e.target.value = "";
      return;
    }
    setInsertingImg(true);
    setErr("");
    try {
      const url = await adminApi.uploadCover(file); // pakai bucket article-covers (public) yang sama
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      const md = `\n\n![${alt}](${url})\n\n`;
      const ta = bodyRef.current;
      const cur = f[bodyKey] || "";
      let caret = cur.length;
      let next: string;
      if (ta && typeof ta.selectionStart === "number") {
        const s = ta.selectionStart, en = ta.selectionEnd;
        next = cur.slice(0, s) + md + cur.slice(en);
        caret = s + md.length;
      } else {
        next = cur + md;
      }
      set(bodyKey, next);
      requestAnimationFrame(() => {
        if (ta) { ta.focus(); try { ta.setSelectionRange(caret, caret); } catch { /* ignore */ } }
      });
    } catch (e2: any) {
      setErr(e2?.message || "Gagal upload gambar.");
    } finally {
      setInsertingImg(false);
      e.target.value = "";
    }
  }

  const effectiveSlug = slugTouched ? f.slug : slugify(f.title_id);
  const isID = lang === "id";
  const titleKey: "title_id" | "title_en" = isID ? "title_id" : "title_en";
  const bodyKey: "body_md_id" | "body_md_en" = isID ? "body_md_id" : "body_md_en";
  const excerptKey: "excerpt_id" | "excerpt_en" = isID ? "excerpt_id" : "excerpt_en";

  async function save(status: "draft" | "published") {
    setErr("");
    const slug = effectiveSlug.trim();
    if (!f.title_id.trim() || !f.title_en.trim()) { setErr("Judul Indonesia & English wajib diisi."); return; }
    if (!slug) { setErr("Slug wajib diisi."); return; }
    if (status === "published" && (!f.body_md_id.trim() || !f.body_md_en.trim())) {
      setErr("Isi artikel Indonesia & English wajib diisi sebelum publish.");
      return;
    }
    setSaving(status === "published" ? "publish" : "draft");
    try {
      const payload: ArticleCreateInput = { ...f, slug, status };
      const row = existing
        ? await adminApi.updateArticle(existing.id, payload, userId, existing.published_at)
        : await adminApi.createArticle(payload, userId);
      onSaved(row, existing ? "edit" : "create");
    } catch (e2: any) {
      const m = (e2?.message || "").toLowerCase();
      if (m.includes("duplicate") || m.includes("unique") || m.includes("already exists")) {
        setErr(`Slug "${slug}" sudah dipakai. Ganti slug-nya.`);
      } else {
        setErr(e2?.message || "Gagal menyimpan artikel.");
      }
      setSaving("");
    }
  }

  async function handleCoverFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverErr("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCoverErr("Format harus JPG, PNG, atau WEBP.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverErr("Ukuran maksimal 5MB.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await adminApi.uploadCover(file);
      set("cover_url", url);
    } catch (e2: any) {
      setCoverErr(e2?.message || "Gagal upload gambar.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const busy = saving !== "";
  const previewHtml = renderMarkdown(f[bodyKey] || "");
  const cardCls = "app-card p-4";
  const h4 = "mb-2 text-xs font-bold uppercase tracking-wide text-fg/45";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f5f0] dark:bg-[#0e0f0b]">
      {/* Top bar ala WordPress: kembali + Simpan Draft + Publish */}
      <header className="sticky top-0 z-10 border-b border-fg/10 bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-sm font-semibold text-fg/60 hover:text-fg"
          >
            <Icon name="arrowRight" size={15} className="rotate-180" />
            Kembali
          </button>
          <span className="hidden text-sm font-bold text-fg sm:block">{isEdit ? "Edit Artikel" : "Tulis Artikel"}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => save("draft")}
              disabled={busy}
              className="rounded-lg bg-fg/5 px-4 py-2 text-sm font-semibold text-fg/70 hover:bg-fg/10 disabled:opacity-50"
            >
              {saving === "draft" ? "Menyimpan…" : "Simpan Draft"}
            </button>
            <button type="button" onClick={() => save("published")} disabled={busy} className="btn-primary px-5 py-2">
              {saving === "publish" ? "Mem-publish…" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl gap-6 px-4 py-6 lg:flex">
        {/* Kolom tulis */}
        <main className="min-w-0 flex-1">
          {/* Generate artikel dengan AI — isi semua field (ID+EN) + cari cover Pexels. */}
          <div className="mb-4 rounded-xl border border-brand-red/25 bg-brand-red/[0.04] p-3">
            <button
              type="button"
              onClick={() => setAiOpen((o) => !o)}
              className="flex w-full items-center gap-2 text-left text-sm font-bold text-fg"
            >
              <span className="text-base">✨</span>
              Generate artikel dengan AI
              <Icon name="arrowRight" size={14} className={"ml-auto transition-transform " + (aiOpen ? "rotate-90" : "")} />
            </button>
            {aiOpen && (
              <div className="mt-3 space-y-2">
                <input
                  className="field w-full"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Topik / ide judul — mis. 'Manfaat sarapan tinggi protein'"
                  disabled={aiBusy}
                />
                <textarea
                  className="field w-full"
                  rows={2}
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Catatan tambahan (opsional) — sudut pandang, poin wajib, target pembaca…"
                  disabled={aiBusy}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={runGenerate}
                    disabled={aiBusy || !aiTopic.trim()}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {aiBusy ? "Menulis… (10–30 dtk)" : "✨ Generate draft"}
                  </button>
                  <span className="text-[11px] text-fg/45">
                    Isi judul, slug, SEO, kategori & isi (ID+EN) + cari cover otomatis. Semua bisa diedit.
                  </span>
                </div>
                {aiErr && <p className="text-[12px] font-medium text-brand-red">{aiErr}</p>}
              </div>
            )}
          </div>

          <div className="mb-3 inline-flex rounded-lg bg-fg/5 p-1 text-sm font-semibold">
            {(["id", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`rounded-md px-3 py-1.5 ${lang === l ? "bg-card text-fg shadow-sm" : "text-fg/50 hover:text-fg/70"}`}
              >
                {l === "id" ? "Indonesia" : "English"}
              </button>
            ))}
          </div>

          <input
            className="w-full border-0 bg-transparent p-0 text-2xl font-extrabold tracking-tight text-fg outline-none placeholder:text-fg/25 sm:text-3xl"
            placeholder={isID ? "Judul artikel…" : "Article title…"}
            value={f[titleKey]}
            onChange={(e) => set(titleKey, e.target.value)}
          />

          <div className="mt-2 flex items-center gap-2 text-xs text-fg/45">
            <span className="font-semibold">Slug:</span>
            <input
              className="min-w-0 flex-1 rounded border border-fg/10 bg-card px-2 py-1 font-mono text-[11px] text-fg/70"
              value={effectiveSlug}
              onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }}
              placeholder="otomatis-dari-judul"
            />
          </div>

          <div className="mt-4 flex items-center gap-1 border-b border-fg/10">
            {(["write", "preview"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
                  view === v ? "border-brand-red text-fg" : "border-transparent text-fg/45 hover:text-fg/70"
                }`}
              >
                {v === "write" ? "Tulis" : "Preview"}
              </button>
            ))}
            {/* Sisipkan gambar ke tengah artikel (WordPress-style): upload -> ![](url) di kursor. */}
            <label
              className={`ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold text-brand-red hover:bg-brand-red/10 ${
                insertingImg ? "cursor-wait opacity-60" : ""
              }`}
              title="Sisipkan gambar ke posisi kursor"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
              </svg>
              {insertingImg ? "Mengunggah…" : "Sisipkan Gambar"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={insertingImg}
                onChange={insertBodyImage}
              />
            </label>
            <span className="ml-2 text-[11px] text-fg/35">Markdown</span>
          </div>

          {view === "write" ? (
            <textarea
              ref={bodyRef}
              className="mt-3 w-full rounded-lg border border-fg/10 bg-card p-4 font-mono text-sm text-fg outline-none focus:border-brand-red/40"
              rows={18}
              value={f[bodyKey]}
              onChange={(e) => set(bodyKey, e.target.value)}
              placeholder={isID ? "## Sub-judul\n\nTulis isi artikel pakai Markdown…" : "## Section\n\nWrite the article in Markdown…"}
            />
          ) : (
            <div className="mt-3 min-h-[16rem] rounded-lg border border-fg/10 bg-card p-4">
              {f[bodyKey].trim() ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <p className="text-sm text-fg/40">Belum ada isi untuk dipreview.</p>
              )}
            </div>
          )}

          <label className="mt-4 block text-xs font-semibold text-fg/60">
            Ringkasan {isID ? "(ID)" : "(EN)"} — dipakai untuk meta description SEO
          </label>
          <textarea
            className="field mt-1 w-full"
            rows={2}
            value={f[excerptKey] ?? ""}
            onChange={(e) => set(excerptKey, e.target.value)}
            placeholder={isID ? "Ringkasan singkat 1–2 kalimat…" : "Short 1–2 sentence summary…"}
          />
        </main>

        {/* Sidebar kanan ala WordPress */}
        <aside className="mt-6 w-full space-y-4 lg:mt-0 lg:w-72 lg:flex-none">
          <div className={cardCls}>
            <h4 className={h4}>Publikasi</h4>
            <label className="mb-1 block text-xs font-semibold text-fg/50">Status</label>
            <select
              className="field w-full"
              value={f.status}
              onChange={(e) => set("status", e.target.value as "draft" | "published")}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => save("draft")}
                disabled={busy}
                className="flex-1 rounded-lg bg-fg/5 px-3 py-2 text-xs font-semibold text-fg/70 hover:bg-fg/10 disabled:opacity-50"
              >
                {saving === "draft" ? "…" : "Simpan Draft"}
              </button>
              <button type="button" onClick={() => save("published")} disabled={busy} className="btn-primary flex-1 px-3 py-2 text-xs">
                {saving === "publish" ? "…" : "Publish"}
              </button>
            </div>
          </div>

          <div className={cardCls}>
            <h4 className={h4}>Gambar Sampul</h4>
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-fg/25 bg-fg/5 px-3 py-2.5 text-xs font-semibold text-fg/70 hover:bg-fg/10 ${
                uploading ? "cursor-wait opacity-60" : ""
              }`}
            >
              {uploading ? "Mengunggah…" : "Upload gambar dari komputer"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={handleCoverFile}
              />
            </label>
            <div className="my-2 flex items-center gap-2 text-[10px] uppercase tracking-wide text-fg/30">
              <span className="h-px flex-1 bg-fg/10" />
              atau tempel URL
              <span className="h-px flex-1 bg-fg/10" />
            </div>
            <input className="field w-full" value={f.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://…" />
            {coverErr && <p className="mt-1 text-[11px] font-medium text-brand-red">{coverErr}</p>}
            {f.cover_url && (
              <img
                key={f.cover_url}
                src={f.cover_url}
                alt=""
                className="mt-2 h-28 w-full rounded-lg object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <p className="mt-1.5 text-[10px] text-fg/35">JPG / PNG / WEBP, maks 5MB.</p>
            {coverOptions.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg/40">Pilihan foto (Pexels)</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {coverOptions.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => set("cover_url", u)}
                      className={"overflow-hidden rounded-md border-2 " + (f.cover_url === u ? "border-brand-red" : "border-transparent hover:border-fg/20")}
                      title="Pakai foto ini"
                    >
                      <img src={u} alt="" className="h-14 w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={cardCls}>
            <h4 className={h4}>Kategori</h4>
            <input className="field mb-2 w-full" value={f.category_id} onChange={(e) => set("category_id", e.target.value)} placeholder="Kategori (ID) — Tips Gizi" />
            <input className="field w-full" value={f.category_en} onChange={(e) => set("category_en", e.target.value)} placeholder="Category (EN) — Nutrition" />
          </div>

          <div className={cardCls}>
            <h4 className={h4}>Penulis</h4>
            <input className="field w-full" value={f.author_name} onChange={(e) => set("author_name", e.target.value)} placeholder="Tim 20FIT" />
          </div>

          <div className={cardCls}>
            <h4 className={h4}>Pratinjau Google (SEO)</h4>
            <div className="rounded-lg border border-fg/10 bg-fg/[0.02] p-3">
              <div className="truncate text-[13px] text-[#1a0dab] dark:text-[#8ab4f8]">
                {(f.title_id || "Judul artikel").trim()} — 20FIT
              </div>
              <div className="truncate text-[11px] text-emerald-700 dark:text-emerald-500">
                recipe.20fit.id › artikel › {effectiveSlug || "slug"}
              </div>
              <div className="mt-0.5 text-[11px] text-fg/55">
                {f.excerpt_id?.trim() || "Isi Ringkasan (ID) untuk mengatur deskripsi di hasil pencarian Google."}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-fg/40">
              Judul &amp; Ringkasan (ID) dipakai untuk meta SEO. Preview link WhatsApp/Facebook butuh SSR (belum).
            </p>
          </div>
        </aside>
      </div>

      {err && (
        <div className="sticky bottom-0 border-t border-fg/10 bg-card/95 px-4 py-3 backdrop-blur">
          <p className="mx-auto max-w-6xl rounded-lg bg-brand-red/10 px-3 py-2 text-[13px] font-medium text-brand-red" role="alert">
            {err}
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab: Kelola Admin (superadmin only)
// =============================================================================
function AdminManagementTab({ currentUserId }: { currentUserId: string }) {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("admin");
  const [showNewPw, setShowNewPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setAdmins(await adminApi.listAdmins());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateMsg(null);
    const em = newEmail.trim();
    if (!em || !newPassword) return;
    if (newPassword.length < 6) {
      setCreateMsg({ ok: false, text: "Password minimal 6 karakter." });
      return;
    }
    setCreating(true);
    try {
      await adminApi.createAdminAccount(em, newPassword, newRole);
      setCreateMsg({ ok: true, text: `Akun ${em} berhasil dibuat sebagai ${newRole}.` });
      setNewEmail("");
      setNewPassword("");
      setNewRole("admin");
      await load();
    } catch (err: any) {
      setCreateMsg({ ok: false, text: err.message });
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(userId: string, current: AdminRole) {
    const next = current === "superadmin" ? "admin" : "superadmin";
    if (!confirm(`Ubah role menjadi ${next}?`)) return;
    setBusyId(userId);
    try {
      await adminApi.updateAdminRole(userId, next);
      setAdmins((prev) => prev.map((a) => (a.user_id === userId ? { ...a, role: next } : a)));
    } catch (err: any) {
      alert("Gagal ubah role: " + err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(userId: string, email: string) {
    if (!confirm(`Hapus akses admin untuk ${email}? User tetap ada, hanya role admin yang dihapus.`)) return;
    setBusyId(userId);
    try {
      await adminApi.removeAdmin(userId);
      setAdmins((prev) => prev.filter((a) => a.user_id !== userId));
    } catch (err: any) {
      alert("Gagal hapus: " + err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {/* Form buat admin baru */}
      <div className="app-card mb-6 p-5">
        <h3 className="text-sm font-bold text-fg">Buat Akun Admin Baru</h3>
        <p className="mb-4 text-xs text-fg/45">Buat akun sekaligus assign role admin — user langsung bisa login.</p>

        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-fg/60">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="field w-full"
              placeholder="email@contoh.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-fg/60">Password</label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="field w-full pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPw((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto grid h-7 w-7 place-items-center rounded-md text-fg/40 hover:bg-fg/10 hover:text-fg/60"
              >
                <Icon name={showNewPw ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-fg/60">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="field w-full"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap px-5 py-2">
              {creating ? "Membuat…" : "Buat"}
            </button>
          </div>
        </form>

        {createMsg && (
          <p className={`mt-3 rounded-lg px-3 py-2 text-[13px] font-medium ${
            createMsg.ok
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-brand-red/10 text-brand-red"
          }`}>
            {createMsg.text}
          </p>
        )}
      </div>

      {/* Daftar admin */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-fg">Daftar Admin ({admins.length})</h3>
        <button type="button" onClick={load} className="text-xs text-fg/40 hover:text-fg/60">Refresh</button>
      </div>

      {loading ? (
        <Spinner label="Memuat daftar admin…" />
      ) : error ? (
        <div className="app-card p-6 text-center text-sm text-red-500">{error}</div>
      ) : admins.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/50">Belum ada admin.</div>
      ) : (
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.user_id} className="app-card flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-fg">{a.email}</span>
                  <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    a.role === "superadmin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {a.role}
                  </span>
                  {a.user_id === currentUserId && (
                    <span className="text-[10px] font-semibold text-fg/35">(kamu)</span>
                  )}
                </div>
                <p className="text-xs text-fg/40">
                  Sejak {new Date(a.created_at).toLocaleDateString("id-ID")}
                </p>
              </div>

              {a.user_id !== currentUserId && (
                <div className="flex flex-none gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === a.user_id}
                    onClick={() => handleRoleChange(a.user_id, a.role)}
                    className="rounded-lg bg-fg/5 px-3 py-1.5 text-xs font-semibold text-fg/60 hover:bg-fg/10 disabled:opacity-50"
                  >
                    {a.role === "superadmin" ? "→ Admin" : "→ Superadmin"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === a.user_id}
                    onClick={() => handleRemove(a.user_id, a.email)}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab: Audit Log
// =============================================================================
// Label aksi audit dalam Bahasa Indonesia (+ warna). Kunci = kolom `action` di DB.
const AUDIT_ACTIONS: Record<string, { label: string; cls: string }> = {
  approve: { label: "menyetujui resep", cls: "bg-emerald-100 text-emerald-700" },
  reject: { label: "menolak resep", cls: "bg-red-100 text-red-700" },
  publish: { label: "menerbitkan artikel", cls: "bg-blue-100 text-blue-700" },
  unpublish: { label: "menyembunyikan artikel", cls: "bg-amber-100 text-amber-700" },
  create_article: { label: "menulis artikel", cls: "bg-emerald-100 text-emerald-700" },
  update_article: { label: "mengedit artikel", cls: "bg-fg/10 text-fg/70" },
  delete_article: { label: "menghapus artikel", cls: "bg-red-100 text-red-700" },
  create_admin: { label: "membuat akun admin", cls: "bg-purple-100 text-purple-700" },
  update_role: { label: "mengubah role admin", cls: "bg-purple-100 text-purple-700" },
  remove_admin: { label: "mencabut akses admin", cls: "bg-red-100 text-red-700" },
};

function AuditTab() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [emailById, setEmailById] = useState<Record<string, string>>({});
  const [nameById, setNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      // Ambil log + data untuk menerjemahkan UUID -> nama (best-effort; kalau gagal, tetap tampil).
      const [log, articles, submissions] = await Promise.all([
        adminApi.getAuditLog(100),
        adminApi.getArticles().catch(() => [] as Awaited<ReturnType<typeof adminApi.getArticles>>),
        adminApi.getSubmissions().catch(() => [] as Awaited<ReturnType<typeof adminApi.getSubmissions>>),
      ]);
      setItems(log);

      const names: Record<string, string> = {};
      articles.forEach((a) => { names[a.id] = a.title_id || a.title_en; });
      submissions.forEach((s) => { names[s.id] = s.name; });
      setNameById(names);

      // Email admin cuma bisa diambil superadmin (RPC). Kalau bukan, lewati (fallback "Admin").
      try {
        const admins = await adminApi.listAdmins();
        const em: Record<string, string> = {};
        admins.forEach((a) => { em[a.user_id] = a.email; });
        setEmailById(em);
      } catch { /* non-superadmin: skip email */ }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function who(id: string): string {
    return emailById[id] || "Admin";
  }
  function what(action: string): string {
    return AUDIT_ACTIONS[action]?.label ?? action.replace(/_/g, " ");
  }
  function targetLabel(e: AuditEntry): string {
    const nm = nameById[e.target_id];
    if (nm) return `“${nm}”`;
    if (e.detail?.title) return `“${e.detail.title}”`;
    if (e.detail?.slug) return `“${e.detail.slug}”`;
    if (e.detail?.email) return e.detail.email;
    if (e.target_type === "admin") return "akun admin";
    return `#${String(e.target_id).slice(0, 8)}`;
  }

  if (loading) return <Spinner label="Memuat audit log…" />;
  if (error) return <div className="app-card p-6 text-center text-sm text-red-500">{error}</div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-fg/45">
          Catatan otomatis: siapa melakukan apa &amp; kapan (untuk akuntabilitas antar-admin).
        </p>
        <button type="button" onClick={load} className="flex-none text-xs text-fg/40 hover:text-fg/60">Refresh</button>
      </div>

      {items.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/50">Belum ada aktivitas tercatat.</div>
      ) : (
        <div className="space-y-2">
          {items.map((e) => {
            const meta = AUDIT_ACTIONS[e.action];
            return (
              <div key={e.id} className="app-card p-3">
                <p className="text-sm leading-relaxed text-fg/80">
                  <span className="font-semibold text-fg">{who(e.admin_id)}</span>{" "}
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${meta?.cls ?? "bg-fg/10 text-fg/50"}`}>
                    {what(e.action)}
                  </span>{" "}
                  <span className="text-fg/70">{targetLabel(e)}</span>
                </p>
                {e.detail?.reason && <p className="mt-1 text-xs text-fg/45">Alasan: {e.detail.reason}</p>}
                <p className="mt-1 text-[11px] text-fg/35">{new Date(e.created_at).toLocaleString("id-ID")}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab: Statistik (dashboard)
// =============================================================================
const DIET_LABELS: Record<string, string> = {
  normal: "Normal", vegetarian: "Vegetarian", vegan: "Vegan", pescatarian: "Pescatarian",
  keto: "Keto", halal: "Halal", "high-protein": "Tinggi Protein", "low-carb": "Rendah Karbo",
};

function StatTile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="app-card p-4">
      <p className="text-2xl font-extrabold tracking-tight text-fg">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-fg/50">{label}</p>
      {hint && <p className="text-[11px] text-fg/35">{hint}</p>}
    </div>
  );
}

function RankedList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { name: string; n: number; sub?: string }[];
  empty: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.n), 0) || 1;
  return (
    <div className="app-card p-4">
      <h3 className="mb-3 text-sm font-bold text-fg">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-fg/40">{empty}</p>
      ) : (
        <ol className="space-y-2.5">
          {rows.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-4 flex-none text-right text-xs font-bold text-fg/35">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm text-fg/80">{r.name}</span>
                  <span className="flex-none text-xs font-bold text-fg/60">{r.n}</span>
                </div>
                {r.sub && <p className="truncate text-[11px] text-fg/40">{r.sub}</p>}
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-fg/5">
                  <div className="h-full rounded-full bg-brand-red/50" style={{ width: `${Math.round((r.n / max) * 100)}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StatsTab() {
  const { lang } = useLang();
  const { official, members } = useRecipes();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setStats(await adminApi.getStats());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // Resolve menu_id -> nama pakai katalog yang sudah dimuat (official + member).
  const nameByMenuId = useMemo(() => {
    const m = new Map<string, string>();
    (official as any[]).forEach((r) => m.set(r.id, r?.nm?.[lang] || r?.nm?.id || r?.nm?.en || r.id));
    (members as any[]).forEach((x) => m.set(x.id, x.name));
    return m;
  }, [official, members, lang]);
  const menuName = (id: string) => nameByMenuId.get(id) || id;

  if (loading) return <Spinner label="Memuat statistik…" />;
  if (error) return <div className="app-card p-6 text-center text-sm text-red-500">{error}</div>;
  if (!stats) return null;

  const t = stats.totals;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Artikel terbit" value={t.articles_published} hint={`${t.articles} total`} />
        <StatTile label="Menu dilihat" value={t.menu_views} />
        <StatTile label="Klik Eat Now" value={t.eatnow_clicks} />
        <StatTile label="Disukai (like)" value={t.likes} />
        <StatTile label="Disimpan" value={t.saves} />
        <StatTile label="Kontribusi resep" value={t.contributions} hint={`${t.contributions_pending} nunggu review`} />
        <StatTile label="User aktif (app)" value={t.active_users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedList
          title="Menu paling dilihat"
          empty="Belum ada menu yang dibuka."
          rows={stats.top_viewed.map((r) => ({ name: r.name, n: r.n, sub: r.cat ?? undefined }))}
        />
        <RankedList
          title="Paling sering dipilih (Eat Now)"
          empty="Belum ada klik Eat Now."
          rows={stats.top_eatnow.map((r) => ({ name: menuName(r.menu_id), n: r.n, sub: r.source ?? undefined }))}
        />
        <RankedList
          title="Menu paling disukai"
          empty="Belum ada yang nge-like."
          rows={stats.top_liked.map((r) => ({ name: menuName(r.menu_id), n: r.n, sub: r.source ?? undefined }))}
        />
        <RankedList
          title="Jenis resep yang di-submit orang"
          empty="Belum ada kontribusi resep."
          rows={stats.submissions_by_diet.map((r) => ({ name: DIET_LABELS[r.name] || r.name, n: r.n }))}
        />
        <RankedList
          title="Kontributor teratas"
          empty="Belum ada kontributor."
          rows={stats.top_contributors.map((r) => ({ name: r.name, n: r.n }))}
        />

        <div className="app-card p-4">
          <h3 className="mb-3 text-sm font-bold text-fg">User paling aktif</h3>
          {stats.active_users.length === 0 ? (
            <p className="py-6 text-center text-xs text-fg/40">Belum ada data aktivitas.</p>
          ) : (
            <ol className="space-y-1.5">
              {stats.active_users.map((u, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-4 flex-none text-right text-xs font-bold text-fg/35">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-fg/80">{u.name}</p>
                    {u.email && <p className="truncate text-[11px] text-fg/40">{u.email}</p>}
                  </div>
                  <div className="flex-none text-right">
                    <p className="text-xs font-bold text-fg/60">{u.pings}×</p>
                    {u.last_active_at && (
                      <p className="text-[10px] text-fg/35">{new Date(u.last_active_at).toLocaleDateString("id-ID")}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="app-card border-dashed p-4">
        <p className="text-xs text-fg/55">
          <strong className="text-fg/70">Menu paling dicari</strong> belum bisa ditampilkan — query pencarian belum
          dicatat di mana pun. Kalau mau, aku bisa tambah pencatatan pencarian supaya metrik ini mulai terisi.
        </p>
        <p className="mt-1.5 text-[11px] text-fg/35">
          Angka bertambah otomatis seiring pemakaian. &ldquo;User aktif&rdquo; = aktivitas app 20FIT (proxy login;
          riwayat login mentah tidak disimpan).{" "}
          <button type="button" onClick={load} className="font-semibold text-brand-red hover:underline">Refresh</button>
        </p>
      </div>
    </div>
  );
}
