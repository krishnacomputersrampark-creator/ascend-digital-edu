import { z } from "zod";

export const COURSE_COLUMNS = `
  id, code, name, short_name, category, description, duration, duration_unit, hours, eligibility,
  medium, certificate_type, exam_pattern, study_material, training_partner, course_fee,
  registration_fee, exam_fee, mode, syllabus_url, prospectus_url, thumbnail_url, status,
  is_active, fees, slug, created_at, updated_at
`;

export const BATCH_COLUMNS = `
  id, code, name, course_id, branch_id, teacher_id, faculty_id, session, start_date, end_date,
  days, start_time, end_time, capacity, current_strength, room_number, mode, status, remarks,
  timing, created_at, updated_at
`;

export const courseFilterSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  category: z.string().optional().default("all"),
  status: z.string().optional().default("all"),
  mode: z.string().optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).optional().default(10),
  sortBy: z.enum(["created_at", "name", "code", "course_fee"]).optional().default("created_at"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type CourseFilters = z.output<typeof courseFilterSchema>;

export const batchFilterSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  branchId: z.string().optional().default("all"),
  courseId: z.string().optional().default("all"),
  teacherId: z.string().optional().default("all"),
  status: z.string().optional().default("all"),
  session: z.string().optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).optional().default(10),
  sortBy: z.enum(["created_at", "name", "code", "start_date"]).optional().default("created_at"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
});
export type BatchFilters = z.output<typeof batchFilterSchema>;

const clean = (t: string) => t.replace(/[%,()]/g, "");

export function applyCourseFilters<T>(q: T, f: CourseFilters): T {
  let out: any = q;
  if (f.category !== "all") out = out.eq("category", f.category);
  if (f.status !== "all") out = out.eq("status", f.status);
  if (f.mode !== "all") out = out.eq("mode", f.mode);
  if (f.q) {
    const t = clean(f.q);
    out = out.or(`name.ilike.%${t}%,code.ilike.%${t}%,short_name.ilike.%${t}%,category.ilike.%${t}%`);
  }
  return out as T;
}

export function applyBatchFilters<T>(q: T, f: BatchFilters): T {
  let out: any = q;
  if (f.branchId !== "all") out = out.eq("branch_id", f.branchId);
  if (f.courseId !== "all") out = out.eq("course_id", f.courseId);
  if (f.teacherId !== "all") out = out.eq("teacher_id", f.teacherId);
  if (f.status !== "all") out = out.eq("status", f.status);
  if (f.session !== "all") out = out.eq("session", f.session);
  if (f.q) {
    const t = clean(f.q);
    out = out.or(`name.ilike.%${t}%,code.ilike.%${t}%,room_number.ilike.%${t}%`);
  }
  return out as T;
}

const EMPTY_TO_NULL = new Set([
  "short_name", "description", "duration", "eligibility", "medium", "certificate_type",
  "exam_pattern", "study_material", "training_partner", "syllabus_url", "prospectus_url",
  "thumbnail_url", "teacher_id", "start_date", "end_date", "start_time", "end_time",
  "room_number", "remarks", "session", "code",
]);

export function normalizeRecord(input: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    out[k] = v === "" && EMPTY_TO_NULL.has(k) ? null : v;
  }
  return out;
}

export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "course";
}

/** Returns true when [aS,aE) overlaps [bS,bE). */
export function timeOverlap(aS?: string | null, aE?: string | null, bS?: string | null, bE?: string | null) {
  if (!aS || !aE || !bS || !bE) return false;
  return aS < bE && bS < aE;
}

export function daysOverlap(a?: string[] | null, b?: string[] | null) {
  if (!a?.length || !b?.length) return true;
  return a.some((d) => b.includes(d));
}

export function groupCount<T>(rows: T[], key: (r: T) => string | null | undefined) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r) || "Unspecified";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}