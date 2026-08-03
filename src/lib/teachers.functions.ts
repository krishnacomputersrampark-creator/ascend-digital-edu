import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { teacherSchema } from "@/lib/teachers.shared";
import {
  TEACHER_COLUMNS,
  applyTeacherFilters,
  diffTeacher,
  normalizeTeacher,
  teacherFilterSchema,
} from "@/lib/teachers.server-helpers";

export const listTeachers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => teacherFilterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    let q = context.supabase
      .from("teachers")
      .select(`${TEACHER_COLUMNS}, branch:branches(id, code, name)`, { count: "exact" })
      .is("deleted_at", null);
    q = applyTeacherFilters(q, data);
    const { data: rows, error, count } = await q
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as any[], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const exportTeachers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => teacherFilterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("teachers")
      .select(`${TEACHER_COLUMNS}, branch:branches(name)`)
      .is("deleted_at", null);
    q = applyTeacherFilters(q, data);
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(5000);
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const teacherStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const base = () => context.supabase.from("teachers").select("id", { count: "exact", head: true }).is("deleted_at", null);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [total, active, inactive, resigned, thisMonth, rows] = await Promise.all([
      base(),
      base().eq("status", "active"),
      base().eq("status", "inactive"),
      base().eq("status", "resigned"),
      base().gte("created_at", monthStart),
      context.supabase
        .from("teachers")
        .select("department, designation, gender, salary, branch:branches(name)")
        .is("deleted_at", null)
        .limit(5000),
    ]);
    const list = (rows.data ?? []) as any[];
    const group = (key: (r: any) => string) => {
      const m = new Map<string, number>();
      for (const r of list) {
        const k = key(r) || "Unspecified";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    };
    const salaryTotal = list.reduce((s, r) => s + Number(r.salary ?? 0), 0);
    return {
      total: total.count ?? 0,
      active: active.count ?? 0,
      inactive: inactive.count ?? 0,
      resigned: resigned.count ?? 0,
      thisMonth: thisMonth.count ?? 0,
      salaryTotal,
      byDepartment: group((r) => r.department),
      byDesignation: group((r) => r.designation),
      byBranch: group((r) => r.branch?.name),
    };
  });

export const getTeacher = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: teacher, error } = await context.supabase
      .from("teachers")
      .select(`${TEACHER_COLUMNS}, branch:branches(id, code, name)`)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!teacher) throw new Error("Teacher not found");
    const [courses, batches, history] = await Promise.all([
      context.supabase.from("teacher_courses").select("course_id, course:courses(id, code, name)").eq("teacher_id", data.id),
      context.supabase.from("teacher_batches").select("batch_id, batch:batches(id, code, name, timing)").eq("teacher_id", data.id),
      context.supabase.from("teacher_edit_history").select("*").eq("teacher_id", data.id).order("created_at", { ascending: false }).limit(50),
    ]);
    return {
      teacher: teacher as any,
      courses: (courses.data ?? []) as any[],
      batches: (batches.data ?? []) as any[],
      history: (history.data ?? []) as any[],
    };
  });

export const saveTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid().nullable().optional(), values: teacherSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const payload = normalizeTeacher({ ...data.values });

    // Duplicate guards (mobile / email / aadhaar) across live records.
    const dupChecks: Array<[string, any]> = [["mobile", payload['mobile']]];
    if (payload['email']) dupChecks.push(["email", payload['email']]);
    if (payload['aadhaar_number']) dupChecks.push(["aadhaar_number", payload['aadhaar_number']]);
    for (const [col, val] of dupChecks) {
      let dq = context.supabase.from("teachers").select("id").eq(col, val).is("deleted_at", null).limit(1);
      if (data.id) dq = dq.neq("id", data.id);
      const { data: dup } = await dq;
      if (dup && dup.length) throw new Error(`Another teacher already uses this ${col.replace("_", " ")}.`);
    }

    if (data.id) {
      const { data: before } = await context.supabase.from("teachers").select("*").eq("id", data.id).maybeSingle();
      const { data: row, error } = await context.supabase
        .from("teachers")
        .update({ ...payload, updated_by: context.userId })
        .eq("id", data.id)
        .select("id, teacher_id, employee_code, full_name")
        .maybeSingle();
      if (error) throw new Error(error.message);
      await context.supabase.from("teacher_edit_history").insert({
        teacher_id: data.id,
        changed_by: context.userId,
        changed_by_email: (context.claims as any)?.email ?? null,
        action: "update",
        changes: diffTeacher(before ?? {}, payload),
      });
      return row as any;
    }

    const { data: row, error } = await context.supabase
      .from("teachers")
      .insert({ ...payload, created_by: context.userId, updated_by: context.userId } as any)
      .select("id, teacher_id, employee_code, full_name")
      .maybeSingle();
    if (error) throw new Error(error.message);
    await context.supabase.from("teacher_edit_history").insert({
      teacher_id: (row as any).id,
      changed_by: context.userId,
      changed_by_email: (context.claims as any)?.email ?? null,
      action: "create",
      changes: payload,
    });
    return row as any;
  });

export const setTeacherStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1), status: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("teachers")
      .update({ status: data.status, updated_by: context.userId })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const deleteTeachers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("teachers")
      .update({ deleted_at: new Date().toISOString(), status: "inactive", updated_by: context.userId })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    for (const id of data.ids) {
      await context.supabase.from("teacher_edit_history").insert({
        teacher_id: id,
        changed_by: context.userId,
        changed_by_email: (context.claims as any)?.email ?? null,
        action: "delete",
        changes: {},
      });
    }
    return { ok: true, count: data.ids.length };
  });

export const setTeacherAssignments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        teacherId: z.string().uuid(),
        courseIds: z.array(z.string().uuid()).default([]),
        batchIds: z.array(z.string().uuid()).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await context.supabase.from("teacher_courses").delete().eq("teacher_id", data.teacherId);
    await context.supabase.from("teacher_batches").delete().eq("teacher_id", data.teacherId);
    if (data.courseIds.length) {
      const { error } = await context.supabase
        .from("teacher_courses")
        .insert(data.courseIds.map((course_id) => ({ teacher_id: data.teacherId, course_id })));
      if (error) throw new Error(error.message);
    }
    if (data.batchIds.length) {
      const { error } = await context.supabase
        .from("teacher_batches")
        .insert(data.batchIds.map((batch_id) => ({ teacher_id: data.teacherId, batch_id })));
      if (error) throw new Error(error.message);
    }
    await context.supabase.from("teacher_edit_history").insert({
      teacher_id: data.teacherId,
      changed_by: context.userId,
      changed_by_email: (context.claims as any)?.email ?? null,
      action: "assignments",
      changes: { courses: data.courseIds.length, batches: data.batchIds.length },
    });
    return { ok: true };
  });

/** Creates (or resets) a Faculty login for a teacher. Admin-only. */
export const createTeacherLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ teacherId: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    if (!isSuper && !isAdmin) throw new Error("Forbidden");

    const { data: teacher } = await context.supabase
      .from("teachers")
      .select("id, user_id, email, full_name, mobile, branch_id")
      .eq("id", data.teacherId)
      .maybeSingle();
    if (!teacher) throw new Error("Teacher not found");
    if (!teacher.email) throw new Error("Add an email address to this teacher before creating a login.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let uid = teacher.user_id as string | null;
    if (!uid) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      uid = list?.users?.find((u) => u.email?.toLowerCase() === teacher.email!.toLowerCase())?.id ?? null;
    }
    if (uid) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
        password: data.password,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: teacher.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: teacher.full_name },
      });
      if (error) throw new Error(error.message);
      uid = created.user!.id;
    }

    await supabaseAdmin
      .from("profiles")
      .update({ full_name: teacher.full_name, phone: teacher.mobile, branch_id: teacher.branch_id, status: "approved" })
      .eq("id", uid);
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: uid, role: "faculty", branch_id: teacher.branch_id },
      { onConflict: "user_id,role" },
    );
    await context.supabase.from("teachers").update({ user_id: uid }).eq("id", data.teacherId);

    return { ok: true, uid, email: teacher.email };
  });

export const importTeachers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rows: z.array(z.record(z.string(), z.any())).min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: branches } = await context.supabase.from("branches").select("id, code, name");
    const branchOf = (v: any) => {
      const s = String(v ?? "").trim().toLowerCase();
      if (!s) return null;
      return (branches ?? []).find((b) => b.code?.toLowerCase() === s || b.name?.toLowerCase() === s)?.id ?? null;
    };
    const errors: string[] = [];
    let inserted = 0;
    for (const [i, raw] of data.rows.entries()) {
      const parsed = teacherSchema.safeParse({
        full_name: raw['Name'] ?? raw['full_name'] ?? "",
        mobile: String(raw['Mobile'] ?? raw['mobile'] ?? "").trim(),
        email: raw['Email'] ?? raw['email'] ?? "",
        qualification: raw['Qualification'] ?? "",
        experience: raw['Experience'] ?? "",
        designation: raw['Designation'] ?? "",
        department: raw['Department'] ?? "",
        subjects: raw['Subjects'] ?? "",
        joining_date: raw['Joining Date'] ?? "",
        salary: Number(raw['Salary'] ?? 0) || 0,
        branch_id: branchOf(raw['Branch']) ?? "",
        status: "active",
      });
      if (!parsed.success) {
        errors.push(`Row ${i + 2}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
        continue;
      }
      const payload = normalizeTeacher(parsed.data);
      const { error } = await context.supabase
        .from("teachers")
        .insert({ ...payload, created_by: context.userId, updated_by: context.userId } as any);
      if (error) errors.push(`Row ${i + 2}: ${error.message}`);
      else inserted += 1;
    }
    return { inserted, errors };
  });