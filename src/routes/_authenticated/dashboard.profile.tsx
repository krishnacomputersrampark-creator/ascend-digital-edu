import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { ModuleGrid } from "@/components/erp/ModulePage";
import { KeyRound, ScrollText, Settings as SettingsIcon } from "lucide-react";
import { useAuth, ROLE_LABEL, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({ meta: [{ title: "My Profile · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, role, status } = useAuth();
  const effectiveRole: AppRole = role ?? "guest";
  const name = profile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <DashboardShell title="My Profile" subtitle="Your account details and security settings">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl gradient-brand text-xl font-extrabold text-white">
            {name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="text-lg font-extrabold text-ink">{name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <div className="mt-1 flex gap-2">
              <span className="inline-flex rounded-full bg-cyan-soft px-2 py-0.5 text-[11px] font-bold text-brand">{ROLE_LABEL[effectiveRole]}</span>
              {status && <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{status}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ModuleGrid sections={[
          { title: "Change password", body: "Update your password and clear the default-password warning.", icon: KeyRound, to: "/dashboard/settings/security" },
          { title: "Activity log", body: "Review your recent logins and actions across the ERP.", icon: ScrollText, to: "/admin/audit-logs" },
          { title: "Preferences", body: "Institute profile, branding and system settings.", icon: SettingsIcon, to: "/dashboard/settings" },
        ]} />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Need to change your name or photo? <Link to="/dashboard/settings" className="font-semibold text-brand">Open settings</Link>.
      </p>
    </DashboardShell>
  );
}