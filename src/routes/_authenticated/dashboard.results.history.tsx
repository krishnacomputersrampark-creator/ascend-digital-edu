import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Search, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listResults, RESULT_STATUS_LABEL, EXAM_TYPE_LABEL } from "@/lib/results.functions";

export const Route = createFileRoute("/_authenticated/dashboard/results/history")({
  head: () => ({ meta: [{ title: "Results History · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: ResultsHistoryPage,
});

function ResultsHistoryPage() {
  const fn = useServerFn(listResults);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fn().then(setRows).finally(() => setLoading(false)); }, [fn]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(r => {
      if (status && r.result_status !== status) return false;
      if (!needle) return true;
      return [r.student?.full_name, r.student?.student_code, r.student?.roll_no, r.exam?.exam_name]
        .some(v => String(v ?? "").toLowerCase().includes(needle));
    });
  }, [rows, q, status]);

  const exportCsv = () => {
    const header = ["Student","Code","Roll","Exam","Type","Date","Total","Obtained","%","Grade","Division","Result","Status"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      lines.push([
        r.student?.full_name, r.student?.student_code, r.student?.roll_no ?? "",
        r.exam?.exam_name, EXAM_TYPE_LABEL[r.exam?.exam_type as keyof typeof EXAM_TYPE_LABEL] ?? "", r.exam?.exam_date ?? "",
        r.total_marks, r.obtained_marks, r.percentage, r.grade ?? "", r.division ?? "",
        r.pass_fail ?? "", RESULT_STATUS_LABEL[r.result_status as keyof typeof RESULT_STATUS_LABEL] ?? r.result_status,
      ].map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `results-${Date.now()}.csv`; a.click();
  };

  return (
    <DashboardShell>
      <div className="mb-4"><Link to="/dashboard/results" className="text-xs font-semibold text-brand hover:underline">← Back to Results</Link></div>
      <div className="flex flex-wrap items-end gap-3">
        <div><div className="text-xs font-semibold uppercase tracking-widest text-brand">History</div><h1 className="text-2xl font-black text-ink">All results</h1></div>
        <div className="ml-auto flex gap-2">
          <div className="relative"><Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input className="w-64 rounded-xl border bg-white pl-8 pr-3 py-2 text-sm" placeholder="Search student, roll, exam…" value={q} onChange={e => setQ(e.target.value)}/></div>
          <select className="rounded-xl border bg-white px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(RESULT_STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={exportCsv} className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white flex items-center gap-1.5"><Download className="h-4 w-4"/>Export CSV</button>
        </div>
      </div>

      <div className="mt-4 overflow-auto rounded-2xl border bg-white/70 backdrop-blur">
        {loading ? <div className="p-6 flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Loading…</div> : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>
            <th className="p-2">Student</th><th className="p-2">Exam</th><th className="p-2">Date</th><th className="p-2 text-right">Marks</th><th className="p-2 text-right">%</th><th className="p-2">Grade</th><th className="p-2">Result</th><th className="p-2">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-slate-50">
                <td className="p-2"><div className="font-semibold text-ink">{r.student?.full_name}</div><div className="text-[10px] font-mono text-slate-500">{r.student?.student_code}</div></td>
                <td className="p-2">{r.exam?.exam_name}</td>
                <td className="p-2">{r.exam?.exam_date ?? "—"}</td>
                <td className="p-2 text-right font-mono">{r.obtained_marks}/{r.total_marks}</td>
                <td className="p-2 text-right font-mono">{r.percentage}%</td>
                <td className="p-2 font-bold">{r.grade ?? "—"}</td>
                <td className="p-2">{r.pass_fail ?? "—"}</td>
                <td className="p-2"><span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (r.result_status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700")}>{RESULT_STATUS_LABEL[r.result_status as keyof typeof RESULT_STATUS_LABEL]}</span></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={8} className="p-6 text-center text-slate-500">No results found</td></tr>}
          </tbody>
        </table>
        )}
      </div>
    </DashboardShell>
  );
}
