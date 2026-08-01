import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { ModuleGrid, ModuleStats, EmptyState } from "@/components/erp/ModulePage";
import { CalendarDays, CalendarPlus, Users, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => ({ meta: [{ title: "Events · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: EventsAdmin,
});

function EventsAdmin() {
  return (
    <DashboardShell title="Events" subtitle="Seminars, workshops and institute events published to the website">
      <ModuleStats items={[
        { label: "Upcoming", value: 0 },
        { label: "Ongoing", value: 0 },
        { label: "Completed", value: 0 },
        { label: "Registrations", value: 0 },
      ]} />
      <ModuleGrid sections={[
        { title: "Create event", body: "Name, date, venue, branch and description.", icon: CalendarPlus },
        { title: "Schedule", body: "Manage upcoming, ongoing and past events.", icon: CalendarDays },
        { title: "Registrations", body: "Track who registered for each event.", icon: Users },
        { title: "Event media", body: "Attach cover images and gallery albums.", icon: ImageIcon, to: "/admin/gallery" },
      ]} />
      <EmptyState title="No events scheduled" body="Add an event to publish it on the public events page." />
    </DashboardShell>
  );
}