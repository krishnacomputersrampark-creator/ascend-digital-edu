import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { motion } from "motion/react";
import {
  LayoutDashboard, CalendarCheck, GraduationCap, Download, FileBadge, Wallet,
  ClipboardList, User as UserIcon, Bell, MonitorPlay, LogOut, Loader2, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/student-dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard · Krishna Computer Center" },
      { name: "description", content: "Your personalized student dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDashboardPage,
});

type Profile = { full_name: string | null; email: string | null; photo_url: string | null; student_id: string | null };

const SIDEBAR = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/student-dashboard" },
  { icon: UserIcon, label: "My Profile", to: "/student/profile" },
  { icon: CalendarCheck, label: "Attendance", to: "/student/attendance" },
  { icon: GraduationCap, label: "Results", to: "/student/results" },
  { icon: Download, label: "Downloads", to: "/downloads" },
  { icon: FileBadge, label: "Certificates", to: "/student/certificates" },
  { icon: Wallet, label: "Fees", to: "/student/fees" },
  { icon: ClipboardList, label: "Assignments", to: "/student/assignments" },
  { icon: Bell, label: "Notifications", to: "/student/notifications" },
] as const;

const CARDS = [
  { icon: CalendarCheck, title: "Attendance", desc: "Monthly presence & percentage.", to: "/student/attendance", stat: "92%", accent: "from-brand to-cyan" },
  { icon: GraduationCap, title: "Results", desc: "Marksheets & internal tests.", to: "/student/results", stat: "A+" },
  { icon: Download, title: "Downloads", desc: "Notes, timetables, admit cards.", to: "/downloads", stat: "24" },
  { icon: FileBadge, title: "Certificates", desc: "Course completion certificates.", to: "/student/certificates", stat: "3" },
  { icon: Wallet, title: "Fee Status", desc: "Dues, receipts & installments.", to: "/student/fees", stat: "Paid" },
  { icon: ClipboardList, title: "Assignments", desc: "Submissions & pending tasks.", to: "/student/assignments", stat: "2" },
  { icon: UserIcon, title: "Profile", desc: "Personal & academic details.", to: "/student/profile", stat: "—" },
  { icon: Bell, title: "Notifications", desc: "Latest notices & alerts.", to: "/student/notifications", stat: "5" },
  { icon: MonitorPlay, title: "Online Test", desc: "Take upcoming exams online.", to: "/student/online-test", stat: "1" },
];

function StudentDashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      if (!s) navigate({ to: "/login", search: { redirect: "/student-dashboard" } });
      else setSession(s);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/login", search: { redirect: "/student-dashboard" } });
        return;
      }
      setSession(data.session);
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, email, photo_url, student_id")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (!mounted) return;
      setProfile(p ?? null);
      setLoading(false);
    });
    return () => { mounted = false; sub.data.subscription.unsubscribe(); };
  }, [navigate]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-cyan-soft/30">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const name = profile?.full_name ?? session.user.email?.split("@")[0] ?? "Student";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-soft/40 via-white to-white">
      <div className="mx-auto flex max-w-[1500px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-white/70 backdrop-blur lg:block">
          <div className="flex h-16 items-center gap-2 border-b px-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white font-black">K</span>
            <div>
              <div className="text-sm font-extrabold text-ink leading-tight">Krishna CC</div>
              <div className="text-[10px] font-semibold uppercase text-brand">Student Portal</div>
            </div>
          </div>
          <nav className="p-3">
            {SIDEBAR.map((s) => (
              <Link
                key={s.label}
                to={s.to}
                activeOptions={{ exact: true }}
                className="group mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/80 transition hover:bg-cyan-soft/70 hover:text-brand-dark [&.active]:gradient-brand [&.active]:text-white [&.active]:shadow-brand"
              >
                <s.icon className="h-4 w-4" /> {s.label}
              </Link>
            ))}
            <button
              onClick={onLogout}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Link to="/" className="text-sm font-semibold text-brand hover:underline">← Back to site</Link>
              </div>
              <div className="flex items-center gap-3">
                <button className="grid h-9 w-9 place-items-center rounded-full border bg-white text-ink/70 hover:text-brand" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="hidden text-right sm:block">
                  <div className="text-xs font-bold text-ink leading-tight">{name}</div>
                  <div className="text-[10px] text-muted-foreground">{profile?.student_id ?? "Demo ID"}</div>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full gradient-brand text-xs font-extrabold text-white shadow-brand">
                  {initials || "S"}
                </span>
              </div>
            </div>
          </header>

          {/* Welcome */}
          <section className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl gradient-brand-dark p-6 text-white shadow-brand sm:p-8">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan/30 blur-3xl" />
              <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/15 text-2xl font-black backdrop-blur ring-2 ring-white/25">
                    {initials || "S"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-soft">Welcome Student</p>
                    <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{name}</h1>
                    <p className="mt-1 text-sm text-white/80">{profile?.email ?? session.user.email}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Course", "ADCA"],
                    ["Student ID", profile?.student_id ?? "Demo"],
                    ["Branch", "Karawal Nagar"],
                    ["Batch", "Morning 2024"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-white/10 p-3 backdrop-blur">
                      <dt className="text-[10px] font-semibold uppercase text-cyan-soft">{k}</dt>
                      <dd className="mt-0.5 text-sm font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="relative mt-4 text-[11px] uppercase tracking-wider text-white/60">Demo data · will sync from Student Management</p>
            </div>
          </section>

          {/* Quick actions */}
          <section className="px-4 pb-16 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-lg font-bold text-ink">Quick Actions</h2>
              <span className="text-xs text-muted-foreground">Tap any card to open the module</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CARDS.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={c.to}
                    className="group relative block h-full overflow-hidden rounded-3xl border bg-white/80 p-6 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-brand"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-white shadow-brand">
                        <c.icon className="h-6 w-6" />
                      </span>
                      <span className="text-2xl font-black gradient-text">{c.stat}</span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-ink">{c.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                      Open <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                    </span>
                    <span className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-cyan/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}