import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { useAdmin, adminApi, type Submission, type ArticleRow, type AuditEntry, type AdminMember, type AdminRole } from "../lib/admin";
import { useLang } from "../lib/store";
import { supabase } from "../lib/supabase";
import { Spinner } from "../components/Spinner";
import { Icon } from "../components/Icon";
import { Link } from "../router";

type Tab = "submissions" | "articles" | "audit" | "admins";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg,#f7f5f0)]">
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
      <div className="min-h-screen bg-[var(--bg,#f7f5f0)]">
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg,#f7f5f0)]">
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
    <div className="min-h-screen bg-[var(--bg,#f7f5f0)]">
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg,#f7f5f0)] px-4">
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
  const [tab, setTab] = useState<Tab>("submissions");

  const tabs: { key: Tab; label: string }[] = [
    { key: "submissions", label: "Resep" },
    { key: "articles", label: "Artikel" },
    { key: "audit", label: "Audit Log" },
    ...(role === "superadmin" ? [{ key: "admins" as Tab, label: "Kelola Admin" }] : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">Admin CMS</h1>
          <p className="mt-0.5 text-xs text-fg/45">
            {userEmail} &middot; {role}
          </p>
        </div>
      </div>

      <div className="mb-5 flex gap-1 rounded-xl bg-fg/5 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-card text-fg shadow-sm"
                : "text-fg/50 hover:text-fg/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "submissions" && <SubmissionsTab userId={userId} />}
      {tab === "articles" && <ArticlesTab userId={userId} />}
      {tab === "audit" && <AuditTab />}
      {tab === "admins" && role === "superadmin" && <AdminManagementTab currentUserId={userId} />}
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
function ArticlesTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  async function togglePublish(id: number, current: boolean) {
    try {
      await adminApi.updateArticlePublished(id, !current, userId);
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, published: !current } : a)));
    } catch (e: any) {
      alert("Gagal: " + e.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-fg/40">{items.length} artikel</p>
        <button type="button" onClick={load} className="text-xs text-fg/40 hover:text-fg/60">
          Refresh
        </button>
      </div>

      {loading ? (
        <Spinner label="Memuat artikel…" />
      ) : error ? (
        <div className="app-card p-6 text-center text-sm text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="app-card p-6 text-center text-sm text-fg/50">Tidak ada artikel.</div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="app-card flex items-center gap-3 p-3">
              {a.cover_url && (
                <img src={a.cover_url} alt="" className="h-12 w-12 flex-none rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-fg">{a.title_id || a.title_en}</h3>
                <p className="text-xs text-fg/45">
                  {a.category ?? "—"} &middot; {a.author ?? "—"} &middot;{" "}
                  {new Date(a.created_at).toLocaleDateString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => togglePublish(a.id, a.published)}
                className={`flex-none rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  a.published
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-fg/10 text-fg/50 hover:bg-fg/15"
                }`}
              >
                {a.published ? "Published" : "Draft"}
              </button>
            </div>
          ))}
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
function AuditTab() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setItems(await adminApi.getAuditLog());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const actionColors: Record<string, string> = {
    approve: "text-emerald-600",
    reject: "text-red-600",
    publish: "text-blue-600",
    unpublish: "text-amber-600",
    edit: "text-fg/60",
  };

  if (loading) return <Spinner label="Memuat audit log…" />;
  if (error) return <div className="app-card p-6 text-center text-sm text-red-500">{error}</div>;
  if (items.length === 0)
    return <div className="app-card p-6 text-center text-sm text-fg/50">Belum ada aktivitas tercatat.</div>;

  return (
    <div className="space-y-1">
      {items.map((e) => (
        <div key={e.id} className="flex items-baseline gap-2 rounded-lg px-3 py-2 text-xs hover:bg-fg/[0.03]">
          <span className="flex-none text-fg/35">{new Date(e.created_at).toLocaleString("id-ID")}</span>
          <span className={`font-bold uppercase ${actionColors[e.action] ?? "text-fg/50"}`}>{e.action}</span>
          <span className="text-fg/50">{e.target_type}</span>
          <span className="truncate font-mono text-fg/35">{e.target_id}</span>
          {e.detail?.reason && <span className="truncate text-fg/45">— {e.detail.reason}</span>}
        </div>
      ))}
    </div>
  );
}
