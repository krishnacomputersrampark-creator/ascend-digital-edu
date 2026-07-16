import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck, GraduationCap, Download, ClipboardList, Wallet, FileBadge,
  MonitorPlay, Bell, Clock, BookOpenCheck, TrendingUp,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Krishna Computer Center" },
      { name: "description", content: "Your personalized academic dashboard with profile, attendance, results and quick actions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const QUICK = [
  { icon: CalendarCheck, label: "Attendance", to: "/student/attendance" },
  { icon: GraduationCap, label: "Results", to: "/student/results" },
  { icon: Download, label: "Downloads", to: "/downloads" },
  { icon: ClipboardList, label: "Assignments", to: "/student/dashboard" },
  { icon: Wallet, label: "Fees", to: "/student/fees" },
  { icon: FileBadge, label: "Certificates", to: "/student/certificates" },
  { icon: MonitorPlay, label: "Online Test", to: "/student/online-test" },
  { icon: Bell, label: "Notifications", to: "/notice" },
];

function DashboardPage() {
  const progress = 68;
  return (
    <SiteLayout>
      <section className="bg-cyan-soft/40 pt-24 pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">Student Dashboard</p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Welcome back, Priya!</h1>
        </div>
      </section>
      <section className="py-8">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {/* Profile Card */}
          <div className="relative overflow-hidden rounded-3xl border bg-white p-6 shadow-soft lg:col-span-1">
            <div className="absolute inset-x-0 top-0 h-24 gradient-brand-dark" />
            <div className="relative flex flex-col items-center text-center">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-3xl font-extrabold gradient-text shadow-brand ring-4 ring-white">
                PS
              </div>
              <h2 className="mt-4 text-lg font-bold text-ink">Priya Sharma</h2>
              <p className="text-xs text-muted-foreground">KCC2024/00123</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
              </span>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Course", "ADCA"],
                ["Branch", "Karawal Nagar"],
                ["Batch", "Morning · 2024"],
                ["Admission", "05 Jan 2024"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-cyan-soft/70 p-3">
                  <dt className="text-[10px] font-semibold uppercase text-brand-dark">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-semibold text-ink/80">
                <span>Course Progress</span><span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-cyan-soft">
                <div className="h-full gradient-brand" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK.map((q) => (
                <Link key={q.label} to={q.to} className="group rounded-2xl border bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-soft text-brand transition group-hover:gradient-brand group-hover:text-white">
                    <q.icon className="h-5 w-5" />
                  </span>
                  <div className="mt-3 text-sm font-bold text-ink">{q.label}</div>
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Panel icon={Bell} title="Latest Notices" items={["Exam schedule released for Semester 2","Diwali holiday: 31 Oct – 3 Nov","Fee installment due 5th of month"]} />
              <Panel icon={BookOpenCheck} title="Upcoming Exams" items={["Python Practical — 22 Mar","Tally Theory — 28 Mar","Java OOP MCQ — 05 Apr"]} />
              <Panel icon={Download} title="Recent Downloads" items={["Time Table – March.pdf","ADCA Syllabus.pdf","Assignment 04.docx"]} />
              <Panel icon={Clock} title="Upcoming Classes" items={["Today · 10:00 AM — Python","Tomorrow · 11:30 AM — Tally","Fri · 09:00 AM — Java"]} />
            </div>
            <div className="mt-6 rounded-2xl border bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white"><TrendingUp className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-base font-bold text-ink">This Month at a Glance</h3>
                  <p className="text-xs text-muted-foreground">Attendance, assignments and internal tests.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Present","22"],["Absent","2"],["Leave","1"],["Attendance","92%"]].map(([k,v]) => (
                  <div key={k} className="rounded-xl bg-cyan-soft/70 p-3 text-center">
                    <div className="text-xl font-extrabold text-ink">{v}</div>
                    <div className="text-[11px] font-semibold text-brand-dark">{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Panel({ icon: Icon, title, items }: { icon: React.ComponentType<{ className?: string }>; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-soft text-brand"><Icon className="h-4 w-4" /></span>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-ink/80">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}