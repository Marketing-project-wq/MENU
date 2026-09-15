import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useAdmin, adminApi, type Submission, type ArticleRow, type AuditEntry } from "../lib/admin";
import { useLang } from "../lib/store";
import { Spinner } from "../components/Spinner";
import { Icon } from "../components/Icon";

type Tab = "submissions" | "articles" | "audit";

export function AdminPage() {
  const { t } = useLang();
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { isAdmin, role, loading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Spinner label={t("loading")} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="app-card p-8">
          <h1 className="text-xl font-extrabold text-fg">Admin CMS</h1>
          <p className="mt-2 text-sm text-fg/55">Masuk dulu untuk mengakses halaman admin.</p>
          <button type="button" onClick={() => login("in")} className="btn-primary mt-4 px-6 py-2">
            {t("login")}
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="app-card p-8">
          <h1 className="text-xl font-extrabold text-fg">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-fg/55">
            Akunmu ({user?.email}) tidak punya akses admin. Hubungi superadmin jika ini keliru.
          </p>
        </div>
      </div>
    );
  }

  return <AdminDashboard role={role!} userId={user!.id} userEmail={user?.email ?? ""} />;
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
