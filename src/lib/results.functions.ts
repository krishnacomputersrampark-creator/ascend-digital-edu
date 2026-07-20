import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const EXAM_TYPES = [
  "monthly_test","quarterly_exam","half_yearly","annual_exam",
  "practical_exam","internal_assessment","final_examination",
] as const;
export const EXAM_TYPE_LABEL: Record<(typeof EXAM_TYPES)[number], string> = {
  monthly_test: "Monthly Test", quarterly_exam: "Quarterly Exam",
  half_yearly: "Half Yearly", annual_exam: "Annual Exam",
  practical_exam: "Practical Exam", internal_assessment: "Internal Assessment",
  final_examination: "Final Examination",
};
export const RESULT_STATUSES = ["draft","published","withheld","re_evaluation","cancelled"] as const;
export const RESULT_STATUS_LABEL: Record<(typeof RESULT_STATUSES)[number], string> = {
  draft: "Draft", published: "Published", withheld: "Withheld",
  re_evaluation: "Re-evaluation", cancelled: "Cancelled",
};

/* ============ SUBJECTS ============ */
const subjectSchema = z.object({
  id: z.string().uuid().optional(),
  subject_code: z.string().min(1).max(40),
  subject_name: z.string().min(1).max(160),
  course_id: z.string().uuid().nullable().optional(),
  maximum_marks: z.number().positive().default(100),
  minimum_passing_marks: z.number().nonnegative().default(40),
  theory_marks: z.number().nonnegative().default(70),
  practical_marks: z.number().nonnegative().default(30),
  status: z.string().default("active"),
});

export const listSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subjects").select("*, course:courses(id,name,code)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const saveSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => subjectSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("subjects").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("subjects").insert(data as any).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("subjects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ EXAMS ============ */
const examSchema = z.object({
  id: z.string().uuid().optional(),
  exam_name: z.string().min(1).max(160),
  exam_type: z.enum(EXAM_TYPES),
  course_id: z.string().uuid().nullable().optional(),
  batch_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  exam_date: z.string().nullable().optional(),
  result_publish_date: z.string().nullable().optional(),
  status: z.enum(["scheduled","ongoing","completed","cancelled"]).default("scheduled"),
});

export const listExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exams").select("*, course:courses(id,name,code), batch:batches(id,name), branch:branches(id,name)")
      .order("exam_date", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const getExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("exams").select("*, course:courses(id,name,code), batch:batches(id,name), branch:branches(id,name)")
      .eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return row as any;
  });

export const saveExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => examSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("exams").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("exams").insert(payload as any).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("exams").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ MARKS ENTRY ============ */
/** Load roster + subjects + any existing marks for an exam. */
export const loadMarksEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ exam_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: exam, error: exErr } = await supabase
      .from("exams").select("*, course:courses(id,name,code), batch:batches(id,name), branch:branches(id,name)")
      .eq("id", data.exam_id).single();
    if (exErr) throw new Error(exErr.message);

    // Subjects for course
    if (!exam.course_id) throw new Error("Exam is not linked to a course");
    const { data: subjects, error: sErr } = await supabase
      .from("subjects").select("*")
      .eq("course_id", exam.course_id as string)
      .order("subject_code", { ascending: true });
    if (sErr) throw new Error(sErr.message);

    // Students roster (by course + optional batch)
    let sq = supabase.from("students")
      .select("id, full_name, student_code, roll_no, enrollment_no, photo_url")
      .eq("status", "active");
    if (exam.course_id) sq = sq.eq("course_id", exam.course_id);
    if (exam.batch_id) sq = sq.eq("batch_id", exam.batch_id);
    if (exam.branch_id) sq = sq.eq("branch_id", exam.branch_id);
    const { data: students, error: stErr } = await sq.order("roll_no", { ascending: true });
    if (stErr) throw new Error(stErr.message);

    // Existing student_results + details
    const { data: results } = await supabase
      .from("student_results").select("id, student_id, result_status, obtained_marks, total_marks, percentage, grade, division, pass_fail, remarks")
      .eq("exam_id", data.exam_id);
    const resultIds = (results ?? []).map(r => r.id);
    const { data: details } = resultIds.length
      ? await supabase.from("result_details").select("*").in("student_result_id", resultIds)
      : { data: [] as any[] };

    return { exam, subjects: subjects ?? [], students: students ?? [], results: results ?? [], details: details ?? [] };
  });

const entryRowSchema = z.object({
  student_id: z.string().uuid(),
  remarks: z.string().max(500).nullable().optional(),
  marks: z.array(z.object({
    subject_id: z.string().uuid(),
    theory_marks: z.number().nonnegative().default(0),
    practical_marks: z.number().nonnegative().default(0),
    internal_marks: z.number().nonnegative().default(0),
    remarks: z.string().max(200).nullable().optional(),
  })),
});

export const saveMarksEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    exam_id: z.string().uuid(),
    rows: z.array(entryRowSchema),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    // Fetch subjects to validate maxima and compute totals
    const { data: exam, error: exErr } = await supabase.from("exams").select("id, course_id").eq("id", data.exam_id).single();
    if (exErr) throw new Error(exErr.message);
    if (!exam.course_id) throw new Error("Exam has no course");
    const { data: subjects, error: sErr } = await supabase.from("subjects").select("id, maximum_marks").eq("course_id", exam.course_id as string);
    if (sErr) throw new Error(sErr.message);
    const subMap = new Map<string, number>((subjects ?? []).map(s => [s.id, Number(s.maximum_marks)]));

    for (const row of data.rows) {
      // Validate & compute totals
      let obtained = 0, total = 0;
      for (const m of row.marks) {
        const max = subMap.get(m.subject_id);
        if (max == null) throw new Error("Unknown subject");
        const subTotal = m.theory_marks + m.practical_marks + m.internal_marks;
        if (subTotal > max) throw new Error(`Marks exceed maximum (${max}) for a subject`);
        if (subTotal < 0) throw new Error("Marks cannot be negative");
        obtained += subTotal;
        total += max;
      }

      // Upsert student_results
      const { data: existing } = await supabase.from("student_results")
        .select("id, result_status").eq("exam_id", data.exam_id).eq("student_id", row.student_id).maybeSingle();

      let srId = existing?.id as string | undefined;
      if (srId) {
        const { error } = await supabase.from("student_results").update({
          obtained_marks: obtained, total_marks: total, remarks: row.remarks ?? null,
        }).eq("id", srId);
        if (error) throw new Error(error.message);
      } else {
        const { data: created, error } = await supabase.from("student_results").insert({
          student_id: row.student_id, exam_id: data.exam_id,
          obtained_marks: obtained, total_marks: total, remarks: row.remarks ?? null,
          result_status: "draft",
        } as any).select("id").single();
        if (error) throw new Error(error.message);
        srId = created.id;
      }

      // Replace details (delete + insert)
      await supabase.from("result_details").delete().eq("student_result_id", srId);
      if (row.marks.length) {
        const payload = row.marks.map(m => ({
          student_result_id: srId,
          subject_id: m.subject_id,
          theory_marks: m.theory_marks,
          practical_marks: m.practical_marks,
          internal_marks: m.internal_marks,
          remarks: m.remarks ?? null,
        }));
        const { error } = await supabase.from("result_details").insert(payload as any);
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true, count: data.rows.length };
  });

/* ============ PUBLISH ============ */
export const setResultsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    exam_id: z.string().uuid(),
    status: z.enum(RESULT_STATUSES),
    student_ids: z.array(z.string().uuid()).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: any = { result_status: data.status };
    if (data.status === "published") {
      patch.published_by = context.userId;
      patch.published_at = new Date().toISOString();
    } else {
      patch.published_at = null;
    }
    let q = context.supabase.from("student_results").update(patch, { count: "exact" }).eq("exam_id", data.exam_id);
    if (data.student_ids && data.student_ids.length) q = q.in("student_id", data.student_ids);
    const { error, count } = await q.select("id");
    if (error) throw new Error(error.message);
    return { ok: true, count: count ?? 0 };
  });

/* ============ HISTORY / LIST ============ */
export const listResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("student_results")
      .select("*, student:students(id,full_name,student_code,roll_no), exam:exams(id,exam_name,exam_type,exam_date)")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

/* ============ ANALYTICS ============ */
export const resultAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("student_results").select("id, result_status, percentage, grade, pass_fail, exam:exams(exam_name, exam_date)");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as any[];
    const total = rows.length;
    const published = rows.filter(r => r.result_status === "published").length;
    const pending = rows.filter(r => r.result_status !== "published").length;
    const passed = rows.filter(r => r.pass_fail === "Pass").length;
    const failed = rows.filter(r => r.pass_fail === "Fail").length;
    const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;

    const gradeMap: Record<string, number> = {};
    rows.forEach(r => { if (r.grade) gradeMap[r.grade] = (gradeMap[r.grade] ?? 0) + 1; });
    const gradeDist = Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }));

    const trendMap: Record<string, { name: string; avg: number; n: number; sum: number }> = {};
    for (const r of rows) {
      const key = r.exam?.exam_name ?? "Unknown";
      if (!trendMap[key]) trendMap[key] = { name: key, avg: 0, n: 0, sum: 0 };
      trendMap[key].sum += Number(r.percentage ?? 0);
      trendMap[key].n += 1;
    }
    const trend = Object.values(trendMap).map(t => ({ name: t.name, avg: t.n ? Math.round(t.sum / t.n) : 0 })).slice(0, 10);

    return {
      total, published, pending, passed, failed,
      passPct: pct(passed), failPct: pct(failed), gradeDist, trend,
    };
  });

/* ============ STUDENT SELF ============ */
export const myPublishedResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Look up student by user_id
    const { data: student } = await context.supabase
      .from("students").select("id, full_name, student_code, roll_no, enrollment_no, photo_url, course:courses(name,code), branch:branches(name), batch:batches(name)")
      .eq("user_id", context.userId).maybeSingle();
    if (!student) return { student: null, results: [] as any[] };
    const { data, error } = await context.supabase
      .from("student_results")
      .select("*, exam:exams(id,exam_name,exam_type,exam_date)")
      .eq("student_id", student.id).eq("result_status", "published")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { student, results: (data ?? []) as any[] };
  });

export const myResultDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: student } = await context.supabase
      .from("students").select("id, full_name, student_code, roll_no, enrollment_no, photo_url, course:courses(name,code), branch:branches(name), batch:batches(name)")
      .eq("user_id", context.userId).maybeSingle();
    if (!student) throw new Error("No student record");
    const { data: sr, error } = await context.supabase
      .from("student_results")
      .select("*, exam:exams(id,exam_name,exam_type,exam_date,result_publish_date)")
      .eq("id", data.id).eq("student_id", student.id).eq("result_status", "published").single();
    if (error) throw new Error(error.message);
    const { data: details } = await context.supabase
      .from("result_details").select("*, subject:subjects(id,subject_code,subject_name,maximum_marks)")
      .eq("student_result_id", sr.id);
    return { student, result: sr, details: details ?? [] };
  });

/* Admin fetch detail */
export const adminResultDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: sr, error } = await context.supabase
      .from("student_results")
      .select("*, student:students(id,full_name,student_code,roll_no,enrollment_no,photo_url,course:courses(name,code),branch:branches(name),batch:batches(name)), exam:exams(id,exam_name,exam_type,exam_date,result_publish_date)")
      .eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: details } = await context.supabase
      .from("result_details").select("*, subject:subjects(id,subject_code,subject_name,maximum_marks)")
      .eq("student_result_id", sr.id);
    return { result: sr, details: details ?? [] };
  });
