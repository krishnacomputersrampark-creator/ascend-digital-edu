import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { ModuleGrid, ModuleStats, EmptyState } from "@/components/erp/ModulePage";
import { Mail, Send, FileText, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/email")({
  head: () => ({ meta: [{ title: "Email · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: EmailAdmin,
});

function EmailAdmin() {
  return (
    <DashboardShell
      title="Email"
      subtitle="Transactional and bulk email to students, parents and staff"
      actions={
        <Link to="/admin/notifications" className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-brand">
          <Send className="h-4 w-4" /> Compose
        </Link>
      }
    >
      <ModuleStats items={[
        { label: "Sent this month", value: 0 },
        { label: "Opened", value: 0 },
        { label: "Bounced", value: 0 },
        { label: "Templates", value: 0 },
      ]} />
      <ModuleGrid sections={[
        { title: "Compose", body: "Send an email campaign to a filtered audience.", icon: Mail, to: "/admin/notifications" },
        { title: "Templates", body: "Admission, fee receipt, result and certificate templates.", icon: FileText },
        { title: "Delivery log", body: "Track sends, opens and bounces per recipient.", icon: History },
        { title: "Sender settings", body: "Configure sender name, reply-to and domain.", icon: Send, to: "/dashboard/settings" },
      ]} />
      <EmptyState title="No campaigns yet" body="Compose your first email to see delivery analytics here." />
    </DashboardShell>
  );
}