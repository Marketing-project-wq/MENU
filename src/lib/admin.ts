import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type AdminRole = "admin" | "superadmin";

interface AdminState {
  isAdmin: boolean;
  role: AdminRole | null;
  loading: boolean;
}

export function useAdmin(): AdminState {
  const { user, isAuthenticated } = useAuth();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("recipe_admin_role")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (alive) {
          if (error || !data) {
            setRole(null);
          } else {
            setRole(data.role as AdminRole);
          }
        }
      } catch {
        if (alive) setRole(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [user, isAuthenticated]);

  return { isAdmin: role !== null, role, loading };
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

export interface ArticleRow {
  id: number;
  slug: string;
  title_id: string;
  title_en: string;
  summary_id: string | null;
  summary_en: string | null;
  category: string | null;
  cover_url: string | null;
  author: string | null;
  published: boolean;
  created_at: string;
  updated_at: string | null;
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

  async updateArticlePublished(id: number, published: boolean, adminId: string): Promise<void> {
    const { error } = await supabase
      .from("my20fit_recipe_article")
      .update({ published })
      .eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("recipe_admin_audit_log").insert({
      admin_id: adminId,
      action: published ? "publish" : "unpublish",
      target_type: "article",
      target_id: String(id),
    });
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
};
