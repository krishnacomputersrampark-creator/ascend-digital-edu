import { supabase } from "@/integrations/supabase/client";

export const CERT_TYPES = [
  "course_completion",
  "diploma",
  "advanced_diploma",
  "training",
  "internship",
  "excellence",
  "participation",
] as const;
export type CertType = (typeof CERT_TYPES)[number];

export const CERT_TYPE_LABEL: Record<CertType, string> = {
  course_completion: "Course Completion",
  diploma: "Diploma",
  advanced_diploma: "Advanced Diploma",
  training: "Training Certificate",
  internship: "Internship Certificate",
  excellence: "Excellence Award",
  participation: "Participation Certificate",
};

export const CERT_STATUSES = ["draft", "issued", "revoked", "expired", "reissued"] as const;
export type CertStatus = (typeof CERT_STATUSES)[number];

export const CERT_STATUS_LABEL: Record<CertStatus, string> = {
  draft: "Draft",
  issued: "Valid",
  revoked: "Revoked",
  expired: "Expired",
  reissued: "Reissued",
};

export type CertificateRow = {
  id: string;
  certificate_number: string;
  student_id: string;
  course_id: string | null;
  branch_id: string | null;
  template_id: string | null;
  issue_date: string;
  completion_date: string | null;
  grade: string | null;
  percentage: number | null;
  certificate_type: CertType;
  verification_token: string;
  qr_code_url: string | null;
  pdf_url: string | null;
  status: CertStatus;
  issued_by: string | null;
  revoked_reason: string | null;
  reissued_from: string | null;
  created_at: string;
  updated_at: string;
  student?: { id: string; full_name: string; student_code: string; roll_no: string | null; photo_url: string | null } | null;
  course?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  template?: { id: string; template_name: string } | null;
};

const SELECT = `
  id, certificate_number, student_id, course_id, branch_id, template_id,
  issue_date, completion_date, grade, percentage, certificate_type,
  verification_token, qr_code_url, pdf_url, status, issued_by,
  revoked_reason, reissued_from, created_at, updated_at,
  student:students(id, full_name, student_code, roll_no, photo_url),
  course:courses(id, name, code),
  branch:branches(id, name, code),
  template:certificate_templates(id, template_name)
`;

export async function listCertificates(filters: {
  q?: string;
  status?: CertStatus | "all";
  courseId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  limit?: number;
} = {}) {
  let q = supabase.from("certificates").select(SELECT).order("created_at", { ascending: false });
  if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.courseId) q = q.eq("course_id", filters.courseId);
  if (filters.branchId) q = q.eq("branch_id", filters.branchId);
  if (filters.from) q = q.gte("issue_date", filters.from);
  if (filters.to) q = q.lte("issue_date", filters.to);
  if (filters.q) q = q.or(`certificate_number.ilike.%${filters.q}%,verification_token.ilike.%${filters.q}%`);
  if (filters.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as CertificateRow[];
}

export async function getCertificate(id: string) {
  const { data, error } = await supabase.from("certificates").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as CertificateRow | null;
}

export async function verifyCertificate(input: string) {
  const term = input.trim();
  if (!term) return null;
  const { data, error } = await supabase
    .from("certificates")
    .select(SELECT)
    .or(`certificate_number.eq.${term},verification_token.eq.${term}`)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as CertificateRow | null;
}

export async function verifyByStudentAndCert(studentCode: string, certNumber?: string) {
  let q = supabase.from("certificates").select(SELECT + ",studentRef:students!inner(student_code)");
  q = q.eq("students.student_code", studentCode);
  if (certNumber) q = q.eq("certificate_number", certNumber);
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  return data as unknown as CertificateRow | null;
}

export async function listMyCertificates() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data: st } = await supabase.from("students").select("id").eq("user_id", auth.user.id).maybeSingle();
  if (!st) return [];
  const { data, error } = await supabase
    .from("certificates")
    .select(SELECT)
    .eq("student_id", st.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CertificateRow[];
}

export type CreateCertificateInput = {
  student_id: string;
  course_id: string | null;
  branch_id: string | null;
  template_id: string | null;
  issue_date: string;
  completion_date: string | null;
  grade: string | null;
  percentage: number | null;
  certificate_type: CertType;
};

export async function createCertificate(input: CreateCertificateInput) {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("certificates")
    .insert({ ...input, issued_by: auth.user?.id, status: "issued" as CertStatus })
    .select("id, certificate_number, verification_token")
    .single();
  if (error) throw error;
  return data;
}

export async function revokeCertificate(id: string, reason: string) {
  const { error } = await supabase
    .from("certificates")
    .update({ status: "revoked", revoked_reason: reason })
    .eq("id", id);
  if (error) throw error;
}

export async function reissueCertificate(id: string) {
  const { data: original, error: e1 } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();
  if (e1) throw e1;
  // Revoke the old one first (frees the unique index)
  await supabase.from("certificates").update({ status: "revoked", revoked_reason: "Reissued" }).eq("id", id);
  const { data: auth } = await supabase.auth.getUser();
  const insert = {
    student_id: original.student_id,
    course_id: original.course_id,
    branch_id: original.branch_id,
    template_id: original.template_id,
    issue_date: new Date().toISOString().slice(0, 10),
    completion_date: original.completion_date,
    grade: original.grade,
    percentage: original.percentage,
    certificate_type: original.certificate_type,
    reissued_from: original.id,
    issued_by: auth.user?.id,
    status: "reissued" as CertStatus,
  };
  const { data, error } = await supabase.from("certificates").insert(insert).select("id, certificate_number").single();
  if (error) throw error;
  return data;
}

export async function certificateAnalytics() {
  const { data, error } = await supabase.from("certificates").select("status, certificate_type, course_id, branch_id, issue_date");
  if (error) throw error;
  const rows = data ?? [];
  const by = <K extends keyof (typeof rows)[number]>(k: K) => {
    const map: Record<string, number> = {};
    for (const r of rows) {
      const key = String((r as any)[k] ?? "—");
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  };
  const monthly: Record<string, number> = {};
  for (const r of rows) {
    const m = (r.issue_date ?? "").slice(0, 7);
    if (!m) continue;
    monthly[m] = (monthly[m] ?? 0) + 1;
  }
  return {
    total: rows.length,
    issued: rows.filter((r) => r.status === "issued" || r.status === "reissued").length,
    revoked: rows.filter((r) => r.status === "revoked").length,
    pending: rows.filter((r) => r.status === "draft").length,
    byType: by("certificate_type"),
    byStatus: by("status"),
    monthly: Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
  };
}

/* --------------------- Templates --------------------- */
export type CertificateTemplate = {
  id: string;
  template_name: string;
  course_id: string | null;
  template_file: string | null;
  background_image: string | null;
  signature_image: string | null;
  seal_image: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  course?: { id: string; name: string; code: string } | null;
};

export async function listTemplates() {
  const { data, error } = await supabase
    .from("certificate_templates")
    .select("*, course:courses(id, name, code)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CertificateTemplate[];
}

export async function saveTemplate(t: Partial<CertificateTemplate> & { template_name: string }) {
  const payload = {
    template_name: t.template_name,
    course_id: t.course_id ?? null,
    template_file: t.template_file ?? null,
    background_image: t.background_image ?? null,
    signature_image: t.signature_image ?? null,
    seal_image: t.seal_image ?? null,
    status: t.status ?? "active",
  };
  if (t.id) {
    const { error } = await supabase.from("certificate_templates").update(payload).eq("id", t.id);
    if (error) throw error;
    return t.id;
  }
  const { data, error } = await supabase.from("certificate_templates").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from("certificate_templates").delete().eq("id", id);
  if (error) throw error;
}

/* --------------------- Utilities --------------------- */
export function maskMobile(m?: string | null) {
  if (!m) return "";
  const s = String(m).replace(/\D/g, "");
  if (s.length < 4) return "****";
  return s.slice(0, 2) + "******" + s.slice(-2);
}

export function certificateVerificationUrl(certNumber: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/certificate-verification/${encodeURIComponent(certNumber)}`;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function downloadFile(name: string, contents: string, type = "text/csv") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}