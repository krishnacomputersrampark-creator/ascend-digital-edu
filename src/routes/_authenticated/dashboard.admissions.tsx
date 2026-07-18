import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Check, X, UserPlus, Download, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import {
  listAdmissions,
  updateAdmissionStatus,
  convertAdmissionToStudent,
  listBranchesPublic,
} from "@/lib/admissions.functions";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_authenticated/dashboard/admissions")({
  head: () => ({ meta: [{ title: "Admissions · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: AdmissionsPage,
});

type Row = Awaited<ReturnType<typeof listAdmissions>>[number];
type Branch = Awaited<ReturnType<typeof listBranchesPublic>>[number];

function AdmissionsPage() {
  const fetchList = useServerFn(listAdmissions);
  const fetchBranches = useServerFn(listBranchesPublic);
  const setStatus = useServerFn(updateAdmissionStatus);
  const convert = useServerFn(convertAdmissionToStudent);

  const [rows, setRows] = useState<Row[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "cancelled">("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchList({ data: { status, q } });
      setRows(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBranches().then(setBranches); }, [fetchBranches]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter(r => r.status === "pending").length,
      approved: rows.filter(r => r.status === "approved").length,
      rejected: rows.filter(r => r.status === "rejected").length,
    };
  }, [rows]);

  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admissions");
    XLSX.writeFile(wb, `admissions_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const act = async (fn: () => Promise<any>, id: string) => {
    setBusyId(id);
    try { await fn(); await load(); } catch (e: any) { alert(e?.message ?? "Failed"); }
    finally { setBusyId(null); }
  };

  return (
    <DashboardShell
      title="Admissions"
      subtitle="Review, approve and convert online applications into enrolled students."
      actions={
        <>
          <button onClick={exportXlsx} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft hover:-translate-y-0.5 transition">
            <Download className="h-4 w-4" /> Export
          </button>
        </>
      }
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Showing", value: stats.total, color: "from-blue-500 to-cyan-500" },
          { label: "Pending", value: stats.pending, color: "from-amber-500 to-orange-500" },
          { label: "Approved", value: stats.approved, color: "from-emerald-500 to-teal-500" },
          { label: "Rejected", value: stats.rejected, color: "from-rose-500 to-red-500" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-white p-4 shadow-soft">
            <div className={`inline-flex rounded-lg bg-gradient-to-br ${s.color} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white`}>{s.label}</div>
            <div className="mt-2 text-2xl font-extrabold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-soft">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search name, phone or application no…"
              className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex gap-1 rounded-full bg-cyan-soft p-1">
            {(["pending","approved","rejected","all"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === s ? "gradient-brand text-white shadow-brand" : "text-brand-dark hover:bg-white"}`}>
                {s[0].toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={load} className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink shadow-soft">Refresh</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-cyan-soft/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
              <tr>
                <th className="px-4 py-3">App No.</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="py-14 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-14 text-center text-muted-foreground">No admissions found.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-cyan-soft/30">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-brand-dark">{r.admission_no}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3 text-xs">{r.course_preference || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status as string} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at as string).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {r.status === "pending" && (
                        <>
                          <button
                            disabled={busyId === r.id || branches.length === 0}
                            onClick={() => act(() => convert({ data: { id: r.id, branch_id: r.branch_id ?? branches[0].id } }), r.id)}
                            className="inline-flex items-center gap-1 rounded-lg gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-brand disabled:opacity-50"
                            title="Approve and convert to Student"
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Enroll
                          </button>
                          <button
                            disabled={busyId === r.id}
                            onClick={() => act(() => setStatus({ data: { id: r.id, status: "rejected" } }), r.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {r.status !== "pending" && (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => act(() => setStatus({ data: { id: r.id, status: "pending" } }), r.id)}
                          className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    cancelled: "bg-slate-200 text-slate-700",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${map[status] ?? "bg-slate-100 text-slate-700"}`}>{status === "approved" && <Check className="h-3 w-3" />}{status}</span>;
}