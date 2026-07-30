import { supabase } from "@/integrations/supabase/client";
import type { UserStatus } from "@/lib/users.repo";

export const STATUS_MESSAGE: Record<Exclude<UserStatus, "approved">, string> = {
  pending: "Your account is awaiting approval. An administrator will review your registration shortly.",
  rejected: "Your registration was rejected. Please contact the institute office for assistance.",
  suspended: "Your account has been suspended. Please contact the administrator.",
  inactive: "Your account is inactive. Please contact the administrator to reactivate it.",
};

/**
 * Records the login in the audit trail and enforces the approval workflow.
 * Signs the user out and returns a message when the account is not approved.
 */
export async function enforceApprovalAfterLogin(): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc("record_login");
  if (error) return { ok: true }; // never block on audit failure
  const status = (data as string | null) ?? "pending";
  if (status === "approved") return { ok: true };
  await supabase.auth.signOut();
  return { ok: false, message: STATUS_MESSAGE[status as Exclude<UserStatus, "approved">] ?? STATUS_MESSAGE.pending };
}