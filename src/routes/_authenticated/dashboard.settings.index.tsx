import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, ArrowRight, UserRound, SlidersHorizontal, ImageUp } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";

export const Route = createFileRoute("/_authenticated/dashboard/settings/")({
  head: () => ({
    meta: [
      { title: "Settings · Krishna Computer Center ERP" },
      { name: "description", content: "Manage your ERP account settings and security preferences." },
      { property: "og:title", content: "Settings · Krishna Computer Center ERP" },
      { property: "og:description", content: "Manage your ERP account settings and security preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <DashboardShell title="Settings" subtitle="Account preferences and security">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/dashboard/configuration" className="glass-card group rounded-2xl p-5 shadow-soft transition hover:-translate-y-0.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white shadow-brand"><SlidersHorizontal className="h-4 w-4" /></span>
          <h2 className="mt-3 text-base font-bold text-ink">Configuration Center</h2>
          <p className="mt-1 text-sm text-muted-foreground">Masters, institute profile, modules, templates, integrations and permissions.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand">Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
        </Link>
        <Link to="/dashboard/settings/logo" className="glass-card group rounded-2xl p-5 shadow-soft transition hover:-translate-y-0.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white shadow-brand"><ImageUp className="h-4 w-4" /></span>
          <h2 className="mt-3 text-base font-bold text-ink">Logo Manager</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload a new logo and update the website header and footer instantly.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand">Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
        </Link>
        <Link to="/dashboard/settings/security" className="glass-card group rounded-2xl p-5 shadow-soft transition hover:-translate-y-0.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white shadow-brand"><KeyRound className="h-4 w-4" /></span>
          <h2 className="mt-3 text-base font-bold text-ink">Security</h2>
          <p className="mt-1 text-sm text-muted-foreground">Change your password and protect your account.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand">Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
        </Link>
        <Link to="/dashboard/profile" className="glass-card group rounded-2xl p-5 shadow-soft transition hover:-translate-y-0.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white shadow-brand"><UserRound className="h-4 w-4" /></span>
          <h2 className="mt-3 text-base font-bold text-ink">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Update your name, photo and contact details.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand">Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
        </Link>
      </div>
    </DashboardShell>
  );
}
