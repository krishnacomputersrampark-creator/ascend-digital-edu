import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "half_day", "leave", "holiday"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const statusEnum = z.enum(ATTENDANCE_STATUSES);

/** List students for a given branch/course/batch (staff only). */
export const listStudentsForAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      branch_id: z.string().uuid().optional(),
      course_id: z.string().uuid().optional(),
      batch_id: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("students")
      .select("id, student_code, enrollment_no, full_name, phone, photo_url, branch_id, course_id, batch_id")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("full_name");
    if (data.branch_id) q = q.eq("branch_id", data.branch_id);
    if (data.course_id) q = q.eq("course_id", data.course_id);
    if (data.batch_id) q = q.eq("batch_id", data.batch_id);
    const { data: rows, error } = await q.limit(500);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Existing attendance for a date, keyed by student_id. */
export const listAttendanceForDate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      date: z.string(),
      branch_id: z.string().uuid().optional(),
      course_id: z.string().uuid().optional(),
      batch_id: z.string().uuid().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("attendance")
      .select("id, student_id, status, check_in_time, check_out_time, remarks")
      .eq("attendance_date", data.date);
    if (data.branch_id) q = q.eq("branch_id", data.branch_id);
    if (data.course_id) q = q.eq("course_id", data.course_id);
    if (data.batch_id) q = q.eq("batch_id", data.batch_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const bulkSchema = z.object({
  date: z.string().refine((d) => new Date(d) <= new Date(new Date().toDateString()), "Date cannot be in the future"),
  branch_id: z.string().uuid().optional().nullable(),
  course_id: z.string().uuid().optional().nullable(),
  batch_id: z.string().uuid().optional().nullable(),
  entries: z.array(z.object({
    student_id: z.string().uuid(),
    status: statusEnum,
    check_in_time: z.string().optional().nullable(),
    check_out_time: z.string().optional().nullable(),
    remarks: z.string().max(300).optional().nullable(),
  })).min(1),
});

export const saveAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bulkSchema.parse(d))
  .handler(async ({ data, context }) => {
    const rows = data.entries.map((e) => ({
      student_id: e.student_id,
      attendance_date: data.date,
      branch_id: data.branch_id ?? null,
      course_id: data.course_id ?? null,
      batch_id: data.batch_id ?? null,
      status: e.status,
      check_in_time: e.check_in_time || null,
      check_out_time: e.check_out_time || null,
      remarks: e.remarks || null,
      marked_by: context.userId,
    }));
    const { error } = await context.supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,attendance_date" });
    if (error) throw new Error(error.message);

    // Best-effort notifications
    try {
      const notifs = data.entries.map((e) => ({
        title: "Attendance marked",
        description: `Your attendance on ${data.date} was marked as ${e.status}.`,
        type: "attendance",
        student_id: e.student_id,
        created_by: context.userId,
      }));
      await context.supabase.from("notifications").insert(notifs as any);
    } catch { /* ignore */ }

    return { ok: true, count: rows.length };
  });

/** Admin history query with filters. */
export const listAttendanceHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      branch_id: z.string().uuid().optional(),
      course_id: z.string().uuid().optional(),
      batch_id: z.string().uuid().optional(),
      student_id: z.string().uuid().optional(),
      status: statusEnum.optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("attendance")
      .select("id, attendance_date, status, check_in_time, check_out_time, remarks, student:students!attendance_student_id_fkey(id, full_name, student_code, enrollment_no), branch:branches(name), course:courses(name), batch:batches(name)")
      .order("attendance_date", { ascending: false })
      .limit(1000);
    if (data.from) q = q.gte("attendance_date", data.from);
    if (data.to) q = q.lte("attendance_date", data.to);
    if (data.branch_id) q = q.eq("branch_id", data.branch_id);
    if (data.course_id) q = q.eq("course_id", data.course_id);
    if (data.batch_id) q = q.eq("batch_id", data.batch_id);
    if (data.student_id) q = q.eq("student_id", data.student_id);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as any[];
  });

/** Aggregated stats for admin dashboard cards. */
export const attendanceAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ date: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const today = data.date || new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 8) + "01";

    const { data: todayRows } = await context.supabase
      .from("attendance").select("status").eq("attendance_date", today);
    const { data: monthRows } = await context.supabase
      .from("attendance").select("attendance_date, status").gte("attendance_date", monthStart).lte("attendance_date", today);

    const count = (arr: any[] | null, s: string) => (arr ?? []).filter((r) => r.status === s).length;
    const present = count(todayRows, "present");
    const absent = count(todayRows, "absent");
    const late = count(todayRows, "late");
    const total = (todayRows ?? []).length;
    const pct = total ? Math.round((present + late) / total * 100) : 0;

    // Build daily trend for month
    const trendMap = new Map<string, { date: string; present: number; absent: number; late: number }>();
    (monthRows ?? []).forEach((r: any) => {
      const key = r.attendance_date;
      const cur = trendMap.get(key) ?? { date: key, present: 0, absent: 0, late: 0 };
      if (r.status === "present") cur.present++;
      else if (r.status === "absent") cur.absent++;
      else if (r.status === "late") cur.late++;
      trendMap.set(key, cur);
    });
    const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return { today, present, absent, late, total, pct, trend };
  });

/** Student self-service: fetch own attendance for a month. */
export const myAttendanceMonth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: s } = await context.supabase
      .from("students").select("id").eq("user_id", context.userId).maybeSingle();
    if (!s) return { rows: [], student_id: null };
    const start = `${data.year}-${String(data.month).padStart(2, "0")}-01`;
    const endD = new Date(data.year, data.month, 0);
    const end = `${data.year}-${String(data.month).padStart(2, "0")}-${String(endD.getDate()).padStart(2, "0")}`;
    const { data: rows, error } = await context.supabase
      .from("attendance")
      .select("id, attendance_date, status, check_in_time, check_out_time, remarks")
      .eq("student_id", s.id)
      .gte("attendance_date", start)
      .lte("attendance_date", end)
      .order("attendance_date");
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], student_id: s.id };
  });