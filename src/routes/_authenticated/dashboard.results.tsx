import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, PlusCircle, PencilLine, CheckCircle2, History, Loader2, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listExams, resultAnalytics, EXAM_TYPE_LABEL } from "@/lib/results.functions";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard/results")({
  head: () => ({ meta: [{ title: "Results · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: ResultsHome,
});

function ResultsHome() {
  const fetchExams = useServerFn(listExams);
  const fetchStats = useServerFn(resultAnalytics);
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchExams(), fetchStats()])
      .then(([e, s]) => { setExams(e); setStats(s); })
      .finally(() => setLoading(false));
  }, [fetchExams, fetchStats]);

  const cards = stats ? [
    { label: "Total Results", value: stats.total, sub: "all exams", accent: "from-blue-500 to-cyan-500" },
    { label: "Published", value: stats.published, sub: "visible to students", accent: "from-emerald-500 to-teal-500" },
    { label: "Pending", value: stats.pending, sub: "draft/withheld", accent: "from-amber-500 to-orange-500" },
    { label: "Pass %", value: stats.passPct + "%", sub: `${stats.passed} students`, accent: "from-fuchsia-500 to-pink-500" },
    { label: "Fail %", value: stats.failPct + "%", sub: `${stats.failed} students`, accent: "from-rose-500 to-red-500" },
  ] : [];

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Result Management</div>
          <h1 className="text-2xl font-black text-ink">Results overview</h1>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link to="/dashboard/results/create" className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow hover:brightness-110 flex items-center gap-1.5"><PlusCircle className="h-4 w-4"/>New Exam</Link>
          <Link to="/dashboard/results/marks-entry" className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 flex items-center gap-1.5"><PencilLine className="h-4 w-4"/>Marks Entry</Link>
          <Link to="/dashboard/results/publish" className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4"/>Publish</Link>
          <Link to="/dashboard/results/history" className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 flex items-center gap-1.5"><History className="h-4 w-4"/>History</Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {cards.map(c => (
              <div key={c.label} className={`rounded-2xl border bg-gradient-to-br ${c.accent} p-4 text-white shadow-sm`}>
                <div className="text-xs font-semibold opacity-90">{c.label}</div>
                <div className="mt-1 text-2xl font-black">{c.value}</div>
                <div className="text-xs opacity-90">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><BarChart3 className="h-4 w-4 text-brand"/>Grade distribution</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.gradeDist ?? []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                    <XAxis dataKey="grade"/><YAxis allowDecimals={false}/><Tooltip/>
                    <Bar dataKey="count" fill="#06b6d4" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><TrendingUp className="h-4 w-4 text-brand"/>Average % by exam</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                    <XAxis dataKey="name" tick={{fontSize:10}}/><YAxis domain={[0,100]}/><Tooltip/>
                    <Line type="monotone" dataKey="avg" stroke="#0284c7" strokeWidth={2} dot={{r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border bg-white/70 backdrop-blur">
            <div className="border-b p-3 text-sm font-bold text-ink">Recent exams</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr><th className="p-3">Exam</th><th className="p-3">Type</th><th className="p-3">Course</th><th className="p-3">Batch</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
                </thead>
                <tbody>
                  {exams.slice(0,20).map(e => (
                    <tr key={e.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-semibold text-ink">{e.exam_name}</td>
                      <td className="p-3">{EXAM_TYPE_LABEL[e.exam_type as keyof typeof EXAM_TYPE_LABEL] ?? e.exam_type}</td>
                      <td className="p-3">{e.course?.name ?? "—"}</td>
                      <td className="p-3">{e.batch?.name ?? "—"}</td>
                      <td className="p-3">{e.exam_date ?? "—"}</td>
                      <td className="p-3 capitalize">{e.status}</td>
                      <td className="p-3">
                        <Link to="/dashboard/results/marks-entry" search={{ exam_id: e.id }} className="text-brand text-xs font-semibold hover:underline">Enter marks →</Link>
                      </td>
                    </tr>
                  ))}
                  {!exams.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No exams yet. <Link to="/dashboard/results/create" className="text-brand font-semibold">Create one</Link></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
