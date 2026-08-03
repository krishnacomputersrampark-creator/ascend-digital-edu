import { z } from "zod";

export const COURSE_CATEGORIES = [
  "Computer Courses",
  "Programming",
  "Accounting",
  "Government Courses",
  "Skill Development",
  "Digital Marketing",
  "Language Courses",
] as const;

export const DURATION_UNITS = ["days", "weeks", "months", "years"] as const;
export const MEDIUMS = ["Hindi", "English", "Bilingual"] as const;
export const CERTIFICATE_TYPES = ["Institute", "Government", "Autonomous", "Training Partner", "None"] as const;
export const COURSE_MODES = ["offline", "online", "hybrid"] as const;
export const COURSE_STATUSES = ["active", "inactive", "archived"] as const;

export const BATCH_SESSIONS = ["Morning", "Afternoon", "Evening", "Weekend", "Custom"] as const;
export const BATCH_STATUSES = ["upcoming", "running", "completed", "cancelled"] as const;
export const BATCH_MODES = ["offline", "online", "hybrid"] as const;
export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const SUPPORTED_COURSES = [
  "ADCA", "DCA", "PGDCA", "CCC", "O Level", "Tally Prime with GST", "Advanced Excel",
  "Web Designing", "Graphic Designing", "Python", "C", "C++", "Java", "Typing",
  "Spoken English", "Digital Marketing", "Data Entry", "ADITSM",
] as const;

export const C_STATUS_LABEL: Record<string, string> = {
  active: "Active", inactive: "Inactive", archived: "Archived",
};
export const C_STATUS_CLASS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-amber-50 text-amber-700 ring-amber-200",
  archived: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const B_STATUS_LABEL: Record<string, string> = {
  upcoming: "Upcoming", running: "Running", completed: "Completed", cancelled: "Cancelled",
};
export const B_STATUS_CLASS: Record<string, string> = {
  upcoming: "bg-sky-50 text-sky-700 ring-sky-200",
  running: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-600 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

export const inr = (n: number | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : "—");

const opt = (max = 500) => z.string().trim().max(max).optional().or(z.literal("")).default("");

export const courseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Course name is required").max(160),
  code: opt(40),
  short_name: opt(40),
  category: z.string().trim().min(1, "Category is required"),
  description: opt(2000),
  duration: opt(40),
  duration_unit: z.enum(DURATION_UNITS).default("months"),
  hours: z.coerce.number().int().min(0).max(10000).optional().nullable(),
  eligibility: opt(300),
  medium: opt(60),
  certificate_type: opt(60),
  exam_pattern: opt(300),
  study_material: opt(300),
  training_partner: opt(120),
  course_fee: z.coerce.number().min(0).default(0),
  registration_fee: z.coerce.number().min(0).default(0),
  exam_fee: z.coerce.number().min(0).default(0),
  mode: z.enum(COURSE_MODES).default("offline"),
  syllabus_url: opt(600),
  prospectus_url: opt(600),
  thumbnail_url: opt(600),
  status: z.enum(COURSE_STATUSES).default("active"),
});
export type CourseInput = z.input<typeof courseSchema>;

export const batchSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2, "Batch name is required").max(160),
    code: opt(40),
    course_id: z.string().uuid({ message: "Course is required" }),
    branch_id: z.string().uuid({ message: "Branch is required" }),
    teacher_id: z.string().uuid().optional().or(z.literal("")).default(""),
    session: z.enum(BATCH_SESSIONS).default("Morning"),
    start_date: opt(20),
    end_date: opt(20),
    days: z.array(z.string()).default([]),
    start_time: opt(10),
    end_time: opt(10),
    capacity: z.coerce.number().int().min(1).max(500).default(30),
    room_number: opt(40),
    mode: z.enum(BATCH_MODES).default("offline"),
    status: z.enum(BATCH_STATUSES).default("upcoming"),
    remarks: opt(1000),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
  })
  .refine((v) => !v.start_time || !v.end_time || v.end_time > v.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });
export type BatchInput = z.input<typeof batchSchema>;