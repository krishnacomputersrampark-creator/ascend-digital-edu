import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Printer, Filter } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listBranchesPublic, listCoursesPublic } from "@/lib/admissions.functions";
import { listPaymentHistory, FEE_MODES, FEE_MODE_LABEL, FEE_STATUSES, FEE_STATUS_LABEL } from "@/lib/fees.functions";

export const Route = createFileRoute("/_authenticated/dashboard/fees/history")({
  head: () => ({ meta: [{ title: "Payment History · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: FeeHistoryPage,
});

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function FeeHistoryPage() {
  const fetchRows = useServerFn(listPaymentHistory);
  const fetchBranches = useServerFn(listBranchesPublic);
  const fetchCourses = useServerFn(listCoursesPublic);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState<string>("");
  const [mode, setMode] = useState<string>("");
  const [receipt, setReceipt] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => { fetchBranches().then(setBranches); fetchCourses().then(setCourses); load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchRows({ data: {
        from: from || undefined, to: to || undefined,
        branch_id: branch || undefined, course_id: course || undefined,
        status: (status || undefined) as any, mode: (mode || undefined) as any,
        receipt: receipt || undefined, q: q || undefined,
      } });
      setRows(r as any[]);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const exportCsv = () => {
    const header = ["Receipt","Date","Student","Code","Course","Branch","Mode","Amount","Paid","Fine","Status"];
    const lines = [header.join(",")].concat(rows.map((r) => {
      const st = r.student_fee?.student;
      return [
        r.receipt_number ?? "",
        r.payment_date ? new Date(r.payment_date).toLocaleDateString("en-IN") : "",
        `"${st?.full_name ?? ""}"`, st?.student_code ?? "",
        `"${st?.course?.name ?? ""}"`, `"${st?.branch?.name ?? ""}"`,
        r.payment_mode ?? "", r.amount ?? 0, r.paid_amount ?? 0, r.fine_amount ?? 0, r.status ?? "",
      ].join(",");
    }));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `fee-history-${Date.now()}.csv`; a.click();
  };

  const total = rows.reduce((a, r) => a + Number(r.paid_amount || 0), 0);

  return (
    <DashboardShell
      title="Payment History"
      subtitle="Search and export payment records across the institute."
      actions={
        <>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-brand"><Download className="h-4 w-4" /> Export CSV</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-brand"><Printer className="h-4 w-4" /> Print</button>
        </>
      }
    >
      <section className="rounded-2xl border bg-white p-4 shadow-soft">
        <div className="grid gap-2 md:grid-cols-4 lg:grid-cols-8">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" placeholder="From" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" placeholder="To" />
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All branches</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All courses</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Any status</option>{FEE_STATUSES.map((s) => <option key={s} value={s}>{FEE_STATUS_LABEL[s]}</option>)}
          </select>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Any mode</option>{FEE_MODES.map((m) => <option key={m} value={m}>{FEE_MODE_LABEL[m]}</option>)}
          </select>
          <input value={receipt} onChange={(e) => setReceipt(e.target.value)} placeholder="Receipt #" className="rounded-lg border px-3 py-2 text-sm" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Student name / code…" className="rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
            <Filter className="h-4 w-4" /> {loading ? "Loading…" : "Apply Filters"}
          </button>
          <div className="text-xs text-muted-foreground">Records: <b className="text-ink">{rows.length}</b> · Total: <b className="text-emerald-700">{inr(total)}</b></div>
        </div>
      </section>

      <section className="mt-5 overflow-x-auto rounded-2xl border bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-cyan-soft/40 text-left text-xs font-bold uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Receipt</th><th className="p-3">Date</th><th className="p-3">Student</th>
              <th className="p-3">Course</th><th className="p-3">Branch</th><th className="p-3">Mode</th>
              <th className="p-3">Paid</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">No records match your filters.</td></tr>}
            {rows.map((r) => {
              const st = r.student_fee?.student;
              return (
                <tr key={r.id} className="border-t hover:bg-cyan-soft/20">
                  <td className="p-3 font-mono text-xs">{r.receipt_number || "—"}</td>
                  <td className="p-3">{r.payment_date ? new Date(r.payment_date).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-3"><div className="font-semibold text-ink">{st?.full_name}</div><div className="text-xs text-muted-foreground">{st?.student_code}</div></td>
                  <td className="p-3">{st?.course?.name ?? "—"}</td>
                  <td className="p-3">{st?.branch?.name ?? "—"}</td>
                  <td className="p-3">{r.payment_mode ? FEE_MODE_LABEL[r.payment_mode as keyof typeof FEE_MODE_LABEL] : "—"}</td>
                  <td className="p-3 font-semibold text-emerald-700">{inr(r.paid_amount)}</td>
                  <td className="p-3">{FEE_STATUS_LABEL[r.status as keyof typeof FEE_STATUS_LABEL]}</td>
                  <td className="p-3">
                    <Link to="/dashboard/fees/receipt/$id" params={{ id: r.id }} className="text-brand hover:underline text-xs font-semibold">Open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}