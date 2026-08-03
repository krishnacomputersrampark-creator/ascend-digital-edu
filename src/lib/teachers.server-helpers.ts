import { z } from "zod";
import { TEACHER_STATUSES } from "@/lib/teachers.shared";

export const TEACHER_COLUMNS = `
  id, user_id, teacher_id, employee_code, full_name, father_name, mother_name, gender, dob, blood_group,
  mobile, alternate_mobile, email, address, state, district, pin_code, aadhaar_number, pan_number,
  qualification, experience, designation, department, branch_id, joining_date, salary, subjects,
  working_days, preferred_timings, photo_url, aadhaar_url, pan_url, qualification_url, experience_url,
  signature_url, status, remarks, created_at, updated_at
`;

export const teacherFilterSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  status: z.string().optional().default("all"),
  branchId: z.string().optional().default("all"),
  designation: z.string().optional().default("all"),
  department: z.string().optional().default("all"),
  courseId: z.string().optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).optional().default(10),
  sortBy: z.enum(["created_at", "full_name", "joining_date", "teacher_id"]).optional().default("created_at"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type TeacherFilters = z.output<typeof teacherFilterSchema>;

export function applyTeacherFilters<T extends any>(q: T, f: TeacherFilters): T {
  let out: any = q;
  if (f.status !== "all") out = out.eq("status", f.status);
  if (f.branchId !== "all") out = out.eq("branch_id", f.branchId);
  if (f.designation !== "all") out = out.eq("designation", f.designation);
  if (f.department !== "all") out = out.eq("department", f.department);
  if (f.q) {
    const t = f.q.replace(/[%,()]/g, "");
    out = out.or(
      `full_name.ilike.%${t}%,teacher_id.ilike.%${t}%,employee_code.ilike.%${t}%,mobile.ilike.%${t}%,email.ilike.%${t}%,subjects.ilike.%${t}%`,
    );
  }
  return out as T;
}

const NULLABLE = new Set([
  "father_name", "mother_name", "dob", "gender", "blood_group", "aadhaar_number", "pan_number",
  "alternate_mobile", "email", "address", "district", "state", "pin_code", "qualification", "experience",
  "designation", "department", "branch_id", "joining_date", "subjects", "working_days", "preferred_timings",
  "remarks", "photo_url", "aadhaar_url", "pan_url", "qualification_url", "experience_url", "signature_url",
]);

/** Turns empty strings into nulls so unique partial indexes behave. */
export function normalizeTeacher(input: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "" && NULLABLE.has(k)) out[k] = null;
    else out[k] = v;
  }
  if (typeof out['email'] === "string") out['email'] = out['email'].toLowerCase();
  if (!TEACHER_STATUSES.includes(out['status'])) out['status'] = "active";
  return out;
}

export function diffTeacher(before: Record<string, any>, after: Record<string, any>) {
  const changes: Record<string, { from: any; to: any }> = {};
  for (const k of Object.keys(after)) {
    const a = before?.[k] ?? null;
    const b = after[k] ?? null;
    if (String(a ?? "") !== String(b ?? "")) changes[k] = { from: a, to: b };
  }
  return changes;
}