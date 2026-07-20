import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { CalendarCheck, Loader2, ArrowRight, Users, UserCheck, UserX, Clock, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { attendanceAnalytics } from "@/lib/attendance.functions";

export const Route = createFileRoute("/_authenticated/dashboard/attendance")({
  head: () => ({ meta: [{ title: "Attendance · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: AttendanceOverview,
});

function AttendanceOverview() {
  const fetchStats = useServerFn(attendanceAnalytics);
  const [data, setData] = useState<Awaited<ReturnType<typeof attendanceAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats({ data: {} }).then(setData).finally(() => setLoading(false));
  }, [fetchStats]);

  const cards = useMemo(() => [
    { label: "Today's Records", value: data?.total ?? 0, icon: Users, tone: "from-brand to-cyan" },
    { label: "Present", value: data?.present ?? 0, icon: UserCheck, tone: "from-emerald-500 to-emerald-600" },
    { label: "Absent", value: data?.absent ?? 0, icon: UserX, tone: "from-red-500 to-red-600" },
    { label: "Late", value: data?.late ?? 0, icon: Clock, tone: "from-amber-500 to-amber-600" },
    { label: "Attendance %", value: `${data?.pct ?? 0}%`, icon: TrendingUp, tone: "from-blue-500 to-indigo-500" },
  ], [data]);

  return (
    <DashboardShell
      title="Attendance"
      subtitle="Track and manage daily attendance across branches, courses and batches."
      actions={
        <>
          <Link to="/dashboard/attendance/history" className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-sm font-semibold shadow-soft">History</Link>
          <Link to="/dashboard/attendance/mark" className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand">
            <CalendarCheck className="h-4 w-4" /> Mark Attendance <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      }
    >
      {loading ? (
        <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((c) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl bg-gradient-to-br ${c.tone} p-5 text-white shadow-soft`}>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{c.label}</div>
                  <c.icon className="h-4 w-4 opacity-80" />
                </div>
                <div className="mt-2 text-3xl font-extrabold">{c.value}</div>
              </motion.div>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-base font-bold text-ink">Monthly Trend</h2>
            {(data?.trend?.length ?? 0) === 0 ? (
              <div className="grid h-64 place-items-center text-sm text-muted-foreground">No attendance recorded this month yet.</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardShell>
  );
}