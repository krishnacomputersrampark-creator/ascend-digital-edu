import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { ModuleGrid, ModuleStats, EmptyState } from "@/components/erp/ModulePage";
import { Megaphone, AlertTriangle, CalendarX, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notices")({
  head: () => ({ meta: [{ title: "Notice Board · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: NoticesAdmin,
});

function NoticesAdmin() {
  return (
    <DashboardShell
      title="Notice Board"
      subtitle="Publish notices to students, faculty and the public website"
      actions={
        <Link to="/admin/notifications" className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-brand">
          <Megaphone className="h-4 w-4" /> Send notification
        </Link>
      }
    >
      <ModuleStats items={[
        { label: "Active notices", value: 0 },
        { label: "High priority", value: 0 },
        { label: "Expiring soon", value: 0 },
        { label: "Student visible", value: 0 },
      ]} />
      <ModuleGrid sections={[
        { title: "Create notice", body: "Title, body, attachment and target audience.", icon: Megaphone },
        { title: "Priority", body: "Mark notices as normal, important or urgent.", icon: AlertTriangle },
        { title: "Expiry", body: "Auto-hide notices after their expiry date.", icon: CalendarX },
        { title: "Student visibility", body: "Control which roles and branches can see each notice.", icon: Eye },
        { title: "Notifications", body: "Push targeted in-app notifications to students and staff.", icon: Megaphone, to: "/admin/notifications" },
      ]} />
      <EmptyState title="No notices published" body="Create a notice to display it on the student dashboard and public notice board." />
    </DashboardShell>
  );
}