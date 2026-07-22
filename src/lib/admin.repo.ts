import { supabase } from "@/integrations/supabase/client";

function startOfToday(): string {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function daysAgoISO(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function monthKey(iso: string): string { return iso.slice(0, 7); }

async function count(table: any, filters: (q: any) => any = (q) => q): Promise<number> {
  const q: any = (supabase as any).from(table).select("*", { count: "exact", head: true });
  const { count: c } = await filters(q);
  return c ?? 0;
}

export type AdminStats = {
  totalStudents: number;
  activeStudents: number;
  facultyMembers: number;
  courses: number;
  branches: number;
  todayAdmissions: number;
  todayAttendancePct: number;
  todayFeeCollection: number;
  pendingFees: number;
  pendingAdmissions: number;
  certificatesIssued: number;
  downloads: number;
};

export async function fetchAdminStats(): Promise<AdminStats> {
  const today = startOfToday();
  const [
    totalStudents, activeStudents, facultyMembers, courses, branches,
    todayAdmissions, pendingAdmissions, certificatesIssued, downloads,
  ] = await Promise.all([
    count("students"),
    count("students", (q) => q.eq("status", "active")),
    count("user_roles", (q) => q.eq("role", "faculty")),
    count("courses", (q) => q.neq("status", "archived")),
    count("branches"),
    count("admissions", (q) => q.gte("created_at", today)),
    count("admissions", (q) => q.eq("status", "pending")),
    count("certificates", (q) => q.in("status", ["issued", "reissued"])),
    count("download_history"),
  ]);

  // Today's attendance %
  const { data: att } = await supabase
    .from("attendance")
    .select("status")
    .gte("attendance_date", new Date().toISOString().slice(0, 10));
  const present = (att ?? []).filter((r: any) => r.status === "present" || r.status === "late").length;
  const todayAttendancePct = att && att.length ? Math.round((present / att.length) * 100) : 0;

  // Today fee collection
  const { data: pays } = await supabase
    .from("fee_installments")
    .select("paid_amount, payment_date")
    .gte("payment_date", today);
  const todayFeeCollection = (pays ?? []).reduce((s: number, r: any) => s + Number(r.paid_amount || 0), 0);

  // Pending fees (outstanding)
  const { data: dues } = await supabase.from("student_fees").select("due_amount");
  const pendingFees = (dues ?? []).reduce((s: number, r: any) => s + Number(r.due_amount || 0), 0);

  return {
    totalStudents, activeStudents, facultyMembers, courses, branches,
    todayAdmissions, todayAttendancePct, todayFeeCollection, pendingFees,
    pendingAdmissions, certificatesIssued, downloads,
  };
}

export type TrendPoint = { key: string; value: number };

export async function fetchTrends(daysBack = 30) {
  const since = daysAgoISO(daysBack);
  const [adm, pays, att, res, dl] = await Promise.all([
    supabase.from("admissions").select("created_at").gte("created_at", since),
    supabase.from("fee_installments").select("paid_amount, payment_date").gte("payment_date", since),
    supabase.from("attendance").select("status, attendance_date").gte("attendance_date", since.slice(0, 10)),
    supabase.from("student_results").select("percentage, pass_fail, created_at").gte("created_at", since),
    supabase.from("download_history").select("downloaded_at").gte("downloaded_at", since),
  ]);

  const bucket = (rows: any[], key: string) => {
    const map = new Map<string, number>();
    for (const r of rows || []) map.set((r[key] ?? "").slice(0, 10), (map.get((r[key] ?? "").slice(0, 10)) ?? 0) + 1);
    return Array.from(map, ([k, v]) => ({ key: k, value: v })).sort((a, b) => a.key.localeCompare(b.key));
  };

  const admissionsTrend = bucket(adm.data ?? [], "created_at");
  const attendanceTrend = (() => {
    const map = new Map<string, { present: number; total: number }>();
    for (const r of att.data ?? []) {
      const k = (r.attendance_date as string).slice(0, 10);
      const cur = map.get(k) ?? { present: 0, total: 0 };
      cur.total++; if (r.status === "present" || r.status === "late") cur.present++;
      map.set(k, cur);
    }
    return Array.from(map, ([k, v]) => ({ key: k, value: v.total ? Math.round((v.present / v.total) * 100) : 0 })).sort((a, b) => a.key.localeCompare(b.key));
  })();
  const feeTrend = (() => {
    const map = new Map<string, number>();
    for (const r of pays.data ?? []) {
      if (!r.payment_date) continue;
      const k = (r.payment_date as string).slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + Number(r.paid_amount || 0));
    }
    return Array.from(map, ([k, v]) => ({ key: k, value: Math.round(v) })).sort((a, b) => a.key.localeCompare(b.key));
  })();
  const resultStats = (() => {
    const rows = res.data ?? [];
    const pass = rows.filter((r: any) => r.pass_fail === "Pass").length;
    const fail = rows.filter((r: any) => r.pass_fail === "Fail").length;
    return [{ name: "Pass", value: pass }, { name: "Fail", value: fail }];
  })();
  const downloadsTrend = bucket(dl.data ?? [], "downloaded_at");

  return { admissionsTrend, attendanceTrend, feeTrend, resultStats, downloadsTrend };
}

export async function fetchStudentGrowth(months = 12) {
  const since = new Date(); since.setMonth(since.getMonth() - months + 1); since.setDate(1); since.setHours(0, 0, 0, 0);
  const { data } = await supabase.from("students").select("joined_at").gte("joined_at", since.toISOString());
  const map = new Map<string, number>();
  for (const r of data ?? []) map.set(monthKey(r.joined_at as string), (map.get(monthKey(r.joined_at as string)) ?? 0) + 1);
  return Array.from(map, ([key, value]) => ({ key, value })).sort((a, b) => a.key.localeCompare(b.key));
}

export async function fetchBranchComparison() {
  const { data: brs } = await supabase.from("branches").select("id, name");
  const { data: st } = await supabase.from("students").select("branch_id");
  const map = new Map<string, number>();
  for (const r of st ?? []) map.set(r.branch_id as string, (map.get(r.branch_id as string) ?? 0) + 1);
  return (brs ?? []).map((b: any) => ({ key: b.name, value: map.get(b.id) ?? 0 }));
}

export async function fetchCoursePopularity() {
  const { data: cs } = await supabase.from("courses").select("id, name");
  const { data: st } = await supabase.from("students").select("course_id");
  const map = new Map<string, number>();
  for (const r of st ?? []) map.set(r.course_id as string, (map.get(r.course_id as string) ?? 0) + 1);
  return (cs ?? [])
    .map((c: any) => ({ key: c.name, value: map.get(c.id) ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export async function fetchMonthlyRevenue(months = 12) {
  const since = new Date(); since.setMonth(since.getMonth() - months + 1); since.setDate(1); since.setHours(0, 0, 0, 0);
  const { data } = await supabase.from("fee_installments")
    .select("paid_amount, payment_date").gte("payment_date", since.toISOString());
  const map = new Map<string, number>();
  for (const r of data ?? []) {
    if (!r.payment_date) continue;
    const k = monthKey(r.payment_date as string);
    map.set(k, (map.get(k) ?? 0) + Number(r.paid_amount || 0));
  }
  return Array.from(map, ([key, value]) => ({ key, value: Math.round(value) })).sort((a, b) => a.key.localeCompare(b.key));
}

export type Activity = { id: string; kind: string; title: string; sub: string; at: string; link?: string };

export async function fetchRecentActivity(limit = 20): Promise<Activity[]> {
  const [adm, pays, cert, att, dl] = await Promise.all([
    supabase.from("admissions").select("id, full_name, status, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("fee_installments").select("id, paid_amount, receipt_number, payment_date").not("payment_date", "is", null).order("payment_date", { ascending: false }).limit(limit),
    supabase.from("certificates").select("id, certificate_number, status, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("attendance").select("id, status, attendance_date, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("download_history").select("id, downloaded_at, study_material_id").order("downloaded_at", { ascending: false }).limit(limit),
  ]);
  const items: Activity[] = [];
  for (const r of adm.data ?? []) items.push({ id: `adm-${r.id}`, kind: "Admission", title: r.full_name as string, sub: `Status: ${r.status}`, at: r.created_at as string, link: `/dashboard/admissions/${r.id}` });
  for (const r of pays.data ?? []) items.push({ id: `pay-${r.id}`, kind: "Fee", title: `Receipt ${r.receipt_number ?? "—"}`, sub: `₹${Number(r.paid_amount || 0).toLocaleString("en-IN")}`, at: r.payment_date as string });
  for (const r of cert.data ?? []) items.push({ id: `cert-${r.id}`, kind: "Certificate", title: r.certificate_number as string, sub: `Status: ${r.status}`, at: r.created_at as string });
  for (const r of att.data ?? []) items.push({ id: `att-${r.id}`, kind: "Attendance", title: `Marked ${r.status}`, sub: r.attendance_date as string, at: r.created_at as string });
  for (const r of dl.data ?? []) items.push({ id: `dl-${r.id}`, kind: "Download", title: "Material downloaded", sub: "", at: r.downloaded_at as string });
  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}

export type AuditRow = {
  id: string; actor_id: string | null; actor_email: string | null;
  action: string; entity: string; entity_id: string | null; meta: any; created_at: string;
};

export async function fetchAuditLogs(opts: { q?: string; entity?: string; action?: string; limit?: number; offset?: number }): Promise<{ rows: AuditRow[]; total: number }> {
  let q = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (opts.entity) q = q.eq("entity", opts.entity);
  if (opts.action) q = q.eq("action", opts.action);
  if (opts.q) q = q.or(`actor_email.ilike.%${opts.q}%,entity_id.ilike.%${opts.q}%`);
  const from = opts.offset ?? 0;
  const to = from + (opts.limit ?? 50) - 1;
  const { data, count: c } = await q.range(from, to);
  return { rows: (data ?? []) as AuditRow[], total: c ?? 0 };
}

export async function logAudit(action: string, entity: string, entity_id?: string | null, meta?: any) {
  try {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      actor_id: u.user?.id ?? null,
      actor_email: u.user?.email ?? null,
      action, entity, entity_id: entity_id ?? null, meta: meta ?? null,
    });
  } catch { /* non-blocking */ }
}

export type NotificationScope =
  | { kind: "all" }
  | { kind: "branch"; branch_id: string }
  | { kind: "course"; course_id: string }
  | { kind: "batch"; batch_id: string }
  | { kind: "student"; student_id: string };

export async function sendNotification(input: {
  title: string; description?: string; type?: string; link?: string; scope: NotificationScope;
}) {
  const { title, description, type = "announcement", link, scope } = input;
  let studentIds: string[] = [];
  if (scope.kind === "student") studentIds = [scope.student_id];
  else {
    let q = supabase.from("students").select("id");
    if (scope.kind === "branch") q = q.eq("branch_id", scope.branch_id);
    if (scope.kind === "course") q = q.eq("course_id", scope.course_id);
    if (scope.kind === "batch") q = q.eq("batch_id", scope.batch_id);
    const { data } = await q;
    studentIds = (data ?? []).map((r: any) => r.id);
  }
  if (!studentIds.length) return { inserted: 0 };
  const { data: u } = await supabase.auth.getUser();
  const rows = studentIds.map((sid) => ({
    title, description: description ?? null, type, link: link ?? null,
    student_id: sid, created_by: u.user?.id ?? null,
    branch_id: scope.kind === "branch" ? scope.branch_id : null,
  }));
  const { error, count: c } = await supabase.from("notifications").insert(rows, { count: "exact" });
  if (error) throw error;
  await logAudit("notification.broadcast", "notifications", null, { scope, count: rows.length, type, title });
  return { inserted: c ?? rows.length };
}

export async function listBranchesLite() {
  const { data } = await supabase.from("branches").select("id, name, code").order("name");
  return data ?? [];
}
export async function listCoursesLite() {
  const { data } = await supabase.from("courses").select("id, name, code").order("name");
  return data ?? [];
}
export async function listBatchesLite() {
  const { data } = await supabase.from("batches").select("id, name, code").order("name");
  return data ?? [];
}
export async function searchStudentsLite(q: string) {
  if (!q.trim()) return [];
  const { data } = await supabase.from("students")
    .select("id, full_name, student_code, enrollment_no")
    .or(`full_name.ilike.%${q}%,student_code.ilike.%${q}%,enrollment_no.ilike.%${q}%`)
    .limit(10);
  return data ?? [];
}