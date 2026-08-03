import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { studentSchema } from "@/lib/students.shared";
import {
  STUDENT_COLUMNS,
  applyFilters,
  assertNoDuplicates,
  buildDocRows,
  diffChanges,
  filterSchema,
  normalize,
  splitPayload,
} from "@/lib/students.server-helpers";

export const listStudentsAdvanced = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    let q = context.supabase
      .from("students")
      .select(
        `${STUDENT_COLUMNS}, course:courses(id, code, name), branch:branches(id, code, name), batch:batches(id, code, name)`,
        { count: "exact" },
      )
      .is("deleted_at", null);
    q = applyFilters(q, data);
    const { data: rows, error, count } = await q
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as any[], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const exportStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("students")
      .select(`${STUDENT_COLUMNS}, course:courses(code, name), branch:branches(name), batch:batches(name)`)
      .is("deleted_at", null);
    q = applyFilters(q, data);
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(5000);
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const studentStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    const base = () => context.supabase.from("students").select("id", { count: "exact", head: true }).is("deleted_at", null);
    const [total, active, completed, dropped, thisMonth, todayCount, pending, rows] = await Promise.all([
      base(),
      base().eq("status", "active"),
      base().in("status", ["completed", "passed_out"]),
      base().eq("status", "dropped"),
      base().gte("created_at", monthStart),
      base().eq("joined_at", today),
      context.supabase.from("admissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      context.supabase
        .from("students")
        .select("created_at, gender, course_id, branch_id, course:courses(name), branch:branches(name)")
        .is("deleted_at", null)
        .limit(5000),
    ]);

    const all = (rows.data ?? []) as any[];
    const series: Array<{ month: string; students: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      series.push({
        month: d.toLocaleString("en-IN", { month: "short" }),
        students: all.filter((r) => {
          const c = new Date(r.created_at);
          return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear();
        }).length,
      });
    }
    const tally = (key: (r: any) => string) => {
      const m = new Map<string, number>();
      for (const r of all) {
        const k = key(r) || "Unassigned";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    };

    return {
      total: total.count ?? 0,
      active: active.count ?? 0,
      completed: completed.count ?? 0,
      dropped: dropped.count ?? 0,
      thisMonth: thisMonth.count ?? 0,
      inactive: (total.count ?? 0) - (active.count ?? 0),
      today: todayCount.count ?? 0,
      pendingAdmissions: pending.count ?? 0,
      series,
      byCourse: tally((r) => r.course?.name).slice(0, 8),
      byBranch: tally((r) => r.branch?.name).slice(0, 8),
      byGender: tally((r) => r.gender),
    };
  });

export const getStudent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: student, error } = await context.supabase
      .from("students")
      .select(
        `${STUDENT_COLUMNS}, course:courses(id, code, name, duration, fees), branch:branches(id, code, name, city), batch:batches(id, code, name, timing)`,
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!student) throw new Error("Student not found");

    const [docs, history, fees, attendance, results, certificates] = await Promise.all([
      context.supabase.from("student_documents").select("id, kind, title, file_path, verified, created_at").eq("student_id", data.id),
      context.supabase
        .from("student_edit_history")
        .select("id, action, changes, changed_by_email, created_at")
        .eq("student_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase.from("student_fees").select("id, total_amount, paid_amount, due_amount, status").eq("student_id", data.id),
      context.supabase.from("attendance").select("status").eq("student_id", data.id).limit(2000),
      context.supabase
        .from("student_results")
        .select("id, percentage, grade, result_status, created_at, exam:exams(name)")
        .eq("student_id", data.id)
        .order("created_at", { ascending: false })
        .limit(20),
      context.supabase
        .from("certificates")
        .select("id, certificate_number, certificate_type, issue_date")
        .eq("student_id", data.id)
        .order("issue_date", { ascending: false })
        .limit(20),
    ]);

    const att = (attendance.data ?? []) as any[];
    const present = att.filter((a) => a.status === "present" || a.status === "late").length;
    const feeRows = (fees.data ?? []) as any[];

    return {
      student: student as any,
      documents: (docs.data ?? []) as any[],
      history: (history.data ?? []) as any[],
      fees: {
        total: feeRows.reduce((s, f) => s + Number(f.total_amount ?? 0), 0),
        paid: feeRows.reduce((s, f) => s + Number(f.paid_amount ?? 0), 0),
        due: feeRows.reduce((s, f) => s + Number(f.due_amount ?? 0), 0),
      },
      attendance: { total: att.length, present, percent: att.length ? Math.round((present / att.length) * 100) : 0 },
      results: (results.data ?? []) as any[],
      certificates: (certificates.data ?? []) as any[],
    };
  });

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => studentSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { record, docs } = splitPayload(normalize(data));
    await assertNoDuplicates(context.supabase, record, null);

    const { data: created, error } = await context.supabase
      .from("students")
      .insert({ ...record, created_by: context.userId, updated_by: context.userId } as any)
      .select("id, student_code, enrollment_no, admission_number")
      .single();
    if (error) throw new Error(error.message);

    const docRows = buildDocRows(created.id, docs, context.userId);
    if (docRows.length) await context.supabase.from("student_documents").insert(docRows as any);
    await context.supabase.from("student_edit_history").insert({
      student_id: created.id,
      changed_by: context.userId,
      changed_by_email: (context.claims as any)?.email ?? null,
      action: "create",
      changes: { created: record },
    } as any);
    return created as any;
  });

export const updateStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), values: studentSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { record, docs } = splitPayload(normalize(data.values));
    await assertNoDuplicates(context.supabase, record, data.id);
    const { data: before } = await context.supabase.from("students").select(STUDENT_COLUMNS).eq("id", data.id).maybeSingle();
    const { error } = await context.supabase
      .from("students")
      .update({ ...record, updated_by: context.userId } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const docRows = buildDocRows(data.id, docs, context.userId);
    for (const row of docRows) {
      await context.supabase.from("student_documents").delete().eq("student_id", data.id).eq("kind", row.kind);
      await context.supabase.from("student_documents").insert(row as any);
    }
    const changes = diffChanges(before as any, record);
    if (Object.keys(changes).length) {
      await context.supabase.from("student_edit_history").insert({
        student_id: data.id,
        changed_by: context.userId,
        changed_by_email: (context.claims as any)?.email ?? null,
        action: "update",
        changes,
      } as any);
    }
    return { ok: true };
  });

export const setStudentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.string().max(30) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("students")
      .update({ status: data.status, updated_by: context.userId } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("student_edit_history").insert({
      student_id: data.id,
      changed_by: context.userId,
      changed_by_email: (context.claims as any)?.email ?? null,
      action: "status",
      changes: { status: data.status },
    } as any);
    return { ok: true };
  });

export const deleteStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("students")
      .update({ deleted_at: new Date().toISOString(), updated_by: context.userId } as any)
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    await context.supabase.from("student_edit_history").insert(
      data.ids.map((id) => ({
        student_id: id,
        changed_by: context.userId,
        changed_by_email: (context.claims as any)?.email ?? null,
        action: "delete",
        changes: { deleted: true },
      })) as any,
    );
    return { ok: true, count: data.ids.length };
  });

export const importStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rows: z.array(z.record(z.string(), z.any())).min(1).max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    const errors: Array<{ row: number; message: string }> = [];
    const valid: any[] = [];

    const [branchRes, courseRes] = await Promise.all([
      context.supabase.from("branches").select("id, code, name"),
      context.supabase.from("courses").select("id, code, name"),
    ]);
    const key = (v: unknown) => String(v ?? "").trim().toLowerCase();
    const branchMap = new Map<string, string>();
    for (const b of (branchRes.data ?? []) as any[]) {
      branchMap.set(key(b.code), b.id);
      branchMap.set(key(b.name), b.id);
      branchMap.set(key(b.id), b.id);
    }
    const courseMap = new Map<string, string>();
    for (const c of (courseRes.data ?? []) as any[]) {
      courseMap.set(key(c.code), c.id);
      courseMap.set(key(c.name), c.id);
      courseMap.set(key(c.id), c.id);
    }
    const defaultBranch = ((branchRes.data ?? []) as any[])[0]?.id as string | undefined;

    data.rows.forEach((raw, i) => {
      const branchKey = key(raw.branch_id ?? raw.branch_code ?? raw.branch);
      const courseKey = key(raw.course_id ?? raw.course_code ?? raw.course);
      const branch_id = branchKey ? branchMap.get(branchKey) : defaultBranch;
      if (!branch_id) {
        errors.push({ row: i + 2, message: branchKey ? `Unknown branch "${branchKey}"` : "branch_code is required" });
        return;
      }
      const course_id = courseKey ? courseMap.get(courseKey) : undefined;
      if (courseKey && !course_id) {
        errors.push({ row: i + 2, message: `Unknown course "${courseKey}"` });
        return;
      }
      const parsed = studentSchema.safeParse({
        ...raw,
        branch_id,
        course_id: course_id ?? "",
        batch_id: "",
        faculty_id: "",
        status: raw.status || "active",
      });
      if (!parsed.success) {
        errors.push({ row: i + 2, message: parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ") });
        return;
      }
      const { record } = splitPayload(normalize(parsed.data));
      valid.push({ row: i + 2, values: { ...record, created_by: context.userId, updated_by: context.userId } });
    });

    let inserted = 0;
    if (valid.length) {
      const { data: rows, error } = await context.supabase
        .from("students")
        .insert(valid.map((v) => v.values) as any)
        .select("id");
      if (!error) {
        inserted = rows?.length ?? 0;
      } else {
        // One bad row fails the whole batch — retry individually so good rows still land.
        for (const v of valid) {
          const single = await context.supabase.from("students").insert(v.values as any).select("id").maybeSingle();
          if (single.error) errors.push({ row: v.row, message: single.error.message });
          else inserted += 1;
        }
      }
    }
    return { inserted, failed: errors.length, errors: errors.slice(0, 50) };
  });

export const listFacultyOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("user_id").in("role", ["faculty", "branch_manager"]);
    const ids = [...new Set((roles ?? []).map((r: any) => r.user_id))];
    if (!ids.length) return [];
    const { data } = await context.supabase.from("profiles").select("id, full_name, email").in("id", ids).order("full_name");
    return (data ?? []) as any[];
  });

export const signStudentFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ paths: z.array(z.string().max(500)).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const out: Record<string, string> = {};
    for (const path of data.paths) {
      if (!path) continue;
      if (path.startsWith("http")) {
        out[path] = path;
        continue;
      }
      const bucket = path.startsWith("students/") ? "documents" : "student-photos";
      const { data: signed } = await context.supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (signed?.signedUrl) out[path] = signed.signedUrl;
    }
    return out;
  });