import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Printer, ArrowLeft, QrCode, Loader2 } from "lucide-react";
import { myResultDetail, EXAM_TYPE_LABEL } from "@/lib/results.functions";
import logoAsset from "@/assets/logo.jpg.asset.json";

export const Route = createFileRoute("/student-dashboard_/results/view/")({
  head: () => ({ meta: [{ title: "Marksheet · KCC" }, { name: "robots", content: "noindex" }] }),
  component: MarksheetPage,
});

function MarksheetPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(myResultDetail);
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fn({ data: { id } })
      .then(setD)
      .catch(e => setErr(e.message ?? "Unable to load"))
      .finally(() => setLoading(false));
  }, [fn, id]);

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin"/></div>;
  if (err || !d) return (
    <div className="mx-auto max-w-md p-10 text-center">
      <div className="rounded-2xl border bg-white p-6 text-sm text-rose-600">{err ?? "Unavailable"}</div>
      <Link to="/student-dashboard/results" className="mt-4 inline-flex items-center gap-1.5 text-brand font-semibold"><ArrowLeft className="h-4 w-4"/>Back</Link>
    </div>
  );

  const s = d.student, r = d.result, det = d.details;
  const issued = r.published_at ? new Date(r.published_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-4xl px-4 print:px-0">
        <div className="mb-4 flex items-center gap-2 print:hidden">
          <Link to="/student-dashboard/results" className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-brand"><ArrowLeft className="h-4 w-4"/>Back</Link>
          <button onClick={() => window.print()} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"><Printer className="h-4 w-4"/>Print / Save as PDF</button>
        </div>

        <div className="marksheet rounded-3xl border-2 border-brand/30 bg-white p-8 shadow-xl print:border-brand print:shadow-none">
          {/* Header */}
          <div className="flex items-center gap-4 border-b-2 border-brand/40 pb-4">
            <img src={logoAsset.src} alt="KCC" className="h-16 w-16 rounded-xl object-cover"/>
            <div className="flex-1 text-center">
              <div className="text-2xl font-black text-brand">KRISHNA COMPUTER CENTER</div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Institute of Computer Education & Vocational Training</div>
              <div className="mt-1 text-xs text-slate-600">Statement of Marks</div>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400"><QrCode className="h-8 w-8"/></div>
          </div>

          {/* Student info */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><div className="text-[10px] uppercase text-slate-500">Student Name</div><div className="font-bold text-ink">{s.full_name}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Student ID</div><div className="font-mono font-bold text-ink">{s.student_code}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Enrollment</div><div className="font-mono text-ink">{s.enrollment_no ?? "—"}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Roll No.</div><div className="font-mono text-ink">{s.roll_no ?? "—"}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Course</div><div className="font-bold text-ink">{s.course?.name ?? "—"}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Batch</div><div className="text-ink">{s.batch?.name ?? "—"}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Branch</div><div className="text-ink">{s.branch?.name ?? "—"}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Exam</div><div className="font-bold text-ink">{r.exam?.exam_name}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Exam Type</div><div className="text-ink">{EXAM_TYPE_LABEL[r.exam?.exam_type as keyof typeof EXAM_TYPE_LABEL] ?? "—"}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500">Exam Date</div><div className="text-ink">{r.exam?.exam_date ?? "—"}</div></div>
            </div>
            <div className="justify-self-end">
              {s.photo_url ? (
                <img src={s.photo_url} alt="" className="h-32 w-24 rounded-lg border-2 border-slate-200 object-cover"/>
              ) : (
                <div className="grid h-32 w-24 place-items-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-400">Photo</div>
              )}
            </div>
          </div>

          {/* Marks table */}
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-brand/10 text-ink">
                <th className="border border-brand/30 p-2 text-left">Code</th>
                <th className="border border-brand/30 p-2 text-left">Subject</th>
                <th className="border border-brand/30 p-2 text-right">Max</th>
                <th className="border border-brand/30 p-2 text-right">Theory</th>
                <th className="border border-brand/30 p-2 text-right">Practical</th>
                <th className="border border-brand/30 p-2 text-right">Internal</th>
                <th className="border border-brand/30 p-2 text-right">Total</th>
                <th className="border border-brand/30 p-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {det.map((row: any) => (
                <tr key={row.id}>
                  <td className="border border-brand/20 p-2 font-mono">{row.subject?.subject_code}</td>
                  <td className="border border-brand/20 p-2">{row.subject?.subject_name}</td>
                  <td className="border border-brand/20 p-2 text-right font-mono">{row.subject?.maximum_marks}</td>
                  <td className="border border-brand/20 p-2 text-right font-mono">{row.theory_marks}</td>
                  <td className="border border-brand/20 p-2 text-right font-mono">{row.practical_marks}</td>
                  <td className="border border-brand/20 p-2 text-right font-mono">{row.internal_marks}</td>
                  <td className="border border-brand/20 p-2 text-right font-mono font-bold">{row.total_marks}</td>
                  <td className="border border-brand/20 p-2 text-center font-bold">{row.grade ?? "—"}</td>
                </tr>
              ))}
              <tr className="bg-brand/5 font-bold">
                <td colSpan={2} className="border border-brand/30 p-2 text-right">GRAND TOTAL</td>
                <td className="border border-brand/30 p-2 text-right font-mono">{r.total_marks}</td>
                <td colSpan={3} className="border border-brand/30 p-2"></td>
                <td className="border border-brand/30 p-2 text-right font-mono">{r.obtained_marks}</td>
                <td className="border border-brand/30 p-2 text-center">{r.grade}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-4 gap-3 text-center">
            {[
              { label: "Percentage", value: `${r.percentage}%` },
              { label: "Grade", value: r.grade ?? "—" },
              { label: "Division", value: r.division ?? "—" },
              { label: "Result", value: r.pass_fail ?? "—", accent: r.pass_fail === "Pass" ? "text-emerald-600" : "text-rose-600" },
            ].map(x => (
              <div key={x.label} className="rounded-xl border-2 border-brand/20 p-3">
                <div className="text-[10px] uppercase text-slate-500">{x.label}</div>
                <div className={`text-lg font-black ${x.accent ?? "text-ink"}`}>{x.value}</div>
              </div>
            ))}
          </div>

          {r.remarks && <div className="mt-3 rounded-lg border bg-slate-50 p-2 text-xs"><b>Remarks:</b> {r.remarks}</div>}

          {/* Footer */}
          <div className="mt-8 flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase text-slate-500">Date of Issue</div>
              <div className="text-sm font-semibold text-ink">{issued}</div>
            </div>
            <div className="text-right">
              <div className="h-12 w-40 border-b border-slate-300"></div>
              <div className="mt-1 text-[10px] uppercase text-slate-500">Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media print { @page { size: A4; margin: 12mm } .marksheet { box-shadow: none } body { background: white } }`}</style>
    </div>
  );
}
