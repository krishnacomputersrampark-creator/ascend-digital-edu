import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listExams, loadMarksEntry, saveMarksEntry, EXAM_TYPE_LABEL } from "@/lib/results.functions";

export const Route = createFileRoute("/_authenticated/dashboard/results/marks-entry")({
  head: () => ({ meta: [{ title: "Marks Entry · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => z.object({ exam_id: z.string().uuid().optional() }).parse(s),
  component: MarksEntryPage,
});

function MarksEntryPage() {
  const { exam_id } = Route.useSearch();
  const nav = Route.useNavigate();
  const fnExams = useServerFn(listExams);
  const fnLoad = useServerFn(loadMarksEntry);
  const fnSave = useServerFn(saveMarksEntry);

  const [exams, setExams] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | undefined>(exam_id);
  const [data, setData] = useState<any | null>(null);
  const [rows, setRows] = useState<Record<string, Record<string, { theory: number; practical: number; internal: number; remarks?: string }>>>({});
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fnExams().then(setExams); }, [fnExams]);

  useEffect(() => {
    if (!selected) { setData(null); return; }
    setLoading(true);
    fnLoad({ data: { exam_id: selected } })
      .then(d => {
        setData(d);
        // Prime rows with existing details
        const r: Record<string, Record<string, any>> = {};
        const rem: Record<string, string> = {};
        for (const res of d.results as any[]) {
          rem[res.student_id] = res.remarks ?? "";
          r[res.student_id] = {};
        }
        for (const det of d.details as any[]) {
          const sr = (d.results as any[]).find(x => x.id === det.student_result_id);
          if (!sr) continue;
          r[sr.student_id] = r[sr.student_id] ?? {};
          r[sr.student_id][det.subject_id] = {
            theory: Number(det.theory_marks ?? 0),
            practical: Number(det.practical_marks ?? 0),
            internal: Number(det.internal_marks ?? 0),
            remarks: det.remarks ?? "",
          };
        }
        setRows(r); setStudentRemarks(rem);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [selected, fnLoad]);

  const setMark = (studentId: string, subjectId: string, field: "theory" | "practical" | "internal", value: number, max: number) => {
    setRows(prev => {
      const s = { ...(prev[studentId] ?? {}) };
      const cur = { theory: 0, practical: 0, internal: 0, ...((s[subjectId] as any) ?? {}) } as { theory: number; practical: number; internal: number };
      const clamped = Math.max(0, Math.min(value || 0, max));
      cur[field] = clamped;
      s[subjectId] = cur;
      return { ...prev, [studentId]: s };
    });
  };

  const totalsFor = (studentId: string) => {
    const r = rows[studentId] ?? {};
    let obtained = 0, total = 0;
    for (const s of (data?.subjects ?? []) as any[]) {
      const m = r[s.id];
      obtained += (m?.theory ?? 0) + (m?.practical ?? 0) + (m?.internal ?? 0);
      total += Number(s.maximum_marks);
    }
    const pct = total ? Math.round((obtained / total) * 10000) / 100 : 0;
    return { obtained, total, pct };
  };

  const onSave = async () => {
    if (!selected || !data) return;
    setSaving(true);
    try {
      const payload = (data.students as any[]).map(st => ({
        student_id: st.id,
        remarks: studentRemarks[st.id] ?? null,
        marks: (data.subjects as any[]).map(sub => {
          const m = rows[st.id]?.[sub.id] ?? { theory: 0, practical: 0, internal: 0 };
          return {
            subject_id: sub.id,
            theory_marks: m.theory ?? 0,
            practical_marks: m.practical ?? 0,
            internal_marks: m.internal ?? 0,
            remarks: m.remarks ?? null,
          };
        }),
      })).filter(r => r.marks.some(m => m.theory_marks || m.practical_marks || m.internal_marks));

      if (!payload.length) return toast.error("Enter marks for at least one student");
      const res = await fnSave({ data: { exam_id: selected, rows: payload } });
      toast.success(`Saved for ${res.count} student(s)`);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const input = "w-16 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-brand text-right";

  return (
    <DashboardShell>
      <div className="mb-4"><Link to="/dashboard/results" className="text-xs font-semibold text-brand hover:underline">← Back to Results</Link></div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Marks Entry</div>
          <h1 className="text-2xl font-black text-ink">Enter marks by exam</h1>
        </div>
        <div className="ml-auto">
          <label className="text-xs font-semibold text-slate-600">Select Exam</label>
          <select
            className="mt-1 w-72 rounded-xl border bg-white px-3 py-2 text-sm"
            value={selected ?? ""}
            onChange={e => { const v = e.target.value || undefined; setSelected(v); nav({ search: { exam_id: v }, replace: true }); }}
          >
            <option value="">— Select —</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name} · {EXAM_TYPE_LABEL[e.exam_type as keyof typeof EXAM_TYPE_LABEL] ?? e.exam_type}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="mt-6 flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Loading roster…</div>}

      {data && !loading && (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border bg-white/70 p-3 backdrop-blur">
            <div className="text-sm"><span className="font-bold text-ink">{data.exam.exam_name}</span> · {data.exam.course?.name ?? "—"} {data.exam.batch?.name ? ` · ${data.exam.batch.name}` : ""}</div>
            <div className="ml-auto text-xs text-slate-500 flex items-center gap-1.5"><Users className="h-4 w-4"/>{data.students.length} students · {data.subjects.length} subjects</div>
            <button onClick={onSave} disabled={saving || !data.subjects.length} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60 flex items-center gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}Save Marks
            </button>
          </div>

          {!data.subjects.length && <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-800">No subjects for this course. <Link to="/dashboard/results/create" className="font-semibold underline">Add subjects</Link> first.</div>}
          {!data.students.length && <div className="rounded-xl border bg-amber-50 p-4 text-sm text-amber-800">No active students match this exam's course/batch/branch.</div>}

          {!!(data.subjects.length && data.students.length) && (
            <div className="overflow-auto rounded-2xl border bg-white/70 backdrop-blur">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="p-2 sticky left-0 bg-slate-50">#</th>
                    <th className="p-2 sticky left-8 bg-slate-50 min-w-[180px]">Student</th>
                    {(data.subjects as any[]).map(s => (
                      <th key={s.id} className="p-2 text-center border-l" colSpan={3}>
                        <div className="font-bold text-ink">{s.subject_code}</div>
                        <div className="text-[10px] text-slate-500">Max {s.maximum_marks}</div>
                        <div className="mt-0.5 flex gap-1 justify-center text-[10px] text-slate-500">
                          <span className="w-16">Th</span><span className="w-16">Pr</span><span className="w-16">Int</span>
                        </div>
                      </th>
                    ))}
                    <th className="p-2 text-right border-l">Total</th>
                    <th className="p-2 text-right">%</th>
                    <th className="p-2 min-w-[140px]">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.students as any[]).map((st, idx) => {
                    const t = totalsFor(st.id);
                    return (
                      <tr key={st.id} className="border-t align-middle">
                        <td className="p-2 sticky left-0 bg-white">{idx+1}</td>
                        <td className="p-2 sticky left-8 bg-white">
                          <div className="font-semibold text-ink">{st.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{st.student_code}{st.roll_no ? ` · Roll ${st.roll_no}` : ""}</div>
                        </td>
                        {(data.subjects as any[]).map(sub => {
                          const m = rows[st.id]?.[sub.id] ?? { theory: 0, practical: 0, internal: 0 };
                          const max = Number(sub.maximum_marks);
                          return (
                            <td key={sub.id} className="p-1 border-l">
                              <div className="flex gap-1 justify-center">
                                <input type="number" min={0} max={max} className={input} value={m.theory ?? 0} onChange={e => setMark(st.id, sub.id, "theory", Number(e.target.value), max)}/>
                                <input type="number" min={0} max={max} className={input} value={m.practical ?? 0} onChange={e => setMark(st.id, sub.id, "practical", Number(e.target.value), max)}/>
                                <input type="number" min={0} max={max} className={input} value={m.internal ?? 0} onChange={e => setMark(st.id, sub.id, "internal", Number(e.target.value), max)}/>
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-2 text-right font-mono border-l">{t.obtained}/{t.total}</td>
                        <td className="p-2 text-right font-mono">{t.pct}%</td>
                        <td className="p-2">
                          <input className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs" placeholder="—" value={studentRemarks[st.id] ?? ""} onChange={e => setStudentRemarks(prev => ({ ...prev, [st.id]: e.target.value }))}/>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
