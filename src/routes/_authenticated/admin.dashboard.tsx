import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Users, GraduationCap, Building2, BookOpen, ClipboardList, CalendarCheck, Wallet, FileBadge,
  Download, TrendingUp, Bell, UserPlus, Loader2, ArrowRight, PlusCircle, ReceiptText, BarChart3, Send,
} from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import {
  fetchAdminStats, fetchTrends, fetchRecentActivity,
  type AdminStats, type Activity, type TrendPoint,
} from "@/lib/admin.repo";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard · KCC" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function money(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchTrends(30), fetchRecentActivity(15)])
      .then(([s, t, a]) => { setStats(s); setTrends(t); setActivity(a); })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "Total Students", value: stats.totalStudents.toLocaleString("en-IN"), icon: Users, accent: "from-blue-500 to-cyan-500" },
    { label: "Active Students", value: stats.activeStudents.toLocaleString("en-IN"), icon: TrendingUp, accent: "from-emerald-500 to-teal-500" },
    { label: "Faculty", value: stats.facultyMembers.toString(), icon: GraduationCap, accent: "from-fuchsia-500 to-pink-500" },
    { label: "Courses", value: stats.courses.toString(), icon: BookOpen, accent: "from-cyan-500 to-teal-500" },
    { label: "Branches", value: stats.branches.toString(), icon: Building2, accent: "from-indigo-500 to-violet-500" },
    { label: "Today's Admissions", value: stats.todayAdmissions.toString(), icon: ClipboardList, accent: "from-amber-500 to-orange-500" },
    { label: "Today's Attendance", value: `${stats.todayAttendancePct}%`, icon: CalendarCheck, accent: "from-sky-500 to-blue-500" },
    { label: "Today's Collection", value: money(stats.todayFeeCollection), icon: Wallet, accent: "from-emerald-500 to-lime-500" },
    { label: "Pending Fees", value: money(stats.pendingFees), icon: Wallet, accent: "from-rose-500 to-red-500" },
    { label: "Pending Admissions", value: stats.pendingAdmissions.toString(), icon: ClipboardList, accent: "from-amber-500 to-orange-500" },
    { label: "Certificates Issued", value: stats.certificatesIssued.toString(), icon: FileBadge, accent: "from-indigo-500 to-violet-500" },
    { label: "Downloads", value: stats.downloads.toString(), icon: Download, accent: "from-cyan-500 to-blue-500" },
  ] : [];

  const quickActions: Array<{ to: string; label: string; icon: any }> = [
    { to: "/admission", label: "New Admission", icon: UserPlus },
    { to: "/dashboard/students", label: "Add Student", icon: Users },
    { to: "/dashboard/fees/collect", label: "Collect Fee", icon: Wallet },
    { to: "/dashboard/attendance/mark", label: "Mark Attendance", icon: CalendarCheck },
    { to: "/dashboard/results/publish", label: "Publish Result", icon: BarChart3 },
    { to: "/dashboard/certificates/create", label: "Issue Certificate", icon: FileBadge },
    { to: "/admin/downloads/upload", label: "Upload Material", icon: Download },
    { to: "/admin/notifications", label: "Send Notification", icon: Send },
  ];

  return (
    <DashboardShell title="Admin Dashboard" subtitle="Institute-wide operations at a glance" actions={
      <Link to="/admin/analytics" className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-brand">
        <BarChart3 className="h-4 w-4" /> Deep Analytics
      </Link>
    }>
      {loading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-soft" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="rounded-2xl border border-border bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</div>
                    <div className="mt-1 text-2xl font-extrabold text-ink">{c.value}</div>
                  </div>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-md`}>
                    <c.icon className="h-5 w-5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
              <div className="mb-3 text-sm font-bold text-ink">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((a) => (
                  <Link key={a.to} to={a.to} className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold text-ink hover:border-brand hover:bg-cyan-soft hover:text-brand">
                    <a.icon className="h-4 w-4" />
                    <span className="truncate">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <ChartCard title="Fee Collection (last 30d)">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trends.feeTrend}>
                  <defs><linearGradient id="fc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="key" fontSize={11} tickFormatter={(v) => v.slice(5)} /><YAxis fontSize={11} />
                  <Tooltip formatter={(v: any) => money(Number(v))} />
                  <Area type="monotone" dataKey="value" stroke="#0891b2" fill="url(#fc)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Admissions Trend">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trends.admissionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="key" fontSize={11} tickFormatter={(v) => v.slice(5)} /><YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ChartCard title="Attendance % (last 30d)">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trends.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="key" fontSize={11} tickFormatter={(v) => v.slice(5)} /><YAxis fontSize={11} domain={[0, 100]} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Result Statistics">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={trends.resultStats} dataKey="value" nameKey="name" outerRadius={70} label>
                    {trends.resultStats.map((_: any, i: number) => <Cell key={i} fill={i === 0 ? "#10b981" : "#ef4444"} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Downloads (last 30d)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trends.downloadsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="key" fontSize={11} tickFormatter={(v) => v.slice(5)} /><YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-ink">Recent Activity</div>
              <Link to="/admin/audit-logs" className="inline-flex items-center gap-1 text-xs font-semibold text-brand">View audit logs <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {activity.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No recent activity yet.</div>
            ) : (
              <ul className="divide-y divide-border/60">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <span className="rounded-full bg-cyan-soft px-2 py-0.5 text-[10px] font-bold uppercase text-brand">{a.kind}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{a.title}</div>
                      {a.sub && <div className="truncate text-xs text-muted-foreground">{a.sub}</div>}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</div>
                    {a.link && <Link to={a.link} className="text-xs font-semibold text-brand">Open</Link>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="mb-2 text-sm font-bold text-ink">{title}</div>
      {children}
    </div>
  );
}