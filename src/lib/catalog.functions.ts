import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { batchSchema, courseSchema } from "@/lib/courses.shared";
import {
  BATCH_COLUMNS,
  COURSE_COLUMNS,
  applyBatchFilters,
  applyCourseFilters,
  batchFilterSchema,
  courseFilterSchema,
  daysOverlap,
  groupCount,
  normalizeRecord,
  slugify,
  timeOverlap,
} from "@/lib/catalog.server-helpers";

/* ----------------------------- COURSES ----------------------------- */

export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => courseFilterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    let q = context.supabase
      .from("courses")
      .select(COURSE_COLUMNS, { count: "exact" })
      .is("deleted_at", null);
    q = applyCourseFilters(q, data);
    const { data: rows, error, count } = await q
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as any[], total: count ?? 0 };
  });

export const exportCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => courseFilterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("courses").select(COURSE_COLUMNS).is("deleted_at", null);
    q = applyCourseFilters(q, data);
    const { data: rows, error } = await q.order("name", { ascending: true }).limit(5000);
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const courseStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("courses")
      .select("id, category, status, duration, duration_unit, course_fee")
      .is("deleted_at", null)
      .limit(5000);
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as any[];
    const shortTerm = list.filter((r) => {
      const n = Number(String(r.duration ?? "").replace(/\D/g, "")) || 0;
      if (r.duration_unit === "months") return n > 0 && n <= 3;
      return r.duration_unit === "days" || r.duration_unit === "weeks";
    }).length;
    return {
      total: list.length,
      active: list.filter((r) => r.status === "active").length,
      inactive: list.filter((r) => r.status === "inactive").length,
      archived: list.filter((r) => r.status === "archived").length,
      jobOriented: list.filter((r) => ["Programming", "Skill Development", "Digital Marketing", "Accounting"].includes(r.category)).length,
      government: list.filter((r) => r.category === "Government Courses").length,
      shortTerm,
      byCategory: groupCount(list, (r) => r.category),
    };
  });

export const saveCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => courseSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload: Record<string, any> = normalizeRecord({ ...rest, slug: slugify(rest.name) });
    payload['updated_by'] = context.userId;
    if (!payload['code']) {
      const { data: code, error: e } = await context.supabase.rpc("next_course_code");
      if (e) throw new Error(e.message);
      payload['code'] = code;
    }
    const dupQ = context.supabase.from("courses").select("id").ilike("code", payload['code']).is("deleted_at", null);
    const { data: dup } = id ? await dupQ.neq("id", id) : await dupQ;
    if (dup && dup.length) throw new Error("A course with this code already exists");

    if (id) {
      const { error } = await context.supabase.from("courses").update(payload as any).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    payload['created_by'] = context.userId;
    const { data: row, error } = await context.supabase.from("courses").insert(payload as any).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const duplicateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase
      .from("courses").select(COURSE_COLUMNS).eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: code, error: e2 } = await context.supabase.rpc("next_course_code");
    if (e2) throw new Error(e2.message);
    const clone: Record<string, any> = { ...(src as any) };
    delete clone['id']; delete clone['created_at']; delete clone['updated_at'];
    clone['code'] = code;
    clone['name'] = `${clone['name']} (Copy)`;
    clone['slug'] = slugify(clone['name']);
    clone['status'] = "inactive";
    clone['created_by'] = context.userId;
    const { data: row, error: e3 } = await context.supabase.from("courses").insert(clone as any).select("id").single();
    if (e3) throw new Error(e3.message);
    return { id: row.id };
  });

export const setCourseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1), status: z.enum(["active", "inactive", "archived"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("courses").update({ status: data.status, updated_by: context.userId }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { count: data.ids.length };
  });

export const deleteCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { count } = await context.supabase
      .from("batches").select("id", { count: "exact", head: true })
      .in("course_id", data.ids).is("deleted_at", null);
    if ((count ?? 0) > 0) throw new Error("Cannot delete: batches are still linked to the selected course(s)");
    const { error } = await context.supabase
      .from("courses")
      .update({ deleted_at: new Date().toISOString(), status: "archived", updated_by: context.userId })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { count: data.ids.length };
  });

export const importCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rows: z.array(z.record(z.string(), z.any())).max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    let ok = 0;
    const errors: string[] = [];
    for (const [i, raw] of data.rows.entries()) {
      try {
        const parsed = courseSchema.parse({
          name: raw['name'] ?? raw['Course Name'] ?? "",
          code: raw['code'] ?? raw['Course Code'] ?? "",
          short_name: raw['short_name'] ?? raw['Short Name'] ?? "",
          category: raw['category'] ?? raw['Category'] ?? "Computer Courses",
          duration: String(raw['duration'] ?? raw['Duration'] ?? ""),
          duration_unit: (raw['duration_unit'] ?? raw['Duration Unit'] ?? "months") as any,
          course_fee: raw['course_fee'] ?? raw['Course Fee'] ?? 0,
          registration_fee: raw['registration_fee'] ?? raw['Registration Fee'] ?? 0,
          exam_fee: raw['exam_fee'] ?? raw['Exam Fee'] ?? 0,
          certificate_type: raw['certificate_type'] ?? raw['Certificate Type'] ?? "",
          medium: raw['medium'] ?? raw['Medium'] ?? "",
          eligibility: raw['eligibility'] ?? raw['Eligibility'] ?? "",
          status: (raw['status'] ?? raw['Status'] ?? "active") as any,
        });
        const payload: Record<string, any> = normalizeRecord({ ...parsed, slug: slugify(parsed.name) });
        delete payload['id'];
        if (!payload['code']) {
          const { data: code } = await context.supabase.rpc("next_course_code");
          payload['code'] = code;
        }
        payload['created_by'] = context.userId;
        const { error } = await context.supabase.from("courses").insert(payload as any);
        if (error) throw new Error(error.message);
        ok++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }
    return { ok, failed: errors.length, errors: errors.slice(0, 20) };
  });

/* ----------------------------- BATCHES ----------------------------- */

export const listBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => batchFilterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    let q = context.supabase
      .from("batches")
      .select(
        `${BATCH_COLUMNS}, course:courses(id, name, code), branch:branches(id, name, code), teacher:teachers(id, full_name, teacher_id)`,
        { count: "exact" },
      )
      .is("deleted_at", null);
    q = applyBatchFilters(q, data);
    const { data: rows, error, count } = await q
      .order(data.sortBy, { ascending: data.sortDir === "asc" })
      .range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as any[], total: count ?? 0 };
  });

export const exportBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => batchFilterSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("batches")
      .select(`${BATCH_COLUMNS}, course:courses(name), branch:branches(name), teacher:teachers(full_name)`)
      .is("deleted_at", null);
    q = applyBatchFilters(q, data);
    const { data: rows, error } = await q.order("created_at", { ascending: false }).limit(5000);
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const batchStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("batches")
      .select("id, status, session, current_strength, capacity, course:courses(name), teacher:teachers(full_name), branch:branches(name)")
      .is("deleted_at", null)
      .limit(5000);
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as any[];
    const bySession = (s: string) => list.filter((r) => r.session === s).length;
    return {
      total: list.length,
      running: list.filter((r) => r.status === "running").length,
      upcoming: list.filter((r) => r.status === "upcoming").length,
      completed: list.filter((r) => r.status === "completed").length,
      morning: bySession("Morning"),
      afternoon: bySession("Afternoon"),
      evening: bySession("Evening"),
      weekend: bySession("Weekend"),
      students: list.reduce((s, r) => s + Number(r.current_strength ?? 0), 0),
      byCourse: groupCount(list, (r) => r.course?.name),
      byTeacher: groupCount(list, (r) => r.teacher?.full_name),
      byBranch: groupCount(list, (r) => r.branch?.name),
    };
  });

export const saveBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => batchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload: Record<string, any> = normalizeRecord({ ...rest, timing: rest.session });
    payload['updated_by'] = context.userId;
    if (!payload['code']) {
      const { data: code, error: e } = await context.supabase.rpc("next_batch_code");
      if (e) throw new Error(e.message);
      payload['code'] = code;
    }
    const dupQ = context.supabase.from("batches").select("id").ilike("code", payload['code']).is("deleted_at", null);
    const { data: dup } = id ? await dupQ.neq("id", id) : await dupQ;
    if (dup && dup.length) throw new Error("A batch with this code already exists");

    // capacity check against current strength
    if (id) {
      const { data: cur } = await context.supabase.from("batches").select("current_strength").eq("id", id).maybeSingle();
      if (cur && Number(cur.current_strength ?? 0) > Number(payload['capacity'])) {
        throw new Error(`Capacity cannot be lower than the current strength (${cur.current_strength})`);
      }
    }

    // teacher schedule conflict
    if (payload['teacher_id']) {
      const { data: others } = await context.supabase
        .from("batches")
        .select("id, code, name, days, start_time, end_time, status")
        .eq("teacher_id", payload['teacher_id'])
        .is("deleted_at", null)
        .neq("status", "completed")
        .neq("status", "cancelled");
      const clash = (others ?? []).find(
        (b: any) =>
          b.id !== id &&
          daysOverlap(payload['days'], b.days) &&
          timeOverlap(payload['start_time'], payload['end_time'], b.start_time, b.end_time),
      );
      if (clash) throw new Error(`Teacher schedule conflict with batch ${clash.code} (${clash.name})`);
    }

    if (id) {
      const { error } = await context.supabase.from("batches").update(payload as any).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    payload['created_by'] = context.userId;
    const { data: row, error } = await context.supabase.from("batches").insert(payload as any).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const setBatchStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).min(1), status: z.enum(["upcoming", "running", "completed", "cancelled"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("batches").update({ status: data.status, updated_by: context.userId }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { count: data.ids.length };
  });

export const deleteBatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { count } = await context.supabase
      .from("students").select("id", { count: "exact", head: true }).in("batch_id", data.ids).is("deleted_at", null);
    if ((count ?? 0) > 0) throw new Error("Cannot delete: students are still assigned to the selected batch(es)");
    const { error } = await context.supabase
      .from("batches")
      .update({ deleted_at: new Date().toISOString(), status: "cancelled", updated_by: context.userId })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { count: data.ids.length };
  });

export const importBatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rows: z.array(z.record(z.string(), z.any())).max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: courses }, { data: branches }] = await Promise.all([
      context.supabase.from("courses").select("id, code, name").is("deleted_at", null),
      context.supabase.from("branches").select("id, code, name"),
    ]);
    const findBy = (list: any[] | null, v: string) =>
      (list ?? []).find((x) => [x.code, x.name].some((f: string) => String(f ?? "").toLowerCase() === String(v ?? "").toLowerCase()));
    let ok = 0;
    const errors: string[] = [];
    for (const [i, raw] of data.rows.entries()) {
      try {
        const course = findBy(courses, raw['course'] ?? raw['Course'] ?? "");
        const branch = findBy(branches, raw['branch'] ?? raw['Branch'] ?? "");
        if (!course) throw new Error("Course not found");
        if (!branch) throw new Error("Branch not found");
        const parsed = batchSchema.parse({
          name: raw['name'] ?? raw['Batch Name'] ?? "",
          code: raw['code'] ?? raw['Batch Code'] ?? "",
          course_id: course.id,
          branch_id: branch.id,
          session: (raw['session'] ?? raw['Session'] ?? "Morning") as any,
          start_date: String(raw['start_date'] ?? raw['Start Date'] ?? ""),
          end_date: String(raw['end_date'] ?? raw['End Date'] ?? ""),
          start_time: String(raw['start_time'] ?? raw['Start Time'] ?? ""),
          end_time: String(raw['end_time'] ?? raw['End Time'] ?? ""),
          capacity: raw['capacity'] ?? raw['Capacity'] ?? 30,
          room_number: String(raw['room_number'] ?? raw['Room'] ?? ""),
          status: (raw['status'] ?? raw['Status'] ?? "upcoming") as any,
        });
        const payload: Record<string, any> = normalizeRecord({ ...parsed, timing: parsed.session });
        delete payload['id'];
        if (!payload['code']) {
          const { data: code } = await context.supabase.rpc("next_batch_code");
          payload['code'] = code;
        }
        payload['created_by'] = context.userId;
        const { error } = await context.supabase.from("batches").insert(payload as any);
        if (error) throw new Error(error.message);
        ok++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }
    return { ok, failed: errors.length, errors: errors.slice(0, 20) };
  });

/* -------------------------- ASSIGNMENTS --------------------------- */

export const listBatchStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ batchId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("students")
      .select("id, student_code, enrollment_no, full_name, mobile, status, course:courses(name)")
      .eq("batch_id", data.batchId)
      .is("deleted_at", null)
      .order("full_name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const listAssignableStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ courseId: z.string().uuid().optional(), branchId: z.string().uuid().optional(), q: z.string().max(120).optional().default("") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("students")
      .select("id, student_code, enrollment_no, full_name, mobile, batch_id, course_id, batch:batches(code, name)")
      .is("deleted_at", null)
      .limit(200);
    if (data.courseId) q = q.eq("course_id", data.courseId);
    if (data.branchId) q = q.eq("branch_id", data.branchId);
    if (data.q) {
      const t = data.q.replace(/[%,()]/g, "");
      q = q.or(`full_name.ilike.%${t}%,student_code.ilike.%${t}%,enrollment_no.ilike.%${t}%,mobile.ilike.%${t}%`);
    }
    const { data: rows, error } = await q.order("full_name");
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

export const assignStudentsToBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ batchId: z.string().uuid(), studentIds: z.array(z.string().uuid()).min(1), force: z.boolean().optional().default(false) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: batch, error } = await context.supabase
      .from("batches").select("id, capacity, current_strength, course_id, status").eq("id", data.batchId).single();
    if (error) throw new Error(error.message);
    if (batch.status === "completed" || batch.status === "cancelled") throw new Error("Cannot assign students to a closed batch");

    const { data: students, error: e2 } = await context.supabase
      .from("students").select("id, full_name, batch_id").in("id", data.studentIds).is("deleted_at", null);
    if (e2) throw new Error(e2.message);
    const fresh = (students ?? []).filter((s) => s.batch_id !== data.batchId);
    const conflicted = fresh.filter((s) => s.batch_id);
    if (conflicted.length && !data.force) {
      throw new Error(`${conflicted.length} student(s) already belong to another batch. Use "Transfer" to move them.`);
    }
    const free = Number(batch.capacity ?? 0) - Number(batch.current_strength ?? 0);
    if (fresh.length > free) throw new Error(`Capacity exceeded: only ${Math.max(free, 0)} seat(s) left in this batch`);

    const { error: e3 } = await context.supabase
      .from("students")
      .update({ batch_id: data.batchId, course_id: batch.course_id })
      .in("id", fresh.map((s) => s.id));
    if (e3) throw new Error(e3.message);
    return { count: fresh.length };
  });

export const removeStudentsFromBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ studentIds: z.array(z.string().uuid()).min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("students").update({ batch_id: null }).in("id", data.studentIds);
    if (error) throw new Error(error.message);
    return { count: data.studentIds.length };
  });

export const assignBatchTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ batchId: z.string().uuid(), teacherId: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.teacherId) {
      const { data: target } = await context.supabase
        .from("batches").select("id, days, start_time, end_time").eq("id", data.batchId).single();
      const { data: others } = await context.supabase
        .from("batches").select("id, code, name, days, start_time, end_time")
        .eq("teacher_id", data.teacherId).is("deleted_at", null)
        .neq("status", "completed").neq("status", "cancelled");
      const clash = (others ?? []).find(
        (b: any) =>
          b.id !== data.batchId &&
          daysOverlap(target?.days as any, b.days) &&
          timeOverlap(target?.start_time as any, target?.end_time as any, b.start_time, b.end_time),
      );
      if (clash) throw new Error(`Teacher schedule conflict with batch ${clash.code} (${clash.name})`);
    }
    const { error } = await context.supabase
      .from("batches").update({ teacher_id: data.teacherId, updated_by: context.userId }).eq("id", data.batchId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTeacherOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("teachers").select("id, full_name, teacher_id, branch_id")
      .is("deleted_at", null).eq("status", "active").order("full_name").limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const catalogReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: students }, { data: batches }, { data: courses }] = await Promise.all([
      context.supabase.from("students")
        .select("id, course_id, batch_id, branch_id, course:courses(name, course_fee), branch:branches(name), batch:batches(name)")
        .is("deleted_at", null).limit(5000),
      context.supabase.from("batches")
        .select("id, name, status, course:courses(name), branch:branches(name), teacher:teachers(full_name), current_strength")
        .is("deleted_at", null).limit(5000),
      context.supabase.from("courses").select("id, name, course_fee").is("deleted_at", null).limit(1000),
    ]);
    const s = (students ?? []) as any[];
    const b = (batches ?? []) as any[];
    const revenue = groupCount(s, (r) => r.course?.name).map((row) => {
      const fee = ((courses ?? []) as any[]).find((c) => c.name === row.name)?.course_fee ?? 0;
      return { name: row.name, students: row.value, revenue: Number(fee) * row.value };
    });
    return {
      courseWiseStudents: groupCount(s, (r) => r.course?.name),
      branchWiseCourses: groupCount(s, (r) => `${r.branch?.name ?? "—"} · ${r.course?.name ?? "—"}`),
      batchWiseStudents: b.map((x) => ({ name: x.name, value: Number(x.current_strength ?? 0) })).sort((p, q) => q.value - p.value),
      teacherWiseBatches: groupCount(b, (r) => r.teacher?.full_name),
      running: b.filter((x) => x.status === "running").length,
      completed: b.filter((x) => x.status === "completed").length,
      revenue,
    };
  });