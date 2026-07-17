import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, GraduationCap, Building2, ClipboardList, BookOpen,
  CalendarCheck, Wallet, FileBadge, ShieldCheck, Download, Image as ImageIcon,
  CalendarDays, Megaphone, Globe, Quote, Handshake, BarChart3, Settings, LogOut,
  Menu, X, ChevronDown, Search, Bell, UserRound,
} from "lucide-react";
import logoAsset from "@/assets/logo.jpg.asset.json";
import { useAuth, signOutAndRedirect, ROLE_LABEL, type AppRole } from "@/lib/auth";

type NavItem = { label: string; to: string; icon: React.ComponentType<{ className?: string }>; roles?: AppRole[] };
type NavGroup = { title: string; items: NavItem[] };

const ALL_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Academics",
    items: [
      { label: "Students", to: "/dashboard/students", icon: Users, roles: ["super_admin", "admin", "branch_manager", "faculty"] },
      { label: "Faculty", to: "/dashboard/faculty", icon: GraduationCap, roles: ["super_admin", "admin", "branch_manager"] },
      { label: "Courses", to: "/dashboard/courses", icon: BookOpen, roles: ["super_admin", "admin", "branch_manager", "faculty"] },
      { label: "Batches", to: "/dashboard/batches", icon: ClipboardList, roles: ["super_admin", "admin", "branch_manager", "faculty"] },
      { label: "Admissions", to: "/dashboard/admissions", icon: ClipboardList, roles: ["super_admin", "admin", "branch_manager"] },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Attendance", to: "/dashboard/attendance", icon: CalendarCheck },
      { label: "Fees", to: "/dashboard/fees", icon: Wallet },
      { label: "Results", to: "/dashboard/results", icon: BarChart3 },
      { label: "Certificates", to: "/dashboard/certificates", icon: FileBadge },
      { label: "Branches", to: "/dashboard/branches", icon: Building2, roles: ["super_admin", "admin"] },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Notices", to: "/dashboard/notices", icon: Megaphone, roles: ["super_admin", "admin", "branch_manager"] },
      { label: "Events", to: "/dashboard/events", icon: CalendarDays, roles: ["super_admin", "admin", "branch_manager"] },
      { label: "Gallery", to: "/dashboard/gallery", icon: ImageIcon, roles: ["super_admin", "admin", "branch_manager"] },
      { label: "Downloads", to: "/dashboard/downloads", icon: Download },
      { label: "Testimonials", to: "/dashboard/testimonials", icon: Quote, roles: ["super_admin", "admin"] },
      { label: "Website CMS", to: "/dashboard/cms", icon: Globe, roles: ["super_admin", "admin"] },
      { label: "Franchise", to: "/dashboard/franchise", icon: Handshake, roles: ["super_admin", "admin"] },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Reports", to: "/dashboard/reports", icon: BarChart3, roles: ["super_admin", "admin", "branch_manager"] },
      { label: "Roles & Users", to: "/dashboard/roles", icon: ShieldCheck, roles: ["super_admin"] },
      { label: "Settings", to: "/dashboard/settings", icon: Settings, roles: ["super_admin", "admin"] },
    ],
  },
];

function filterForRole(role: AppRole): NavGroup[] {
  return ALL_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.roles || i.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
}

export function DashboardShell({ children, title, subtitle, actions }: { children: ReactNode; title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  const { role, profile, user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const effectiveRole: AppRole = role ?? "guest";
  const groups = filterForRole(effectiveRole);
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-foreground">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-white/95 px-4 py-2.5 backdrop-blur-lg lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="KCC" className="h-8 w-8 rounded-lg object-contain ring-1 ring-border" />
          <span className="text-sm font-extrabold text-brand-dark">KCC ERP</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-soft text-brand" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border/60 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <Link to="/dashboard" className="flex items-center gap-2.5">
                <img src={logoAsset.url} alt="KCC" className="h-10 w-10 rounded-xl object-contain ring-1 ring-border" />
                <div className="leading-tight">
                  <div className="text-[13px] font-extrabold text-brand-dark">KCC · ERP</div>
                  <div className="text-[10px] text-muted-foreground">{ROLE_LABEL[effectiveRole]}</div>
                </div>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-soft text-brand lg:hidden" aria-label="Close menu">
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {groups.map((g) => (
                <div key={g.title} className="mb-5">
                  <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{g.title}</div>
                  <ul className="space-y-0.5">
                    {g.items.map((item) => {
                      const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                      return (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "gradient-brand text-white shadow-brand" : "text-ink/80 hover:bg-cyan-soft hover:text-brand"}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-border/60 p-3">
              <button
                onClick={() => void signOutAndRedirect()}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/80 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen && <button aria-label="Close menu backdrop" className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar (desktop) */}
          <header className="hidden items-center justify-between gap-4 border-b border-border/60 bg-white/80 px-6 py-3 backdrop-blur-lg lg:flex">
            <div className="flex items-center gap-3">
              <div className="relative w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input placeholder="Search students, certificates, courses…" className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative grid h-10 w-10 place-items-center rounded-full bg-cyan-soft text-brand" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="relative">
                <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-border bg-white pl-1 pr-3 py-1 shadow-soft">
                  <span className="grid h-8 w-8 place-items-center rounded-full gradient-brand text-white text-xs font-bold">
                    {displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-ink">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white shadow-brand">
                    <div className="border-b border-border/60 px-4 py-3">
                      <div className="text-sm font-bold text-ink">{displayName}</div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                      <div className="mt-1 inline-flex rounded-full bg-cyan-soft px-2 py-0.5 text-[10px] font-bold text-brand">{ROLE_LABEL[effectiveRole]}</div>
                    </div>
                    <Link to="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-cyan-soft">
                      <UserRound className="h-4 w-4" /> My Profile
                    </Link>
                    <Link to="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-cyan-soft">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button onClick={() => void signOutAndRedirect()} className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {(title || subtitle || actions) && (
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  {title && <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>}
                  {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
              </div>
            )}
            {loading ? <DashboardSkeleton /> : children}
          </main>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-soft" />
      ))}
    </div>
  );
}