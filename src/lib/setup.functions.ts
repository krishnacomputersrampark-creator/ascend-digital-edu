import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const setupAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Source of truth: an APPROVED user that actually holds the super_admin role.
  // Never rely on a cached flag / settings row — Guest or pending users must not lock setup.
  const { data: roleRows, error: rErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin");
  if (rErr) throw new Error(rErr.message);

  const ids = (roleRows ?? []).map((r: { user_id: string }) => r.user_id);
  if (ids.length === 0) return { available: true, superAdmins: 0 };

  const { data: approved, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .in("id", ids)
    .eq("status", "approved");
  if (pErr) throw new Error(pErr.message);

  const count = approved?.length ?? 0;
  return { available: count === 0, superAdmins: count };
});

const bootstrapSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    password: z.string().min(8, "Minimum 8 characters").max(72),
    confirm_password: z.string(),
    institute_name: z.string().trim().min(2).max(160),
    branch: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const bootstrapSuperAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bootstrapSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: saRoles, error: exErr } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "super_admin");
    if (exErr) throw new Error(exErr.message);
    const saIds = (saRoles ?? []).map((r: { user_id: string }) => r.user_id);
    if (saIds.length > 0) {
      const { data: approvedSa } = await supabaseAdmin
        .from("profiles").select("id").in("id", saIds).eq("status", "approved");
      if ((approvedSa?.length ?? 0) > 0) {
        throw new Error("Setup has already been completed. An approved Super Admin already exists.");
      }
    }

    // Resolve or create the branch
    let branchId: string | null = null;
    const { data: branch } = await supabaseAdmin
      .from("branches").select("id").ilike("name", data.branch).maybeSingle();
    if (branch?.id) {
      branchId = branch.id;
    } else {
      const code = data.branch.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "MAIN";
      const { data: created } = await supabaseAdmin
        .from("branches").insert({ name: data.branch, code }).select("id").maybeSingle();
      branchId = created?.id ?? null;
    }

    // Create the auth account. If the email already belongs to an existing
    // (e.g. Guest / pending) account, promote that account instead of failing.
    let uid: string | null = null;
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone },
    });
    if (created?.user) {
      uid = created.user.id;
    } else {
      const alreadyRegistered = /already|exists|registered/i.test(cErr?.message ?? "");
      if (!alreadyRegistered) throw new Error(cErr?.message ?? "Could not create the Super Admin account");

      const { data: existing } = await supabaseAdmin
        .from("profiles").select("id").ilike("email", data.email).maybeSingle();
      uid = existing?.id ?? null;
      if (!uid) throw new Error("An account with this email already exists. Please sign in or use a different email.");

      const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(uid, {
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name, phone: data.phone },
      });
      if (uErr) throw new Error(uErr.message);
    }

    const { error: pErr } = await supabaseAdmin.from("profiles").upsert({
      id: uid,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      branch_id: branchId,
      status: "approved",
      requested_role: "super_admin",
      approved_at: new Date().toISOString(),
    });
    if (pErr) throw new Error(pErr.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles").insert({ user_id: uid, role: "super_admin", branch_id: branchId });
    if (rErr) throw new Error(rErr.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: uid,
      actor_email: data.email,
      action: "setup.super_admin.created",
      entity: "profiles",
      entity_id: uid,
      meta: { institute_name: data.institute_name, branch: data.branch },
    });

    return { ok: true, email: data.email };
  });