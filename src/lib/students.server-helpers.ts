import { z } from "zod";
import type { StudentValues } from "@/lib/students.shared";

export const STUDENT_COLUMNS =
  "id, student_code, enrollment_no, admission_number, roll_no, full_name, father_name, mother_name, email, phone, alternate_mobile, photo_url, status, joined_at, gender, date_of_birth, blood_group, category, occupation, aadhaar_number, address, city, district, state, pincode, emergency_contact, guardian_name, guardian_phone, course_fee, admission_fee, registration_fee, discount, installments, payment_mode, receipt_number, session, duration, remarks, branch_id, course_id, batch_id, faculty_id, created_at, updated_at";

export const DOC_FIELDS = ["signature", "aadhaar", "marksheet", "certificate"] as const;

const DOC_MAP: Record<string, string> = {
  signature_url: "signature",
  aadhaar_doc_url: "aadhaar",
  marksheet_url: "marksheet",
  certificate_url: "certificate",
};

export const filterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  branch_id: z.string().uuid().optional().or(z.literal("")),
  course_id: z.string().uuid().optional().or(z.literal("")),
  batch_id: z.string().uuid().optional().or(z.literal("")),
  status: z.string().max(30).optional(),
  gender: z.string().max(20).optional(),
  from: z.string().max(20).optional().or(z.literal("")),
  to: z.string().max(20).optional().or(z.literal("")),
  sortBy: z.enum(["created_at", "full_name", "joined_at", "status"]).default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(200).default(25),
});

export type StudentFilters = z.output<typeof filterSchema>;

/** Applies shared list filters to a PostgREST query builder. */
export function applyFilters<T>(query: T, f: StudentFilters): T {
  let q = query as any;
  if (f.status && f.status !== "all") q = q.eq("status", f.status);
  if (f.branch_id) q = q.eq("branch_id", f.branch_id);
  if (f.course_id) q = q.eq("course_id", f.course_id);
  if (f.batch_id) q = q.eq("batch_id", f.batch_id);
  if (f.gender && f.gender !== "all") q = q.eq("gender", f.gender);
  if (f.from) q = q.gte("joined_at", f.from);
  if (f.to) q = q.lte("joined_at", f.to);
  if (f.q) {
    const term = f.q.replace(/[%,()]/g, "");
    q = q.or(
      `full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,student_code.ilike.%${term}%,enrollment_no.ilike.%${term}%,admission_number.ilike.%${term}%,father_name.ilike.%${term}%`,
    );
  }
  return q as T;
}

/** Converts empty strings to null so Postgres stores real NULLs. */
export function normalize(values: StudentValues): Record<string, unknown> {
  const out = Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v]),
  );
  // joined_at is NOT NULL in the database — fall back to today.
  if (!out.joined_at) out.joined_at = new Date().toISOString().slice(0, 10);
  return out;
}

/** Splits the flat form payload into a students row and document paths. */
export function splitPayload(values: Record<string, unknown>) {
  const record: Record<string, unknown> = {};
  const docs: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (k in DOC_MAP) {
      if (typeof v === "string" && v) docs[DOC_MAP[k]!] = v;
    } else {
      record[k] = v;
    }
  }
  return { record, docs };
}

export function buildDocRows(studentId: string, docs: Record<string, string>, userId: string) {
  return Object.entries(docs).map(([kind, file_path]) => ({
    student_id: studentId,
    kind,
    title: kind,
    file_path,
    uploaded_by: userId,
  }));
}

/** Field-level before/after diff for the edit history trail. */
export async function assertNoDuplicates(supabase: any, record: Record<string, unknown>, excludeId: string | null) {
  const checks: Array<[string, unknown, string]> = [
    ["phone", record.phone, "A student with this mobile number already exists."],
    ["email", record.email, "A student with this email address already exists."],
    ["student_code", record.student_code, "This Student ID is already in use."],
    ["admission_number", record.admission_number, "This admission number is already in use."],
  ];
  for (const [column, value, message] of checks) {
    if (!value) continue;
    let q = supabase.from("students").select("id").is("deleted_at", null).eq(column, value as string);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (data) throw new Error(message);
  }
}

export function diffChanges(before: Record<string, unknown> | null, after: Record<string, unknown>) {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  if (!before) return out;
  for (const [k, v] of Object.entries(after)) {
    const prev = before[k] ?? null;
    const next = v ?? null;
    if (String(prev) !== String(next)) out[k] = { from: prev, to: next };
  }
  return out;
}