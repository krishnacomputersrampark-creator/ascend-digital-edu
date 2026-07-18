import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import {
  Users, GraduationCap, ClipboardList, Wallet, FileBadge, CalendarCheck,
  TrendingUp, BookOpen, Building2, Sparkles, ArrowRight, Bell,
} from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { useAuth, ROLE_LABEL, type AppRole } from "@/lib/auth";
import { dashboardStats } from "@/lib/admissions.functions";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Krishna Computer Center ERP" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardHome,
});

const STAT_BY_ROLE: Record<AppRole, { label: string; value: string; sub: string; icon: React.ComponentType<{ className?: string }>; accent: string }[]> = {
  super_admin: [
    { label: "Total Students", value: "1,248", sub: "+42 this month", icon: Users, accent: "from-blue-500 to-cyan-500" },
    { label: "Active Faculty", value: "36", sub: "2 branches", icon: GraduationCap, accent: "from-emerald-500 to-teal-500" },
    { label: "Pending Admissions", value: "17", sub: "requires review", icon: ClipboardList, accent: "from-amber-500 to-orange-500" },
    { label: "Revenue (Month)", value: "₹4.82L", sub: "+12% MoM", icon: TrendingUp, accent: "from-fuchsia-500 to-pink-500" },
    { label: "Fees Outstanding", value: "₹1.14L", sub: "78 students", icon: Wallet, accent: "from-rose-500 to-red-500" },
    { label: "Certificates Issued", value: "412", sub: "this quarter", icon: FileBadge, accent: "from-indigo-500 to-violet-500" },
    { label: "Attendance Today", value: "92%", sub: "across branches", icon: CalendarCheck, accent: "from-sky-500 to-blue-500" },
    { label: "Active Courses", value: "24", sub: "12 categories", icon: BookOpen, accent: "from-cyan-500 to-teal-500" },
  ],
  admin: [
    { label: "Total Students", value: "1,248", sub: "all branches", icon: Users, accent: "from-blue-500 to-cyan-500" },
    { label: "Pending Admissions", value: "17", sub: "requires review", icon: ClipboardList, accent: "from-amber-500 to-orange-500" },
    { label: "Fees Outstanding", value: "₹1.14L", sub: "78 students", icon: Wallet, accent: "from-rose-500 to-red-500" },
    { label: "Certificates Issued", value: "412", sub: "this quarter", icon: FileBadge, accent: "from-indigo-500 to-violet-500" },
  ],
  branch_manager: [
    { label: "Branch Students", value: "612", sub: "Karawal Nagar", icon: Users, accent: "from-blue-500 to-cyan-500" },
    { label: "Attendance Today", value: "94%", sub: "your branch", icon: CalendarCheck, accent: "from-sky-500 to-blue-500" },
    { label: "Fees Outstanding", value: "₹52K", sub: "34 students", icon: Wallet, accent: "from-rose-500 to-red-500" },
    { label: "Faculty", value: "18", sub: "on duty", icon: GraduationCap, accent: "from-emerald-500 to-teal-500" },
  ],
  faculty: [
    { label: "My Students", value: "84", sub: "3 batches", icon: Users, accent: "from-blue-500 to-cyan-500" },
    { label: "Classes Today", value: "5", sub: "next at 11:00 AM", icon: CalendarCheck, accent: "from-sky-500 to-blue-500" },
    { label: "Assignments Due", value: "12", sub: "to review", icon: ClipboardList, accent: "from-amber-500 to-orange-500" },
    { label: "Avg. Performance", value: "78%", sub: "class average", icon: TrendingUp, accent: "from-emerald-500 to-teal-500" },
  ],
  student: [
    { label: "Attendance", value: "94%", sub: "this semester", icon: CalendarCheck, accent: "from-sky-500 to-blue-500" },
    { label: "Current CGPA", value: "8.6", sub: "top 15%", icon: TrendingUp, accent: "from-emerald-500 to-teal-500" },
    { label: "Pending Fees", value: "₹0", sub: "you are clear", icon: Wallet, accent: "from-fuchsia-500 to-pink-500" },
    { label: "Certificates", value: "3", sub: "download ready", icon: FileBadge, accent: "from-indigo-500 to-violet-500" },
  ],
  guest: [
    { label: "Account Status", value: "Guest", sub: "awaiting activation", icon: Users, accent: "from-slate-500 to-slate-600" },
  ],
};

function DashboardHome() {
  const { role, profile, user } = useAuth();
  const effectiveRole: AppRole = role ?? "guest";
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "there";
  const stats = STAT_BY_ROLE[effectiveRole];
  const fetchStats = useServerFn(dashboardStats);
  const [live, setLive] = useState<Awaited<ReturnType<typeof dashboardStats>> | null>(null);

  useEffect(() => {
    if (effectiveRole === "guest") return;
    fetchStats().then(setLive).catch(() => {});
  }, [fetchStats, effectiveRole]);

  return (
    <DashboardShell
      title={<>Welcome back, <span className="bg-gradient-to-r from-brand to-cyan bg-clip-text text-transparent">{displayName}</span></>}
      subtitle={`Signed in as ${ROLE_LABEL[effectiveRole]} · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft hover:-translate-y-0.5 transition">
            <Bell className="h-4 w-4" /> Notifications
          </button>
          {(effectiveRole === "super_admin" || effectiveRole === "admin") && (
            <Link to="/dashboard/admissions" className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand hover:-translate-y-0.5 transition">
              New Admission <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </>
      }
    >
      {effectiveRole === "guest" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <div className="font-bold text-amber-900">Your account is pending activation</div>
            <p className="mt-1 text-sm text-amber-800">A Krishna Computer Center administrator will assign you a role (Student, Faculty, Branch Manager, etc.) shortly. Once approved, you&apos;ll see your personalized dashboard here.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-brand"
          >
            <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${s.accent} text-white shadow-md`}>
              <s.icon className="h-5 w-5" />
            </span>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-0.5 text-2xl font-extrabold text-ink">{
              live && s.label === "Total Students" ? live.totalStudents :
              live && s.label === "Pending Admissions" ? live.pendingAdmissions :
              live && s.label === "Active Courses" ? live.activeCourses :
              s.value
            }</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
            <span className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-cyan/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>

      {live && effectiveRole !== "guest" && effectiveRole !== "student" && (
        <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-ink">Admissions Trend</h2>
              <p className="text-xs text-muted-foreground">Last 6 months · applications vs approved</p>
            </div>
            <Link to="/dashboard/admissions" className="text-xs font-semibold text-brand hover:underline">View all →</Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={live.series} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-adm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5b7" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#0ea5b7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-app" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="admissions" stroke="#0ea5b7" fill="url(#grad-adm)" strokeWidth={2} />
                <Area type="monotone" dataKey="approved" stroke="#22c55e" fill="url(#grad-app)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink">Recent Activity</h2>
            <Link to="/dashboard/reports" className="text-xs font-semibold text-brand hover:underline">View reports →</Link>
          </div>
          <ul className="divide-y divide-border">
            {[
              { title: "New admission received", desc: "Priya Sharma applied for ADCA · Karawal Nagar", time: "12 min ago" },
              { title: "Fee payment recorded", desc: "₹8,500 · Ankit Verma · CCC batch", time: "38 min ago" },
              { title: "Certificate issued", desc: "Diploma in Computer Applications · Roll 2024/0231", time: "1 hr ago" },
              { title: "Attendance closed", desc: "Batch B-14 · Loni · 24 of 26 present", time: "2 hr ago" },
              { title: "Result published", desc: "PGDCA · Semester 2 · 41 students", time: "Yesterday" },
            ].map((a) => (
              <li key={a.title} className="flex items-start gap-3 py-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{a.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.desc}</div>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
          <h2 className="text-lg font-extrabold text-ink">Branches</h2>
          <p className="text-xs text-muted-foreground">Multi-branch snapshot</p>
          <div className="mt-4 space-y-3">
            {[
              { name: "Karawal Nagar", code: "KCC-KN", students: 612 },
              { name: "Rampark Ext. · Loni", code: "KCC-LN", students: 636 },
            ].map((b) => (
              <div key={b.code} className="flex items-center justify-between rounded-xl border border-border bg-cyan-soft/40 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-ink">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground">{b.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-brand-dark">{b.students}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Students</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-extrabold text-ink">ERP Modules · Under Active Development</div>
            <p className="text-xs text-muted-foreground">Foundation is live. Students, Fees, Attendance, Results, Certificates, Admissions and more are being wired module-by-module. Use the sidebar to navigate.</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}