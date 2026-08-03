import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const publicClient = () => {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
};

const admissionSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().min(7).max(20),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  guardian_name: z.string().max(120).optional().or(z.literal("")),
  guardian_phone: z.string().max(20).optional().or(z.literal("")),
  qualification: z.string().max(60).optional().or(z.literal("")),
  course_id: z.string().uuid().optional().or(z.literal("")),
  course_preference: z.string().max(120).optional().or(z.literal("")),
  branch_id: z.string().uuid().optional().or(z.literal("")),
  source: z.string().max(60).optional().or(z.literal("")),
  mother_name: z.string().max(120).optional().or(z.literal("")),
  father_name: z.string().max(120).optional().or(z.literal("")),
  blood_group: z.string().max(10).optional().or(z.literal("")),
  category: z.string().max(30).optional().or(z.literal("")),
  district: z.string().max(80).optional().or(z.literal("")),
  school: z.string().max(160).optional().or(z.literal("")),
  board: z.string().max(80).optional().or(z.literal("")),
  passing_year: z.string().max(10).optional().or(z.literal("")),
  percentage: z.union([z.number(), z.string()]).optional().or(z.literal("")),
  session: z.string().max(20).optional().or(z.literal("")),
  marksheet_url: z.string().max(500).optional().or(z.literal("")),
  other_documents: z.array(z.object({ name: z.string().max(160), url: z.string().max(500) })).optional(),
  alternate_mobile: z.string().max(20).optional().or(z.literal("")),
  aadhaar_number: z.string().trim().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  state: z.string().max(80).optional().or(z.literal("")),
  pincode: z.string().max(10).optional().or(z.literal("")),
  batch_id: z.string().uuid().optional().or(z.literal("")),
  preferred_timing: z.string().max(60).optional().or(z.literal("")),
  photo_url: z.string().max(500).optional().or(z.literal("")),
  signature_url: z.string().max(500).optional().or(z.literal("")),
  aadhaar_front_url: z.string().max(500).optional().or(z.literal("")),
  aadhaar_back_url: z.string().max(500).optional().or(z.literal("")),
  qualification_url: z.string().max(500).optional().or(z.literal("")),
  passport_photo_url: z.string().max(500).optional().or(z.literal("")),
});

export const submitAdmission = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => admissionSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const payload = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
    ) as any;
    if (payload.percentage != null) {
      const n = Number(payload.percentage);
      payload.percentage = Number.isFinite(n) ? n : null;
    }
    if (payload.other_documents == null) payload.other_documents = [];

    const dup = await findDuplicates(sb, {
      phone: payload.phone,
      email: payload.email,
      aadhaar_number: payload.aadhaar_number,
    });
    if (dup.length) throw new Error(dup.join(" "));

    const { data: rows, error } = await (sb as any).rpc("submit_admission", { payload });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error("Could not submit application. Please try again.");
    return row as { id: string; admission_no: string | null; application_no: string | null };
  });

async function findDuplicates(
  sb: any,
  v: { phone?: string | null; email?: string | null; aadhaar_number?: string | null },
) {
  const msgs: string[] = [];
  const check = async (table: string, col: string, val: string, label: string) => {
    const { data } = await sb.from(table).select("id").eq(col, val).limit(1);
    if (data && data.length) msgs.push(`An ${table === "students" ? "enrolled student" : "application"} with this ${label} already exists.`);
  };
  if (v.phone) { await check("admissions", "phone", v.phone, "mobile number"); await check("students", "phone", v.phone, "mobile number"); }
  if (v.email) { await check("admissions", "email", v.email, "email"); await check("students", "email", v.email, "email"); }
  if (v.aadhaar_number) { await check("admissions", "aadhaar_number", v.aadhaar_number, "Aadhaar number"); await check("students", "aadhaar_number", v.aadhaar_number, "Aadhaar number"); }
  return msgs;
}

/** Public duplicate pre-check used live by the admission wizard. */
export const checkAdmissionDuplicates = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      phone: z.string().max(20).optional().or(z.literal("")),
      email: z.string().max(255).optional().or(z.literal("")),
      aadhaar_number: z.string().max(12).optional().or(z.literal("")),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const messages = await findDuplicates(sb, {
      phone: data.phone || null,
      email: data.email || null,
      aadhaar_number: data.aadhaar_number || null,
    });
    return { ok: messages.length === 0, messages };
  });

/** Returns { role, branchId } for the caller; branch managers are scoped to their own branch. */
async function callerScope(context: any) {
  const [{ data: roles }, { data: profile }] = await Promise.all([
    context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    context.supabase.from("profiles").select("branch_id").eq("id", context.userId).maybeSingle(),
  ]);
  const list: string[] = (roles ?? []).map((r: any) => r.role);
  const isAdmin = list.includes("super_admin") || list.includes("admin");
  const isManager = list.includes("branch_manager");
  const isFaculty = list.includes("faculty") || list.includes("teacher");
  return {
    roles: list,
    isAdmin,
    canWrite: isAdmin || isManager,
    isFaculty,
    branchId: !isAdmin && isManager ? (profile?.branch_id ?? null) : null,
  };
}

export const listAdmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { status?: string; q?: string; branch_id?: string; course_id?: string; from?: string; to?: string } = {}) => d
  )
  .handler(async ({ data, context }) => {
    const scope = await callerScope(context);
    let q = context.supabase
      .from("admissions")
      .select(
        "id, admission_no, application_no, full_name, father_name, guardian_name, photo_url, phone, email, course_preference, status, created_at, branch_id, course_id, course:courses(id,name,code), branch:branches(id,name,city)"
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.branch_id) q = q.eq("branch_id", data.branch_id);
    if (scope.branchId) q = q.eq("branch_id", scope.branchId);
    if (data.course_id) q = q.eq("course_id", data.course_id);
    if (data.from) q = q.gte("created_at", new Date(data.from).toISOString());
    if (data.to) q = q.lte("created_at", new Date(`${data.to}T23:59:59`).toISOString());
    if (data.q) q = q.or(`full_name.ilike.%${data.q}%,phone.ilike.%${data.q}%,admission_no.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const admissionStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const scope = await callerScope(context);
    let q = context.supabase
      .from("admissions")
      .select("id, status, created_at, branch_id, course_id, branch:branches(name), course:courses(name)")
      .limit(5000);
    if (scope.branchId) q = q.eq("branch_id", scope.branchId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const all = (rows ?? []) as any[];
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);
    const by = (key: (r: any) => string) => {
      const m = new Map<string, number>();
      for (const r of all) { const k = key(r) || "Unassigned"; m.set(k, (m.get(k) ?? 0) + 1); }
      return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    };
    const approved = all.filter((r) => r.status === "approved").length;
    const rejected = all.filter((r) => r.status === "rejected").length;
    return {
      total: all.length,
      pending: all.filter((r) => r.status === "pending").length,
      approved,
      rejected,
      today: all.filter((r) => String(r.created_at).slice(0, 10) === today).length,
      thisMonth: all.filter((r) => String(r.created_at).slice(0, 7) === month).length,
      approvalRatio: all.length ? Math.round((approved / all.length) * 100) : 0,
      byBranch: by((r) => r.branch?.name),
      byCourse: by((r) => r.course?.name),
      canWrite: scope.canWrite,
      scopedBranchId: scope.branchId,
    };
  });

export const requestAdmissionDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), note: z.string().trim().min(3).max(500) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("admissions")
      .update({
        documents_requested_at: new Date().toISOString(),
        documents_requested_note: data.note,
        remarks: data.note,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateAdmissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "approved", "rejected", "cancelled"]),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("admissions")
      .update({ status: data.status, reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const convertAdmissionToStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), branch_id: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: a, error: aErr } = await context.supabase
      .from("admissions").select("*").eq("id", data.id).single();
    if (aErr || !a) throw new Error(aErr?.message ?? "Admission not found");

    const { data: s, error: sErr } = await context.supabase
      .from("students")
      .insert({
        admission_id: a.id,
        full_name: a.full_name,
        email: a.email,
        phone: a.phone,
        date_of_birth: a.date_of_birth,
        gender: a.gender,
        address: a.address,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        guardian_name: a.guardian_name,
        guardian_phone: a.guardian_phone,
        qualification: a.qualification,
        course_id: a.course_id,
        branch_id: data.branch_id,
        batch_id: (a as any).batch_id ?? null,
        photo_url: (a as any).photo_url ?? null,
        father_name: (a as any).father_name ?? a.guardian_name ?? null,
        mother_name: (a as any).mother_name ?? null,
        alternate_mobile: (a as any).alternate_mobile ?? null,
        aadhaar_number: (a as any).aadhaar_number ?? null,
        blood_group: (a as any).blood_group ?? null,
        category: (a as any).category ?? null,
        district: (a as any).district ?? null,
        session: (a as any).session ?? null,
        created_by: context.userId,
      })
      .select("id, student_code, enrollment_no, roll_no")
      .single();
    if (sErr) throw new Error(sErr.message);

    // Copy uploaded documents onto the new student record.
    const docs = [
      ["photo", (a as any).photo_url],
      ["signature", (a as any).signature_url],
      ["aadhaar_front", (a as any).aadhaar_front_url],
      ["aadhaar_back", (a as any).aadhaar_back_url],
      ["marksheet", (a as any).marksheet_url],
      ["qualification", (a as any).qualification_url],
      ["passport_photo", (a as any).passport_photo_url],
      ...(((a as any).other_documents ?? []) as any[]).map((d) => [d?.name ?? "other", d?.url]),
    ].filter(([, url]) => !!url) as [string, string][];
    if (docs.length) {
      await context.supabase.from("student_documents").insert(
        docs.map(([kind, url]) => ({
          student_id: s.id,
          kind,
          file_path: url,
          title: kind,
          uploaded_by: context.userId,
        }))
      );
    }

    const now = new Date().toISOString();
    await context.supabase
      .from("admissions")
      .update({
        status: "approved",
        student_id: s.id,
        reviewed_by: context.userId,
        reviewed_at: now,
        approved_by: context.userId,
        approved_at: now,
      })
      .eq("id", a.id);

    return { ...s, admission_no: a.admission_no, application_no: (a as any).application_no ?? a.admission_no };
  });

export const getAdmissionById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("admissions")
      .select("*, course:courses(id,code,name), branch:branches(id,code,name,city), batch:batches(id,code,name,timing)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row as any;
  });

export const rejectAdmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), remarks: z.string().trim().min(3).max(500) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { error } = await context.supabase
      .from("admissions")
      .update({
        status: "rejected",
        remarks: data.remarks,
        reviewed_by: context.userId,
        reviewed_at: now,
        rejected_by: context.userId,
        rejected_at: now,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateAdmissionRemarks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), remarks: z.string().max(500) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("admissions").update({ remarks: data.remarks }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listBatchesPublic = createServerFn({ method: "GET" })
  .inputValidator((d: { branch_id?: string; course_id?: string } = {}) => d)
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb.from("batches").select("id, code, name, timing, branch_id, course_id").eq("status", "active").order("name");
    if (data.branch_id) q = q.eq("branch_id", data.branch_id);
    if (data.course_id) q = q.eq("course_id", data.course_id);
    const { data: rows, error } = await q;
    if (error) return [];
    return rows ?? [];
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string; branch_id?: string; course_id?: string; status?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("students")
      .select("id, student_code, enrollment_no, full_name, phone, email, status, joined_at, branch_id, course_id, batch_id")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.branch_id) q = q.eq("branch_id", data.branch_id);
    if (data.course_id) q = q.eq("course_id", data.course_id);
    if (data.q) q = q.or(`full_name.ilike.%${data.q}%,phone.ilike.%${data.q}%,student_code.ilike.%${data.q}%,enrollment_no.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [students, admissionsPending, courses, admissionsAll] = await Promise.all([
      context.supabase.from("students").select("id", { count: "exact", head: true }).is("deleted_at", null),
      context.supabase.from("admissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      context.supabase.from("courses").select("id", { count: "exact", head: true }).eq("is_active", true),
      context.supabase.from("admissions").select("created_at, status").order("created_at", { ascending: false }).limit(500),
    ]);

    // Build 6-month series
    const now = new Date();
    const series: { month: string; admissions: number; approved: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-IN", { month: "short" });
      const inMonth = (admissionsAll.data ?? []).filter((r: any) => {
        const c = new Date(r.created_at);
        return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear();
      });
      series.push({
        month: key,
        admissions: inMonth.length,
        approved: inMonth.filter((r: any) => r.status === "approved").length,
      });
    }

    return {
      totalStudents: students.count ?? 0,
      pendingAdmissions: admissionsPending.count ?? 0,
      activeCourses: courses.count ?? 0,
      series,
    };
  });

export const listCoursesPublic = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("courses").select("id, code, name, category, duration, fees")
    .eq("is_active", true).order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listBranchesPublic = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("branches").select("id, code, name, city").eq("is_active", true).order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) throw new Error("A Super Admin already exists. Contact the existing Super Admin for role assignment.");
    const { error } = await supabaseAdmin
      .from("user_roles").insert({ user_id: context.userId, role: "super_admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });