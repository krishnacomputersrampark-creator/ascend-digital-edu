import { z } from "zod";

export const STUDENT_STATUSES = ["active", "completed", "dropped", "suspended"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  passed_out: "Passed Out",
  dropped: "Dropped",
  suspended: "Suspended",
};

export const STATUS_CLASS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-sky-100 text-sky-800",
  passed_out: "bg-sky-100 text-sky-800",
  dropped: "bg-rose-100 text-rose-800",
  suspended: "bg-amber-100 text-amber-800",
};

export const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "Other"] as const;
export const GENDERS = ["male", "female", "other"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const PAYMENT_MODES = ["cash", "upi", "card", "netbanking", "cheque", "dd"] as const;

const optStr = (max = 200) => z.string().trim().max(max).optional().or(z.literal("")).nullable();

export const studentSchema = z.object({
  // Step 1 — Personal
  full_name: z.string().trim().min(2, "Name is required").max(120),
  father_name: optStr(120),
  mother_name: optStr(120),
  date_of_birth: optStr(20),
  gender: optStr(20),
  category: optStr(30),
  blood_group: optStr(10),
  occupation: optStr(80),
  aadhaar_number: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits")
    .optional()
    .or(z.literal(""))
    .nullable(),
  // Step 2 — Contact
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  alternate_mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal(""))
    .nullable(),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")).nullable(),
  address: optStr(500),
  city: optStr(80),
  district: optStr(80),
  state: optStr(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "PIN code must be 6 digits")
    .optional()
    .or(z.literal(""))
    .nullable(),
  guardian_name: optStr(120),
  guardian_phone: optStr(20),
  emergency_contact: optStr(20),
  // Step 3 — Academic
  branch_id: z.string().uuid("Branch is required"),
  course_id: z.string().uuid().optional().or(z.literal("")).nullable(),
  batch_id: z.string().uuid().optional().or(z.literal("")).nullable(),
  faculty_id: z.string().uuid().optional().or(z.literal("")).nullable(),
  roll_no: optStr(40),
  joined_at: optStr(20),
  status: z.string().trim().max(30).default("active"),
  session: optStr(20),
  duration: optStr(40),
  remarks: optStr(1000),
  // Step 4 — Fees
  course_fee: z.coerce.number().min(0).default(0),
  admission_fee: z.coerce.number().min(0).default(0),
  registration_fee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  installments: z.coerce.number().int().min(1).max(36).default(1),
  payment_mode: optStr(20),
  receipt_number: optStr(40),
  // Step 5 — Documents
  photo_url: optStr(500),
  signature_url: optStr(500),
  aadhaar_doc_url: optStr(500),
  marksheet_url: optStr(500),
  certificate_url: optStr(500),
});

export type StudentInput = z.input<typeof studentSchema>;
export type StudentValues = z.output<typeof studentSchema>;

export const EMPTY_STUDENT: StudentInput = {
  full_name: "",
  father_name: "",
  mother_name: "",
  date_of_birth: "",
  gender: "",
  category: "",
  blood_group: "",
  occupation: "",
  aadhaar_number: "",
  phone: "",
  alternate_mobile: "",
  email: "",
  address: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  guardian_name: "",
  guardian_phone: "",
  emergency_contact: "",
  branch_id: "",
  course_id: "",
  batch_id: "",
  faculty_id: "",
  roll_no: "",
  joined_at: new Date().toISOString().slice(0, 10),
  status: "active",
  session: `${new Date().getFullYear()}-${String((new Date().getFullYear() + 1) % 100).padStart(2, "0")}`,
  duration: "",
  remarks: "",
  course_fee: 0,
  admission_fee: 0,
  registration_fee: 0,
  discount: 0,
  installments: 1,
  payment_mode: "",
  receipt_number: "",
  photo_url: "",
  signature_url: "",
  aadhaar_doc_url: "",
  marksheet_url: "",
  certificate_url: "",
};

/** Net payable after discount across all fee heads. */
export function netPayable(v: { course_fee?: number; admission_fee?: number; registration_fee?: number; discount?: number }) {
  const total = Number(v.course_fee ?? 0) + Number(v.admission_fee ?? 0) + Number(v.registration_fee ?? 0);
  return Math.max(0, total - Number(v.discount ?? 0));
}

export function inr(n: number | null | undefined) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

export function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}