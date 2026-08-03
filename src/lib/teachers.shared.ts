import { z } from "zod";

export const TEACHER_STATUSES = ["active", "inactive", "resigned", "suspended"] as const;
export type TeacherStatus = (typeof TEACHER_STATUSES)[number];

export const T_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  resigned: "Resigned",
  suspended: "Suspended",
};

export const T_STATUS_CLASS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-700",
  resigned: "bg-rose-100 text-rose-800",
  suspended: "bg-amber-100 text-amber-800",
};

export const GENDERS = ["male", "female", "other"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const DESIGNATIONS = ["Instructor", "Senior Instructor", "Lecturer", "Trainer", "Lab Assistant", "Head of Department", "Principal"] as const;
export const DEPARTMENTS = ["Computer Applications", "Programming", "Accounting", "Designing", "Hardware & Networking", "Spoken English", "Administration"] as const;
export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const TIMINGS = ["06:00 - 09:00", "09:00 - 12:00", "12:00 - 15:00", "15:00 - 18:00", "18:00 - 21:00"] as const;

const optStr = (max = 200) => z.string().trim().max(max).optional().or(z.literal("")).nullable();

export const teacherSchema = z.object({
  // Step 1 — Personal
  full_name: z.string().trim().min(2, "Name is required").max(120),
  father_name: optStr(120),
  mother_name: optStr(120),
  dob: optStr(20),
  gender: optStr(20),
  blood_group: optStr(10),
  aadhaar_number: z.string().trim().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits").optional().or(z.literal("")).nullable(),
  pan_number: z.string().trim().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN (ABCDE1234F)").optional().or(z.literal("")).nullable(),
  // Step 2 — Contact
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  alternate_mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number").optional().or(z.literal("")).nullable(),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")).nullable(),
  address: optStr(500),
  district: optStr(80),
  state: optStr(80),
  pin_code: z.string().trim().regex(/^\d{6}$/, "PIN must be 6 digits").optional().or(z.literal("")).nullable(),
  // Step 3 — Employment
  qualification: optStr(200),
  experience: optStr(120),
  designation: optStr(80),
  department: optStr(80),
  branch_id: optStr(60),
  joining_date: optStr(20),
  salary: z.coerce.number().min(0).default(0),
  subjects: optStr(400),
  working_days: optStr(120),
  preferred_timings: optStr(120),
  status: z.enum(TEACHER_STATUSES).default("active"),
  remarks: optStr(1000),
  // Step 4 — Documents (storage paths)
  photo_url: optStr(400),
  aadhaar_url: optStr(400),
  pan_url: optStr(400),
  qualification_url: optStr(400),
  experience_url: optStr(400),
  signature_url: optStr(400),
});

export type TeacherInput = z.input<typeof teacherSchema>;
export type TeacherValues = z.output<typeof teacherSchema>;

export function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN");
}

export const inr = (n: number | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const emptyTeacher = (): TeacherInput => ({
  full_name: "", father_name: "", mother_name: "", dob: "", gender: "", blood_group: "",
  aadhaar_number: "", pan_number: "", mobile: "", alternate_mobile: "", email: "",
  address: "", district: "", state: "", pin_code: "", qualification: "", experience: "",
  designation: "", department: "", branch_id: "", joining_date: "", salary: 0,
  subjects: "", working_days: "", preferred_timings: "", status: "active", remarks: "",
  photo_url: "", aadhaar_url: "", pan_url: "", qualification_url: "", experience_url: "", signature_url: "",
});