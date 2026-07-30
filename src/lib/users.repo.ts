import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";

export type UserStatus = "pending" | "approved" | "rejected" | "suspended" | "inactive";

export const USER_STATUSES: UserStatus[] = ["pending", "approved", "rejected", "suspended", "inactive"];

export const STATUS_LABEL: Record<UserStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  inactive: "Inactive",
};

export const STATUS_CLASS: Record<UserStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-orange-50 text-orange-700 border-orange-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
};

export type ManagedUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  photo_url: string | null;
  role: AppRole | null;
  requested_role: AppRole | null;
  status: UserStatus;
  branch_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  last_login: string | null;
  created_at: string | null;
};

export type UserQuery = {
  q?: string;
  status?: UserStatus | "all";
  role?: AppRole | "all";
  branchId?: string | "all";
  page?: number;
  pageSize?: number;
};

export type UserPage = { rows: ManagedUser[]; total: number };

export async function listUsers(params: UserQuery = {}): Promise<UserPage> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const from = (page - 1) * pageSize;

  let q = supabase
    .from("user_profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (params.status && params.status !== "all") q = q.eq("status", params.status);
  if (params.role && params.role !== "all") q = q.eq("role", params.role);
  if (params.branchId && params.branchId !== "all") q = q.eq("branch_id", params.branchId);
  if (params.q?.trim()) {
    const t = params.q.trim().replace(/[%,]/g, "");
    q = q.or(`full_name.ilike.%${t}%,email.ilike.%${t}%,mobile.ilike.%${t}%`);
  }

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as ManagedUser[], total: count ?? 0 };
}

export async function countUsersByStatus(status: UserStatus): Promise<number> {
  const { count, error } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  if (error) return 0;
  return count ?? 0;
}

export async function countRegisteredToday(): Promise<number> {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", d.toISOString());
  return count ?? 0;
}

export async function listRecentlyApproved(limit = 5): Promise<ManagedUser[]> {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("status", "approved")
    .not("approved_at", "is", null)
    .order("approved_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as ManagedUser[];
}

export async function listBranchOptions(): Promise<Array<{ id: string; name: string }>> {
  const { data } = await supabase.from("branches").select("id, name").order("name");
  return data ?? [];
}

export async function approveUser(uid: string, role: AppRole, branchId?: string | null) {
  const { error } = await supabase.rpc("admin_approve_user", {
    _uid: uid,
    _role: role,
    _branch: branchId || undefined,
  });
  if (error) throw new Error(error.message);
}

export async function setUserStatus(uid: string, status: UserStatus, reason?: string) {
  const { error } = await supabase.rpc("admin_set_user_status", {
    _uid: uid,
    _status: status,
    _reason: reason || undefined,
  });
  if (error) throw new Error(error.message);
}

export async function assignRole(uid: string, role: AppRole, branchId?: string | null) {
  const { error } = await supabase.rpc("admin_assign_role", {
    _uid: uid,
    _role: role,
    _branch: branchId || undefined,
  });
  if (error) throw new Error(error.message);
}

export async function deleteUser(uid: string) {
  const { error } = await supabase.rpc("admin_delete_user", { _uid: uid });
  if (error) throw new Error(error.message);
}