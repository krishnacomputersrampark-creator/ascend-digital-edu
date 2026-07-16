import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  LogIn, LayoutDashboard, CalendarCheck, GraduationCap, Wallet, FileBadge,
  Download, MonitorPlay, BadgeCheck, BookOpenCheck, Search, ShieldCheck,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/student-zone")({
  head: () => ({
    meta: [
      { title: "Student Zone — Krishna Computer Center" },
      { name: "description", content: "Secure student portal with dashboard, attendance, results, fees, downloads, online tests and certificate verification." },
      { property: "og:title", content: "Student Zone — Krishna Computer Center" },
      { property: "og:description", content: "Everything students need in one secure place." },
    ],
  }),
  component: StudentZonePage,
});

const CARDS = [
  { icon: LogIn, title: "Student Login", desc: "Sign in with your Student ID, email or mobile.", to: "/student/login", accent: "from-brand to-cyan" },
  { icon: LayoutDashboard, title: "Dashboard", desc: "Your personalized academic overview.", to: "/student/dashboard" },
  { icon: CalendarCheck, title: "Attendance", desc: "Monthly presence, leave & percentage.", to: "/student/attendance" },
  { icon: GraduationCap, title: "Results", desc: "Semester, internal & final marksheets.", to: "/student/results" },
  { icon: MonitorPlay, title: "Online Test", desc: "Take upcoming exams from anywhere.", to: "/student/online-test" },
  { icon: Wallet, title: "Fees", desc: "Track dues, download receipts.", to: "/student/fees" },
  { icon: FileBadge, title: "Certificates", desc: "Download course & completion certificates.", to: "/student/certificates" },
  { icon: Download, title: "Downloads", desc: "Notes, timetables, admit cards & more.", to: "/downloads" },
  { icon: BadgeCheck, title: "Verify Certificate", desc: "Confirm authenticity in one click.", to: "/verify-certificate" },
  { icon: Search, title: "Search Student", desc: "Find enrollment, batch and status.", to: "/search/student" },
  { icon: BookOpenCheck, title: "Search Result", desc: "Look up marks by roll or student ID.", to: "/search/result" },
  { icon: ShieldCheck, title: "Search Certificate", desc: "Locate any issued certificate.", to: "/search/certificate" },
];

function StudentZonePage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Secure Student Portal"
        title={<>Student <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Zone</span></>}
        subtitle="Everything students need in one secure place — attendance, results, tests, fees, certificates and downloads."
        actions={
          <>
            <Link to="/student/login" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow-brand hover:-translate-y-0.5 transition">
              <LogIn className="h-4 w-4" /> Student Login
            </Link>
            <Link to="/verify-certificate" className="inline-flex items-center gap-2 rounded-full border-2 border-white/60 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
              Verify Certificate
            </Link>
          </>
        }
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CARDS.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: (i % 4) * 0.05 }}
              >
                <Link
                  to={c.to}
                  className="group relative block h-full overflow-hidden rounded-3xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand text-white shadow-brand transition group-hover:scale-105">
                    <c.icon className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-ink">{c.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{c.desc}</p>
                  <span className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-cyan/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}