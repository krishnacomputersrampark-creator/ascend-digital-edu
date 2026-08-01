import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { ModuleGrid, ModuleStats, EmptyState } from "@/components/erp/ModulePage";
import { MessageSquare, Send, FileText, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/sms")({
  head: () => ({ meta: [{ title: "SMS · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: SmsAdmin,
});

function SmsAdmin() {
  return (
    <DashboardShell
      title="SMS"
      subtitle="Bulk SMS to students, parents and staff"
      actions={
        <Link to="/admin/notifications" className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-brand">
          <Send className="h-4 w-4" /> Compose
        </Link>
      }
    >
      <ModuleStats items={[
        { label: "Sent this month", value: 0 },
        { label: "Delivered", value: 0 },
        { label: "Failed", value: 0 },
        { label: "Credits", value: "—" },
      ]} />
      <ModuleGrid sections={[
        { title: "Compose", body: "Send an SMS to a branch, batch or custom recipient list.", icon: MessageSquare, to: "/admin/notifications" },
        { title: "Templates", body: "Reusable templates for fees, attendance and results.", icon: FileText },
        { title: "Delivery log", body: "Per-message delivery status and error reasons.", icon: History },
        { title: "Provider settings", body: "Configure the SMS gateway credentials and sender ID.", icon: Send, to: "/dashboard/settings" },
      ]} />
      <EmptyState title="SMS gateway not configured" body="Add gateway credentials in Settings to start sending messages." />
    </DashboardShell>
  );
}