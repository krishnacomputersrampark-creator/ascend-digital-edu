import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FEE_STATUSES = ["pending", "partially_paid", "paid", "overdue", "cancelled"] as const;
export const FEE_MODES = ["cash", "upi", "bank_transfer", "card", "cheque", "online"] as const;
export type FeeStatus = (typeof FEE_STATUSES)[number];
export type FeeMode = (typeof FEE_MODES)[number];

export const FEE_STATUS_LABEL: Record<FeeStatus, string> = {
  pending: "Pending", partially_paid: "Partially Paid", paid: "Paid",
  overdue: "Overdue", cancelled: "Cancelled",
};
export const FEE_MODE_LABEL: Record<FeeMode, string> = {
  cash: "Cash", upi: "UPI", bank_transfer: "Bank Transfer",
  card: "Card", cheque: "Cheque", online: "Online",
};

/** ============ FEE STRUCTURE ============ */
const structureSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  name: z.string().max(160).optional().nullable(),
  total_fee: z.number().nonnegative(),
  admission_fee: z.number().nonnegative().default(0),
  registration_fee: z.number().nonnegative().default(0),
  exam_fee: z.number().nonnegative().default(0),
  certificate_fee: z.number().nonnegative().default(0),
  study_material_fee: z.number().nonnegative().default(0),
  discount_allowed: z.number().nonnegative().default(0),
  status: z.string().default("active"),
});

export const listFeeStructures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fee_structure")
      .select("*, course:courses(id,name,code), branch:branches(id,name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const saveFeeStructure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => structureSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("fee_structure").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("fee_structure").insert(payload as any).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteFeeStructure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fee_structure").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** ============ STUDENT FEES ============ */

/** Get or create a student's fee ledger. Auto-seeds from course fee_structure or students.total_fee. */
export const getOrCreateStudentFee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("student_fees").select("*").eq("student_id", data.student_id).maybeSingle();
    if (existing) return existing as any;

    const { data: s, error: sErr } = await context.supabase
      .from("students").select("id, course_id, branch_id, total_fee").eq("id", data.student_id).single();
    if (sErr || !s) throw new Error(sErr?.message ?? "Student not found");

    let structure: any = null;
    if (s.course_id) {
      const { data: fs } = await context.supabase
        .from("fee_structure").select("*")
        .eq("course_id", s.course_id).eq("status", "active")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      structure = fs;
    }
    const total = Number(structure?.total_fee ?? (s as any).total_fee ?? 0);
    const { data: row, error } = await context.supabase.from("student_fees").insert({
      student_id: data.student_id,
      fee_structure_id: structure?.id ?? null,
      total_fee: total,
      discount_amount: 0,
      final_fee: total,
      due_amount: total,
      payment_status: total > 0 ? "pending" : "paid",
      created_by: context.userId,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row as any;
  });

export const updateStudentFee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    total_fee: z.number().nonnegative().optional(),
    discount_amount: z.number().nonnegative().optional(),
    notes: z.string().max(500).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: cur, error: e1 } = await context.supabase
      .from("student_fees").select("total_fee, discount_amount, paid_amount").eq("id", data.id).single();
    if (e1 || !cur) throw new Error(e1?.message ?? "Not found");
    const total = data.total_fee ?? Number(cur.total_fee);
    const disc = data.discount_amount ?? Number(cur.discount_amount);
    if (disc > total) throw new Error("Discount cannot exceed total fee");
    const final = Math.max(total - disc, 0);
    const paid = Number(cur.paid_amount);
    if (paid > final) throw new Error("Paid amount already exceeds new final fee");
    const status: FeeStatus = paid <= 0 ? "pending" : paid >= final ? "paid" : "partially_paid";
    const { error } = await context.supabase.from("student_fees").update({
      total_fee: total, discount_amount: disc, final_fee: final,
      due_amount: Math.max(final - paid, 0), payment_status: status,
      notes: data.notes ?? null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** ============ INSTALLMENTS / PAYMENTS ============ */
const collectSchema = z.object({
  student_fee_id: z.string().uuid(),
  amount: z.number().positive("Amount must be greater than zero"),
  paid_amount: z.number().positive("Payment must be greater than zero"),
  fine_amount: z.number().nonnegative().default(0),
  discount_amount: z.number().nonnegative().default(0),
  due_date: z.string().optional().nullable(),
  payment_mode: z.enum(FEE_MODES),
  transaction_reference: z.string().max(120).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

export const collectFee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => collectSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Validate student_fee exists and payment doesn't overshoot
    const { data: sf, error: e1 } = await context.supabase
      .from("student_fees").select("id, student_id, final_fee, paid_amount").eq("id", data.student_fee_id).single();
    if (e1 || !sf) throw new Error(e1?.message ?? "Fee ledger not found");
    const remaining = Number(sf.final_fee) - Number(sf.paid_amount);
    if (data.paid_amount > remaining + 0.001) {
      throw new Error(`Payment exceeds remaining balance (₹${remaining.toFixed(2)})`);
    }

    // Next installment number
    const { count } = await context.supabase
      .from("fee_installments").select("id", { count: "exact", head: true })
      .eq("student_fee_id", data.student_fee_id);
    const nextNum = (count ?? 0) + 1;

    const { data: row, error } = await context.supabase.from("fee_installments").insert({
      student_fee_id: data.student_fee_id,
      installment_number: nextNum,
      due_date: data.due_date || null,
      amount: data.amount,
      paid_amount: data.paid_amount,
      fine_amount: data.fine_amount,
      discount_amount: data.discount_amount,
      payment_mode: data.payment_mode,
      transaction_reference: data.transaction_reference || null,
      remarks: data.remarks || null,
      collected_by: context.userId,
    }).select("id, receipt_number, payment_date").single();
    if (error) throw new Error(error.message);

    // Notify the student
    try {
      await context.supabase.from("notifications").insert({
        title: "Fee payment received",
        description: `Payment of ₹${data.paid_amount.toFixed(2)} recorded. Receipt ${row.receipt_number}.`,
        type: "fees",
        student_id: sf.student_id,
        created_by: context.userId,
      } as any);
    } catch { /* ignore */ }

    return { ok: true, id: row.id, receipt_number: row.receipt_number };
  });

export const listInstallmentsForFee = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_fee_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("fee_installments").select("*").eq("student_fee_id", data.student_fee_id)
      .order("installment_number");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Cancel a payment (soft) — sets status to cancelled and zeros paid_amount so recalc drops it. */
export const cancelInstallment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), reason: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fee_installments")
      .update({ status: "cancelled", paid_amount: 0, remarks: data.reason || null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** ============ HISTORY / SEARCH ============ */
const historySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  branch_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  status: z.enum(FEE_STATUSES).optional(),
  mode: z.enum(FEE_MODES).optional(),
  receipt: z.string().optional(),
  q: z.string().optional(),
});

export const listPaymentHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => historySchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("fee_installments")
      .select(`id, receipt_number, amount, paid_amount, fine_amount, discount_amount,
               payment_date, payment_mode, transaction_reference, status, remarks, created_at,
               student_fee:student_fees!inner(
                 id, student:students!inner(id, full_name, student_code, enrollment_no, branch_id, course_id,
                   branch:branches(name), course:courses(name))
               )`)
      .order("payment_date", { ascending: false, nullsFirst: false })
      .limit(1000);
    if (data.from) q = q.gte("payment_date", data.from);
    if (data.to) q = q.lte("payment_date", data.to + "T23:59:59");
    if (data.status) q = q.eq("status", data.status);
    if (data.mode) q = q.eq("payment_mode", data.mode);
    if (data.receipt) q = q.ilike("receipt_number", `%${data.receipt}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let list = (rows ?? []) as any[];
    if (data.branch_id) list = list.filter((r) => r.student_fee?.student?.branch_id === data.branch_id);
    if (data.course_id) list = list.filter((r) => r.student_fee?.student?.course_id === data.course_id);
    if (data.student_id) list = list.filter((r) => r.student_fee?.student?.id === data.student_id);
    if (data.q) {
      const s = data.q.toLowerCase();
      list = list.filter((r) => {
        const st = r.student_fee?.student;
        return st?.full_name?.toLowerCase().includes(s)
          || st?.student_code?.toLowerCase().includes(s)
          || st?.enrollment_no?.toLowerCase().includes(s);
      });
    }
    return list;
  });

/** ============ RECEIPT ============ */
export const getReceipt = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("fee_installments")
      .select(`*, student_fee:student_fees!inner(
         id, total_fee, discount_amount, final_fee, paid_amount, due_amount, payment_status,
         student:students!inner(id, full_name, student_code, enrollment_no, phone, email,
           branch:branches(name, city), course:courses(name, code), batch:batches(name))
      )`)
      .eq("id", data.id).single();
    if (error) throw new Error(error.message);
    let collector: string | null = null;
    if ((row as any).collected_by) {
      const { data: p } = await context.supabase
        .from("profiles").select("full_name, email").eq("id", (row as any).collected_by).maybeSingle();
      collector = (p as any)?.full_name || (p as any)?.email || null;
    }
    return { ...(row as any), collector };
  });

/** ============ STUDENT SELF-SERVICE ============ */
export const myFeeLedger = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: s } = await context.supabase
      .from("students")
      .select("id, full_name, student_code, enrollment_no, branch:branches(name), course:courses(name)")
      .eq("user_id", context.userId).maybeSingle();
    if (!s) return { student: null, fee: null, installments: [] };
    const { data: fee } = await context.supabase
      .from("student_fees").select("*").eq("student_id", (s as any).id).maybeSingle();
    let installments: any[] = [];
    if (fee) {
      const { data: rows } = await context.supabase
        .from("fee_installments").select("*").eq("student_fee_id", (fee as any).id)
        .order("installment_number");
      installments = rows ?? [];
    }
    return { student: s, fee, installments };
  });

/** ============ ANALYTICS ============ */
export const feeAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 8) + "01";
    const yearStart = today.slice(0, 4) + "-01-01";

    const [{ data: todayRows }, { data: monthRows }, { data: yearRows }, { data: fees }] = await Promise.all([
      context.supabase.from("fee_installments").select("paid_amount").gte("payment_date", today + "T00:00:00").lte("payment_date", today + "T23:59:59").neq("status", "cancelled"),
      context.supabase.from("fee_installments").select("paid_amount, payment_date").gte("payment_date", monthStart + "T00:00:00").neq("status", "cancelled"),
      context.supabase.from("fee_installments").select("paid_amount, payment_date").gte("payment_date", yearStart + "T00:00:00").neq("status", "cancelled"),
      context.supabase.from("student_fees").select("final_fee, paid_amount, due_amount, payment_status"),
    ]);

    const sum = (arr: any[] | null, k: string) => (arr ?? []).reduce((a, r) => a + Number(r[k] || 0), 0);
    const todayCollection = sum(todayRows, "paid_amount");
    const monthCollection = sum(monthRows, "paid_amount");
    const yearCollection = sum(yearRows, "paid_amount");
    const outstanding = (fees ?? []).reduce((a, r: any) => a + Number(r.due_amount || 0), 0);
    const pending = (fees ?? []).filter((r: any) => r.payment_status === "pending" || r.payment_status === "partially_paid").length;
    const overdue = (fees ?? []).filter((r: any) => r.payment_status === "overdue").length;

    // Monthly trend (last 6 months)
    const now = new Date();
    const trend: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-IN", { month: "short" });
      const amount = (yearRows ?? []).filter((r: any) => {
        if (!r.payment_date) return false;
        const c = new Date(r.payment_date);
        return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear();
      }).reduce((a, r: any) => a + Number(r.paid_amount || 0), 0);
      trend.push({ month: key, amount });
    }

    return { todayCollection, monthCollection, yearCollection, outstanding, pending, overdue, trend };
  });

/** ============ REPORTS ============ */
export const feeReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    from: z.string().optional(), to: z.string().optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("fee_installments")
      .select(`paid_amount, fine_amount, discount_amount, payment_date, payment_mode, status,
               student_fee:student_fees!inner(student:students!inner(branch_id, course_id,
                 branch:branches(name), course:courses(name)))`)
      .neq("status", "cancelled").limit(5000);
    if (data.from) q = q.gte("payment_date", data.from + "T00:00:00");
    if (data.to) q = q.lte("payment_date", data.to + "T23:59:59");
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const byCourse = new Map<string, number>();
    const byBranch = new Map<string, number>();
    const byMode = new Map<string, number>();
    let totalCollected = 0, totalFine = 0, totalDiscount = 0;
    (rows ?? []).forEach((r: any) => {
      totalCollected += Number(r.paid_amount || 0);
      totalFine += Number(r.fine_amount || 0);
      totalDiscount += Number(r.discount_amount || 0);
      const c = r.student_fee?.student?.course?.name ?? "—";
      const b = r.student_fee?.student?.branch?.name ?? "—";
      byCourse.set(c, (byCourse.get(c) ?? 0) + Number(r.paid_amount || 0));
      byBranch.set(b, (byBranch.get(b) ?? 0) + Number(r.paid_amount || 0));
      byMode.set(r.payment_mode ?? "—", (byMode.get(r.payment_mode ?? "—") ?? 0) + Number(r.paid_amount || 0));
    });

    // Outstanding
    const { data: fees } = await context.supabase
      .from("student_fees").select(`due_amount, payment_status,
        student:students!inner(full_name, student_code, branch:branches(name), course:courses(name))`)
      .gt("due_amount", 0).limit(2000);
    const outstanding = (fees ?? []).map((r: any) => ({
      name: r.student?.full_name, code: r.student?.student_code,
      branch: r.student?.branch?.name, course: r.student?.course?.name,
      due_amount: Number(r.due_amount), status: r.payment_status,
    }));

    return {
      totalCollected, totalFine, totalDiscount,
      byCourse: Array.from(byCourse, ([name, amount]) => ({ name, amount })),
      byBranch: Array.from(byBranch, ([name, amount]) => ({ name, amount })),
      byMode: Array.from(byMode, ([name, amount]) => ({ name, amount })),
      outstanding,
    };
  });

/** ============ SEARCH STUDENTS (for admin fee lookup) ============ */
export const searchStudentsForFees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ q: z.string().max(120).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("students")
      .select("id, full_name, student_code, enrollment_no, phone, branch:branches(name), course:courses(name)")
      .is("deleted_at", null).limit(50);
    if (data.q) q = q.or(`full_name.ilike.%${data.q}%,student_code.ilike.%${data.q}%,enrollment_no.ilike.%${data.q}%,phone.ilike.%${data.q}%`);
    const { data: rows, error } = await q.order("full_name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });