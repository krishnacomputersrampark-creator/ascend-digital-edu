import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { ModuleGrid, ModuleStats, EmptyState } from "@/components/erp/ModulePage";
import { Handshake, FileText, Building2, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/franchise")({
  head: () => ({ meta: [{ title: "Franchise · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: FranchiseAdmin,
});

function FranchiseAdmin() {
  return (
    <DashboardShell title="Franchise" subtitle="Franchise enquiries, agreements and partner centres">
      <ModuleStats items={[
        { label: "Enquiries", value: 0 },
        { label: "In review", value: 0 },
        { label: "Approved partners", value: 0 },
        { label: "Active centres", value: 0 },
      ]} />
      <ModuleGrid sections={[
        { title: "Enquiries", body: "Leads submitted from the public franchise page.", icon: Handshake },
        { title: "Agreements", body: "Store signed agreements and renewal dates.", icon: FileText },
        { title: "Partner centres", body: "Convert approved partners into branches.", icon: Building2, to: "/admin/branches" },
        { title: "Verification", body: "KYC and document verification checklist.", icon: BadgeCheck },
      ]} />
      <EmptyState title="No franchise enquiries" body="Enquiries submitted on the website will appear here for review." />
    </DashboardShell>
  );
}