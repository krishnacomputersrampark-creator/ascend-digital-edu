import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard, CalendarCheck, GraduationCap, Download, FileBadge, Wallet,
  ClipboardList, User as UserIcon, Bell, LogOut, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SIDEBAR = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/student-dashboard" },
  { icon: UserIcon, label: "My Profile", to: "/student-dashboard/profile" },
  { icon: ShieldCheck, label: "Security", to: "/student-dashboard/security" },
  { icon: CalendarCheck, label: "Attendance", to: "/student/attendance" },
  { icon: GraduationCap, label: "Results", to: "/student/results" },
  { icon: Download, label: "Downloads", to: "/downloads" },
  { icon: FileBadge, label: "Certificates", to: "/student/certificates" },
  { icon: Wallet, label: "Fees", to: "/student/fees" },
  { icon: ClipboardList, label: "Assignments", to: "/student/assignments" },
  { icon: Bell, label: "Notifications", to: "/student/notifications" },
] as const;

export function PortalShell({
  name, initials, subline, children,
}: { name: string; initials: string; subline?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const onLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-soft/40 via-white to-white">
      <div className="mx-auto flex max-w-[1500px]">
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
            <button onClick={onLogout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link to="/student-dashboard" className="text-sm font-semibold text-brand hover:underline">← Dashboard</Link>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-xs font-bold text-ink leading-tight">{name}</div>
                  {subline && <div className="text-[10px] text-muted-foreground">{subline}</div>}
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full gradient-brand text-xs font-extrabold text-white shadow-brand">
                  {initials || "S"}
                </span>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}