import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listExams, loadMarksEntry, setResultsStatus, RESULT_STATUS_LABEL } from "@/lib/results.functions";

export const Route = createFileRoute("/_authenticated/dashboard/results/publish")({
  head: () => ({ meta: [{ title: "Publish Results · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: PublishPage,
});

function PublishPage() {
  const fnExams = useServerFn(listExams);
  const fnLoad = useServerFn(loadMarksEntry);
  const fnSet = useServerFn(setResultsStatus);
  const [exams, setExams] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [data, setData] = useState<any | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => { fnExams().then(setExams); }, [fnExams]);

  useEffect(() => {
    if (!selected) { setData(null); setPicked(new Set()); return; }
    fnLoad({ data: { exam_id: selected } }).then(setData);
  }, [selected, fnLoad]);

  const byStudent = useMemo(() => {
    const m = new Map<string, any>();
    for (const r of (data?.results ?? []) as any[]) m.set(r.student_id, r);
    return m;
  }, [data]);

  const togglePick = (id: string) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const pickAll = () => setPicked(new Set((data?.students ?? []).map((s: any) => s.id).filter((id: string) => byStudent.get(id))));

  const act = async (status: "published" | "draft" | "withheld") => {
    if (!selected) return;
    const ids = Array.from(picked);
    const label = status === "published" ? "publish" : status === "draft" ? "unpublish" : "withhold";
    if (!confirm(`Are you sure you want to ${label} ${ids.length || "all"} result(s)?`)) return;
    setBusy(true);
    try {
      const res = await fnSet({ data: { exam_id: selected, status, student_ids: ids.length ? ids : undefined } });
      toast.success(`${res.count} result(s) updated`);
      setData(await fnLoad({ data: { exam_id: selected } }));
      setPicked(new Set());
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <DashboardShell>
      <div className="mb-4"><Link to="/dashboard/results" className="text-xs font-semibold text-brand hover:underline">← Back to Results</Link></div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Publishing</div>
          <h1 className="text-2xl font-black text-ink">Publish / withhold results</h1>
        </div>
        <div className="ml-auto">
          <label className="text-xs font-semibold text-slate-600">Select Exam</label>
          <select className="mt-1 w-72 rounded-xl border bg-white px-3 py-2 text-sm" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">— Select —</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
          </select>
        </div>
      </div>

      {data && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={pickAll} className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Select all with results</button>
            <button onClick={() => setPicked(new Set())} className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Clear</button>
            <div className="ml-auto flex gap-2">
              <button disabled={busy} onClick={() => act("published")} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:brightness-110 disabled:opacity-60 flex items-center gap-1.5">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>}Publish selected</button>
              <button disabled={busy} onClick={() => act("withheld")} className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow hover:brightness-110 disabled:opacity-60 flex items-center gap-1.5"><EyeOff className="h-4 w-4"/>Withhold</button>
              <button disabled={busy} onClick={() => act("draft")} className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">Unpublish</button>
            </div>
          </div>

          <div className="mt-4 overflow-auto rounded-2xl border bg-white/70 backdrop-blur">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>
                <th className="p-2 w-8"></th><th className="p-2">Student</th><th className="p-2">Marks</th><th className="p-2">%</th><th className="p-2">Grade</th><th className="p-2">Result</th><th className="p-2">Status</th>
              </tr></thead>
              <tbody>
                {(data.students as any[]).map((st: any) => {
                  const r = byStudent.get(st.id);
                  return (
                    <tr key={st.id} className="border-t hover:bg-slate-50">
                      <td className="p-2"><input type="checkbox" disabled={!r} checked={picked.has(st.id)} onChange={() => togglePick(st.id)}/></td>
                      <td className="p-2"><div className="font-semibold text-ink">{st.full_name}</div><div className="text-[10px] font-mono text-slate-500">{st.student_code}</div></td>
                      <td className="p-2 font-mono">{r ? `${r.obtained_marks}/${r.total_marks}` : "—"}</td>
                      <td className="p-2 font-mono">{r?.percentage ?? "—"}%</td>
                      <td className="p-2 font-bold">{r?.grade ?? "—"}</td>
                      <td className="p-2">{r?.pass_fail ?? "—"}</td>
                      <td className="p-2"><span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (r?.result_status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700")}>{r ? RESULT_STATUS_LABEL[r.result_status as keyof typeof RESULT_STATUS_LABEL] : "No entry"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
