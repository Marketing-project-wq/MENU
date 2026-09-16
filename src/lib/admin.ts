import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type AdminRole = "admin" | "superadmin";

interface AdminState {
  isAdmin: boolean;
  role: AdminRole | null;
  loading: boolean;
  mustChangePassword: boolean;
}

export function useAdmin(): AdminState {
  const { user, isAuthenticated } = useAuth();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [mustChange, setMustChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRole(null);
      setMustChange(false);
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("recipe_admin_role")
          .select("role, must_change_password")
          .eq("user_id", user.id)
          .maybeSingle();

        if (alive) {
          if (error || !data) {
            setRole(null);
            setMustChange(false);
          } else {
            setRole(data.role as AdminRole);
            // Fail-safe: cuma blokir kalau flag JELAS true; error/absen -> jangan kunci admin.
            setMustChange(data.must_change_password === true);
          }
        }
      } catch {
        if (alive) {
          setRole(null);
          setMustChange(false);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [user, isAuthenticated]);

  return { isAdmin: role !== null, role, loading, mustChangePassword: mustChange };
}

export interface Submission {
  id: string;
  name: string;
  diet_type: string;
  display_name: string | null;
  ingredients: string;
  steps: string;
  steps_json: any | null;
  photo_url: string | null;
  est_kcal: number | null;
  macros: any | null;
  servings: number | null;
  cook_minutes: number | null;
  prep_minutes: number | null;
  equipment: string | null;
  prep_note: string | null;
  status: "pending" | "approved" | "rejected";
  published: boolean;
  reject_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_id: string | null;
}

// Sesuai kolom NYATA tabel my20fit_recipe_article (bilingual + kolom legacy single-lang).
export interface ArticleRow {
  id: string; // uuid
  slug: string;
  title_id: string;
  title_en: string;
  excerpt_id: string | null;
  excerpt_en: string | null;
  body_md_id: string | null;
  body_md_en: string | null;
  category_id: string | null;
  category_en: string | null;
  cover_url: string | null;
  author_name: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// Input form "Tulis Artikel" (ID + EN). Kolom legacy diisi otomatis dari versi ID.
export interface ArticleCreateInput {
  slug: string;
  title_id: string;
  title_en: string;
  excerpt_id?: string;
  excerpt_en?: string;
  body_md_id: string;
  body_md_en: string;
  category_id?: string;
  category_en?: string;
  cover_url?: string;
  author_name?: string;
  status: "draft" | "published";
}

export interface AuditEntry {
  id: number;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  detail: any;
  created_at: string;
}

export interface AdminMember {
  user_id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export const adminApi = {
  async getSubmissions(status?: string): Promise<Submission[]> {
    let q = supabase
      .from("my20fit_menu_contribution")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) q = q.eq("status", status);
    const { data, error } = await q.limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as Submission[];
  },

  async approveSubmission(id: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from("my20fit_menu_contribution")
      .update({ status: "approved", published: true, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("recipe_admin_audit_log").insert({
      admin_id: adminId,
      action: "approve",
      target_type: "recipe",
      target_id: id,
    });
  },

  async rejectSubmission(id: string, adminId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from("my20fit_menu_contribution")
      .update({
        status: "rejected",
        published: false,
        reject_reason: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("recipe_admin_audit_log").insert({
      admin_id: adminId,
      action: "reject",
      target_type: "recipe",
      target_id: id,
      detail: { reason },
    });
  },

  async getArticles(): Promise<ArticleRow[]> {
    const { data, error } = await supabase
      .from("my20fit_recipe_article")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as ArticleRow[];
  },

  // Publish/unpublish: kolom asli 'status' (draft|published), bukan boolean 'published'.
  async updateArticlePublished(id: string, published: boolean, adminId: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("my20fit_recipe_article")
      .update({
        status: published ? "published" : "draft",
        published_at: published ? now : null,
        updated_at: now,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("recipe_admin_audit_log").insert({
      admin_id: adminId,
      action: published ? "publish" : "unpublish",
      target_type: "article",
      target_id: id,
    });
  },

  // Tulis artikel baru. Insert langsung ke tabel (RLS "recipe_admin_manage_articles"
  // sudah mengizinkan admin). Kolom legacy single-lang diisi dari versi ID biar artikel
  // tetap render di path lama maupun bilingual.
  async createArticle(input: ArticleCreateInput, adminId: string): Promise<ArticleRow> {
    const now = new Date().toISOString();
    const row = {
      slug: input.slug,
      title_id: input.title_id,
      title_en: input.title_en,
      excerpt_id: input.excerpt_id || null,
      excerpt_en: input.excerpt_en || null,
      body_md_id: input.body_md_id,
      body_md_en: input.body_md_en,
      category_id: input.category_id || null,
      category_en: input.category_en || null,
      cover_url: input.cover_url || null,
      author_name: input.author_name || null,
      status: input.status,
      published_at: input.status === "published" ? now : null,
      // Mirror ke kolom legacy (single-lang) — semua 67 artikel lama punya keduanya.
      title: input.title_id,
      excerpt: input.excerpt_id || null,
      body_md: input.body_md_id,
      category: input.category_id || null,
    };

    const { data, error } = await supabase
      .from("my20fit_recipe_article")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("recipe_admin_audit_log").insert({
      admin_id: adminId,
      action: "create_article",
      target_type: "article",
      target_id: String((data as { id: string }).id),
      detail: { slug: input.slug, status: input.status },
    });

    return data as ArticleRow;
  },

  async getAuditLog(limit = 50): Promise<AuditEntry[]> {
    const { data, error } = await supabase
      .from("recipe_admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as AuditEntry[];
  },

  async listAdmins(): Promise<AdminMember[]> {
    const { data, error } = await supabase.rpc("list_recipe_admins");
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminMember[];
  },

  async createAdminAccount(email: string, password: string, role: AdminRole): Promise<string> {
    const { data, error } = await supabase.rpc("create_recipe_admin_account", {
      p_email: email,
      p_password: password,
      p_role: role,
    });
    if (error) throw new Error(error.message);
    return data as string;
  },

  async updateAdminRole(targetUserId: string, newRole: AdminRole): Promise<void> {
    const { error } = await supabase.rpc("update_recipe_admin_role", {
      p_target_user_id: targetUserId,
      p_new_role: newRole,
    });
    if (error) throw new Error(error.message);
  },

  async removeAdmin(targetUserId: string): Promise<void> {
    const { error } = await supabase.rpc("remove_recipe_admin", {
      p_target_user_id: targetUserId,
    });
    if (error) throw new Error(error.message);
  },

  // Ganti password akun sendiri (dipakai gerbang "wajib ganti password saat login pertama").
  async setMyPassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  // Matikan flag must_change_password untuk akun sendiri (RPC SECURITY DEFINER).
  async clearMustChangePassword(): Promise<void> {
    const { error } = await supabase.rpc("clear_recipe_admin_must_change");
    if (error) throw new Error(error.message);
  },
};
