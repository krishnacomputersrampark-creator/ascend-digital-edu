import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2, Save, User as UserIcon, Receipt, Printer } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import {
  searchStudentsForFees, getOrCreateStudentFee, updateStudentFee,
  listInstallmentsForFee, collectFee, FEE_MODES, FEE_MODE_LABEL, FEE_STATUS_LABEL,
} from "@/lib/fees.functions";

export const Route = createFileRoute("/_authenticated/dashboard/fees/collect")({
  head: () => ({ meta: [{ title: "Collect Fee · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: CollectFeePage,
});

const inr = (n: number | string) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function CollectFeePage() {
  const doSearch = useServerFn(searchStudentsForFees);
  const openLedger = useServerFn(getOrCreateStudentFee);
  const updateLedger = useServerFn(updateStudentFee);
  const listInst = useServerFn(listInstallmentsForFee);
  const doCollect = useServerFn(collectFee);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [fee, setFee] = useState<any>(null);
  const [insts, setInsts] = useState<any[]>([]);

  const [totalFee, setTotalFee] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState("");
  const [fine, setFine] = useState("0");
  const [mode, setMode] = useState<(typeof FEE_MODES)[number]>("cash");
  const [txn, setTxn] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const onSearch = async () => {
    setSearching(true);
    try { setResults(await doSearch({ data: { q } })); }
    catch (e: any) { toast.error(e.message); }
    finally { setSearching(false); }
  };

  const selectStudent = async (s: any) => {
    setStudent(s); setResults([]);
    try {
      const f = await openLedger({ data: { student_id: s.id } });
      setFee(f);
      setTotalFee(String(f.total_fee ?? 0));
      setDiscount(String(f.discount_amount ?? 0));
      const rows = await listInst({ data: { student_fee_id: f.id } });
      setInsts(rows as any[]);
    } catch (e: any) { toast.error(e.message); }
  };

  const refreshLedger = async () => {
    if (!student) return;
    const f = await openLedger({ data: { student_id: student.id } });
    setFee(f);
    const rows = await listInst({ data: { student_fee_id: f.id } });
    setInsts(rows as any[]);
  };

  const saveStructure = async () => {
    if (!fee) return;
    try {
      await updateLedger({ data: { id: fee.id, total_fee: Number(totalFee), discount_amount: Number(discount) } });
      toast.success("Fee ledger updated");
      await refreshLedger();
    } catch (e: any) { toast.error(e.message); }
  };

  const submitPayment = async () => {
    if (!fee) { toast.error("Select a student first"); return; }
    const a = Number(amount), p = Number(paid);
    if (!(a > 0)) { toast.error("Installment amount must be positive"); return; }
    if (!(p > 0)) { toast.error("Payment amount must be positive"); return; }
    setSaving(true);
    try {
      const res = await doCollect({ data: {
        student_fee_id: fee.id, amount: a, paid_amount: p, fine_amount: Number(fine) || 0,
        discount_amount: 0, due_date: dueDate || null, payment_mode: mode,
        transaction_reference: txn || null, remarks: remarks || null,
      } });
      toast.success(`Payment saved · Receipt ${res.receipt_number}`);
      setAmount(""); setPaid(""); setFine("0"); setTxn(""); setRemarks(""); setDueDate("");
      await refreshLedger();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const remaining = useMemo(() => fee ? Math.max(Number(fee.final_fee) - Number(fee.paid_amount), 0) : 0, [fee]);

  return (
    <DashboardShell title="Collect Fee" subtitle="Search a student, review their ledger, and record a payment.">
      <section className="rounded-2xl border bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Search Student</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="Name, code, enrollment or phone…"
                className="w-full rounded-full border px-10 py-2 text-sm"
              />
            </div>
          </div>
          <button onClick={onSearch} disabled={searching} className="rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </div>
        {results.length > 0 && (
          <div className="mt-3 divide-y rounded-xl border">
            {results.map((r) => (
              <button key={r.id} onClick={() => selectStudent(r)} className="flex w-full items-center justify-between p-3 text-left hover:bg-cyan-soft/30">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-soft text-brand"><UserIcon className="h-4 w-4" /></span>
                  <div>
                    <div className="text-sm font-semibold text-ink">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.student_code} · {r.course?.name ?? "—"} · {r.branch?.name ?? "—"}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-brand">Open ledger →</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {student && fee && (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-2xl border bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">{student.full_name}</h3>
                <p className="text-xs text-muted-foreground">{student.student_code} · {student.course?.name ?? "—"} · {student.branch?.name ?? "—"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                fee.payment_status === "paid" ? "bg-emerald-100 text-emerald-700"
                : fee.payment_status === "partially_paid" ? "bg-amber-100 text-amber-700"
                : fee.payment_status === "overdue" ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700"
              }`}>{FEE_STATUS_LABEL[fee.payment_status as keyof typeof FEE_STATUS_LABEL]}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Total" value={inr(fee.total_fee)} />
              <Stat label="Discount" value={inr(fee.discount_amount)} />
              <Stat label="Paid" value={inr(fee.paid_amount)} tint="text-emerald-600" />
              <Stat label="Due" value={inr(fee.due_amount)} tint="text-red-600" />
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border bg-cyan-soft/20 p-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Total Fee</label>
                <input type="number" min={0} value={totalFee} onChange={(e) => setTotalFee(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Discount</label>
                <input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm" />
              </div>
              <div className="flex items-end">
                <button onClick={saveStructure} className="w-full rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">Update Ledger</button>
              </div>
            </div>

            <h4 className="mt-5 mb-2 text-sm font-bold text-ink">Payment History</h4>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead className="bg-cyan-soft/40 text-left font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2">#</th><th className="p-2">Receipt</th><th className="p-2">Date</th>
                    <th className="p-2">Mode</th><th className="p-2">Amount</th><th className="p-2">Paid</th>
                    <th className="p-2">Status</th><th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {insts.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No payments yet.</td></tr>}
                  {insts.map((i) => (
                    <tr key={i.id} className="border-t hover:bg-cyan-soft/20">
                      <td className="p-2 font-semibold">{i.installment_number}</td>
                      <td className="p-2 font-mono">{i.receipt_number || "—"}</td>
                      <td className="p-2">{i.payment_date ? new Date(i.payment_date).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="p-2">{i.payment_mode ? FEE_MODE_LABEL[i.payment_mode as keyof typeof FEE_MODE_LABEL] : "—"}</td>
                      <td className="p-2">{inr(i.amount)}</td>
                      <td className="p-2 font-semibold text-emerald-700">{inr(i.paid_amount)}</td>
                      <td className="p-2">{FEE_STATUS_LABEL[i.status as keyof typeof FEE_STATUS_LABEL]}</td>
                      <td className="p-2">
                        {i.receipt_number && (
                          <Link to="/dashboard/fees/receipt/$id" params={{ id: i.id }} className="inline-flex items-center gap-1 text-brand hover:underline">
                            <Printer className="h-3 w-3" /> Receipt
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-brand" />
              <h3 className="text-base font-bold text-ink">New Payment</h3>
            </div>
            <div className="mb-3 rounded-lg bg-cyan-soft/40 px-3 py-2 text-xs">
              Remaining balance: <b className="text-brand-dark">{inr(remaining)}</b>
            </div>
            <div className="space-y-2">
              <Field label="Installment Amount"><input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm" /></Field>
              <Field label="Amount Paid"><input type="number" min={0} value={paid} onChange={(e) => setPaid(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm" /></Field>
              <Field label="Fine (optional)"><input type="number" min={0} value={fine} onChange={(e) => setFine(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm" /></Field>
              <Field label="Payment Mode">
                <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="w-full rounded-lg border px-3 py-1.5 text-sm">
                  {FEE_MODES.map((m) => <option key={m} value={m}>{FEE_MODE_LABEL[m]}</option>)}
                </select>
              </Field>
              <Field label="Transaction Reference"><input value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="UPI ref / cheque no…" className="w-full rounded-lg border px-3 py-1.5 text-sm" /></Field>
              <Field label="Due Date (next)"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm" /></Field>
              <Field label="Remarks"><input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm" /></Field>
              <button onClick={submitPayment} disabled={saving} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Payment
              </button>
            </div>
          </section>
        </div>
      )}

      {!student && (
        <div className="mt-6 rounded-2xl border bg-white p-10 text-center text-sm text-muted-foreground shadow-soft">
          Search a student to open their fee ledger.
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-[10px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-extrabold ${tint ?? "text-ink"}`}>{value}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">{label}</span>{children}</label>;
}