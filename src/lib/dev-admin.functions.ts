import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const DEFAULT_ADMIN_EMAIL = "admin@krishnacomputercenter.com";
export const DEFAULT_ADMIN_PASSWORD = "Admin@12345";

function publicServerClient() {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient<Database>(process.env['SUPABASE_URL']!, key, {
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

/**
 * Ensures a fixed development Super Admin account exists.
 * Idempotent: never creates a duplicate, always verifies sign-in works.
 */
export const ensureDefaultSuperAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const pub = publicServerClient();

  // Fast path: an approved Super Admin already exists → nothing to do.
  const { data: exists } = await pub.rpc("super_admin_exists");
  if (exists === true) {
    const { data: p } = await pub
      .from("profiles").select("id").ilike("email", DEFAULT_ADMIN_EMAIL).maybeSingle();
    if (p?.id) return { ok: true, uid: p.id, created: false, email: DEFAULT_ADMIN_EMAIL };
    return { ok: true, uid: null, created: false, email: null };
  }

  if (!process.env['SUPABASE_SERVICE_ROLE_KEY']) {
    throw new Error("Server is missing admin credentials; cannot provision the default Super Admin.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Locate an existing auth user with this email (no duplicates).
  let uid: string | null = null;
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list?.users?.find((u) => u.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL);
  if (found) uid = found.id;

  let created = false;
  if (!uid) {
    const { data: c, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Super Admin", must_change_password: true },
    });
    if (cErr || !c?.user) throw new Error(cErr?.message ?? "Could not create the default Super Admin");
    uid = c.user.id;
    created = true;
  } else {
    const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(uid, {
      password: DEFAULT_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (uErr) throw new Error(uErr.message);
  }

  const { data: branch } = await supabaseAdmin.from("branches").select("id").limit(1).maybeSingle();

  const { error: pErr } = await supabaseAdmin.from("profiles").upsert({
    id: uid,
    email: DEFAULT_ADMIN_EMAIL,
    full_name: "Super Admin",
    branch_id: branch?.id ?? null,
    status: "approved",
    requested_role: "super_admin",
    approved_at: new Date().toISOString(),
  });
  if (pErr) throw new Error(pErr.message);

  const { data: roleRow } = await supabaseAdmin
    .from("user_roles").select("id").eq("user_id", uid).eq("role", "super_admin").maybeSingle();
  if (!roleRow) {
    const { error: rErr } = await supabaseAdmin
      .from("user_roles").insert({ user_id: uid, role: "super_admin", branch_id: branch?.id ?? null });
    if (rErr) throw new Error(rErr.message);
  }

  // Verify the password really works.
  const { data: s, error: sErr } = await pub.auth.signInWithPassword({
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
  });
  if (sErr || !s?.user) throw new Error(`Default Super Admin sign-in verification failed: ${sErr?.message ?? "unknown error"}`);
  await pub.auth.signOut();

  return { ok: true, uid, created, email: DEFAULT_ADMIN_EMAIL };
});
