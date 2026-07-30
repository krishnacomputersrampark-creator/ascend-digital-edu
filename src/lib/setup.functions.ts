import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// Publishable-key server client — never needs the service role key.
function publicServerClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// Source of truth: the security-definer `super_admin_exists()` function, which
// only reports true for an APPROVED user holding the super_admin role.
// No service role key involved, and Guest/pending users can never lock setup.
export const setupAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicServerClient();
  const { data, error } = await supabase.rpc("super_admin_exists");
  if (error) throw new Error(error.message);
  return { available: data !== true, superAdmins: data === true ? 1 : 0 };
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
    // Guard first with the publishable client (no privileged key needed).
    const pub = publicServerClient();
    const { data: exists, error: exErr } = await pub.rpc("super_admin_exists");
    if (exErr) throw new Error(exErr.message);
    if (exists === true) {
      throw new Error("Setup has already been completed. An approved Super Admin already exists.");
    }

    // The service role key stays server-side only. If it is unavailable in this
    // environment, tell the client to use the self-service fallback (sign up /
    // sign in with the publishable key, then call the claim_super_admin RPC).
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("NO_ADMIN_KEY");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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