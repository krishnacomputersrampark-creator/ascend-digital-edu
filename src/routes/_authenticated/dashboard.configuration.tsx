import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { useAuth } from "@/lib/auth";
import { SETTINGS_GROUPS } from "@/lib/settings.schema";
import {
  GroupSettingsPanel, MastersPanel, BranchesPanel, MenuPanel, FormsPanel,
  TemplatesPanel, IntegrationsPanel, NumberingPanel, RolesPanel, BackupPanel, HistoryPanel,
} from "@/components/erp/settings/panels";

export const Route = createFileRoute("/_authenticated/dashboard/configuration")({
  head: () => ({
    meta: [
      { title: "Configuration Center · Krishna Computer Center ERP" },
      { name: "description", content: "Super Admin configuration center for masters, institute profile, modules, templates, integrations and permissions." },
      { property: "og:title", content: "Configuration Center · Krishna Computer Center ERP" },
      { property: "og:description", content: "Control every ERP master, policy, template and integration from one secure place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfigurationCenter,
});

type Section = { id: string; title: string; description: string; keywords: string[] };

const EXTRA: Section[] = [
  { id: "masters", title: "Master Data", description: "Dropdown values used across every module.", keywords: ["master", "dropdown", "gender", "category", "status"] },
  { id: "branches", title: "Branch Management", description: "Branch identity, contact details and status.", keywords: ["branch", "center", "address"] },
  { id: "menu", title: "Page & Menu Management", description: "Labels, icons, order and role visibility.", keywords: ["menu", "sidebar", "navigation", "page"] },
  { id: "forms", title: "Form Configuration", description: "Field labels, visibility and validation.", keywords: ["form", "field", "validation", "required"] },
  { id: "templates", title: "Templates", description: "Notification and document templates.", keywords: ["template", "email", "sms", "receipt", "certificate"] },
  { id: "numbering", title: "Numbering & Prefixes", description: "Admission, enrollment, receipt and certificate numbers.", keywords: ["prefix", "number", "sequence", "receipt"] },
  { id: "integrations", title: "Integrations", description: "SMTP, WhatsApp, SMS and payment gateway.", keywords: ["integration", "smtp", "whatsapp", "sms", "razorpay", "payment"] },
  { id: "permissions", title: "Roles & Permissions", description: "Module-level permission matrix.", keywords: ["role", "permission", "rbac", "access"] },
  { id: "backup", title: "Backup & Data", description: "Record counts and export guidance.", keywords: ["backup", "export", "data"] },
  { id: "history", title: "Configuration History", description: "Full audit trail of configuration changes.", keywords: ["history", "audit", "log", "change"] },
];

function ConfigurationCenter() {
  const { role, loading } = useAuth();
  const [active, setActive] = useState("institute");
  const [search, setSearch] = useState("");

  const sections: Section[] = useMemo(
    () => [
      ...SETTINGS_GROUPS.map((g) => ({ id: g.id, title: g.title, description: g.description, keywords: g.keywords })),
      ...EXTRA,
    ],
    [],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.keywords.some((k) => k.includes(q)));
  }, [sections, search]);

  if (loading) {
    return <DashboardShell title="Configuration" subtitle="Loading"><p className="animate-pulse text-sm text-muted-foreground">Loading…</p></DashboardShell>;
  }

  if (role !== "super_admin") {
    return (
      <DashboardShell title="Configuration Center" subtitle="Restricted area">
        <div className="glass-card rounded-3xl p-8 text-center shadow-soft">
          <h2 className="text-lg font-bold text-ink">Super Admin access required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Only a Super Admin can view and change institute configuration.</p>
        </div>
      </DashboardShell>
    );
  }

  const group = SETTINGS_GROUPS.find((g) => g.id === active);

  return (
    <DashboardShell title="Settings & Configuration" subtitle="Control every module policy, master and template from one place">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="glass-card h-fit rounded-2xl p-3 shadow-soft lg:sticky lg:top-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search settings…"
              className="w-full rounded-xl border bg-white/80 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <nav className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
            {visible.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${active === s.id ? "gradient-brand text-white shadow-brand" : "text-ink hover:bg-cyan-soft"}`}
              >
                {s.title}
              </button>
            ))}
            {visible.length === 0 ? <p className="p-3 text-xs text-muted-foreground">No settings found.</p> : null}
          </nav>
        </aside>

        <div className="space-y-4">
          <header className="glass-card flex items-center gap-3 rounded-2xl p-4 shadow-soft">
            <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white shadow-brand"><SlidersHorizontal className="h-4 w-4" /></span>
            <div>
              <h2 className="text-base font-bold text-ink">{sections.find((s) => s.id === active)?.title}</h2>
              <p className="text-xs text-muted-foreground">{sections.find((s) => s.id === active)?.description}</p>
            </div>
          </header>

          {group ? <GroupSettingsPanel def={group} search={search} /> : null}
          {active === "masters" ? <MastersPanel search={search} /> : null}
          {active === "branches" ? <BranchesPanel /> : null}
          {active === "menu" ? <MenuPanel search={search} /> : null}
          {active === "forms" ? <FormsPanel /> : null}
          {active === "templates" ? <TemplatesPanel /> : null}
          {active === "numbering" ? <NumberingPanel /> : null}
          {active === "integrations" ? <IntegrationsPanel search={search} /> : null}
          {active === "permissions" ? <RolesPanel /> : null}
          {active === "backup" ? <BackupPanel /> : null}
          {active === "history" ? <HistoryPanel /> : null}
        </div>
      </div>
    </DashboardShell>
  );
}
