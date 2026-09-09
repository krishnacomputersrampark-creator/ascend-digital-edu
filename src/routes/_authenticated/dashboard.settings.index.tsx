import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, Building2, Palette, ClipboardList, GraduationCap, Users, BookOpen, CalendarCheck,
  Receipt, Award, BadgeCheck, IdCard, FolderDown, Bell, MessageSquare, Mail, Phone, Hash,
  FileText, Menu as MenuIcon, ShieldCheck, KeyRound, MapPin, Server, History, ArrowRight, UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/settings/")({
  head: () => ({
    meta: [
      { title: "Configuration Center · Krishna Computer Center ERP" },
      { name: "description", content: "Every ERP setting in one place — institute, branding, forms, fees, results, numbering, templates, roles and security." },
      { property: "og:title", content: "Configuration Center · Krishna Computer Center ERP" },
      { property: "og:description", content: "Every ERP setting in one place — institute, branding, forms, fees, results, numbering, templates, roles and security." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

type Card = {
  letter: string;
  title: string;
  description: string;
  icon: typeof Building2;
  group: string;
  keywords: string[];
  /** Either a configuration-center section or a dedicated page. */
  section?: string;
  to?: "/dashboard/settings/logo" | "/dashboard/settings/security" | "/dashboard/profile";
};

const CARDS: Card[] = [
  { letter: "A", title: "Institute / Organization", description: "Name, address, contact, registration and footer details.", icon: Building2, group: "Organization", section: "institute", keywords: ["institute", "organisation", "address", "gst", "pan", "contact"] },
  { letter: "B", title: "Branding", description: "Logos for website, receipts, certificates, ID cards and favicon.", icon: Palette, group: "Organization", section: "branding", keywords: ["logo", "branding", "favicon", "signature", "seal"] },
  { letter: "B2", title: "Logo Manager", description: "Upload a new main logo and update header and footer instantly.", icon: Palette, group: "Organization", to: "/dashboard/settings/logo", keywords: ["logo", "upload", "image"] },
  { letter: "C", title: "Admission & Forms", description: "Every field of every form — show, hide, rename, reorder, require.", icon: ClipboardList, group: "Academics", section: "forms", keywords: ["form", "admission", "field", "enquiry", "contact"] },
  { letter: "C2", title: "Admission Policy", description: "Admission window, application numbering, documents and automation.", icon: ClipboardList, group: "Academics", section: "admission-config", keywords: ["admission", "application", "documents"] },
  { letter: "D", title: "Students", description: "Numbering, required data, statuses, portal access and ID rules.", icon: GraduationCap, group: "Academics", section: "student-config", keywords: ["student", "enrollment", "portal"] },
  { letter: "E", title: "Teachers", description: "Teacher IDs, employee codes, documents and faculty login.", icon: Users, group: "Academics", section: "teacher-config", keywords: ["teacher", "faculty", "employee"] },
  { letter: "F", title: "Courses", description: "Course codes, duration defaults and delivery mode.", icon: BookOpen, group: "Academics", section: "course-config", keywords: ["course", "code", "duration"] },
  { letter: "F2", title: "Batches", description: "Batch codes, capacity, timings and assignment rules.", icon: BookOpen, group: "Academics", section: "batch-config", keywords: ["batch", "capacity", "timing"] },
  { letter: "G", title: "Attendance", description: "Statuses, minimum percentage, lock period and permissions.", icon: CalendarCheck, group: "Operations", section: "attendance-config", keywords: ["attendance", "present", "absent", "percentage"] },
  { letter: "H", title: "Fees & Receipts", description: "Payment modes, installments, discounts and receipt content.", icon: Receipt, group: "Operations", section: "fee-config", keywords: ["fee", "receipt", "payment", "installment", "gst"] },
  { letter: "I", title: "Results & Exams", description: "Exam types, passing marks, grade boundaries and divisions.", icon: Award, group: "Operations", section: "results-config", keywords: ["result", "exam", "grade", "division"] },
  { letter: "J", title: "Certificates", description: "Certificate types, numbering, signature and QR verification.", icon: BadgeCheck, group: "Operations", section: "certificate-config", keywords: ["certificate", "qr", "verification"] },
  { letter: "K", title: "ID Cards", description: "Card layout, visible fields, validity and QR code.", icon: IdCard, group: "Operations", section: "idcard-config", keywords: ["id card", "identity", "photo"] },
  { letter: "L", title: "Downloads & Study Materials", description: "File types, size limits, visibility and download tracking.", icon: FolderDown, group: "Operations", section: "downloads-config", keywords: ["download", "material", "file"] },
  { letter: "M", title: "Notifications", description: "Which events notify whom, and through which channels.", icon: Bell, group: "Communication", section: "notification-config", keywords: ["notification", "alert"] },
  { letter: "N", title: "SMS", description: "SMS provider, sender ID and API credentials (stored securely).", icon: MessageSquare, group: "Communication", section: "integrations", keywords: ["sms", "sender", "api"] },
  { letter: "O", title: "Email", description: "SMTP host, port, sender identity and password secret.", icon: Mail, group: "Communication", section: "integrations", keywords: ["email", "smtp", "mail"] },
  { letter: "P", title: "WhatsApp", description: "WhatsApp provider, business number and template namespace.", icon: Phone, group: "Communication", section: "integrations", keywords: ["whatsapp", "business", "template"] },
  { letter: "Q", title: "Numbering", description: "Prefixes, padding and next-number preview for every ID series.", icon: Hash, group: "System", section: "numbering", keywords: ["numbering", "prefix", "sequence", "receipt", "enrollment"] },
  { letter: "R", title: "Documents", description: "Receipt, certificate and ID card document templates.", icon: FileText, group: "System", section: "templates", keywords: ["document", "template", "receipt", "header", "footer"] },
  { letter: "S", title: "Navigation / Menu", description: "Rename, reorder, hide and role-restrict menu items.", icon: MenuIcon, group: "System", section: "menu", keywords: ["menu", "navigation", "sidebar"] },
  { letter: "T", title: "Roles & Permissions", description: "Module-level view, create, edit, delete and approve rights.", icon: ShieldCheck, group: "System", section: "permissions", keywords: ["role", "permission", "access"] },
  { letter: "U", title: "Security Policy", description: "Session timeout, password policy and login attempt limits.", icon: KeyRound, group: "System", section: "security", keywords: ["security", "password", "session"] },
  { letter: "U2", title: "Change My Password", description: "Update the password for your own account.", icon: KeyRound, group: "System", to: "/dashboard/settings/security", keywords: ["password", "account"] },
  { letter: "V", title: "Branches", description: "Branch identity, contact details and activation status.", icon: MapPin, group: "System", section: "branches", keywords: ["branch", "center", "location"] },
  { letter: "W", title: "System", description: "Maintenance mode, support contacts and session defaults.", icon: Server, group: "System", section: "system", keywords: ["system", "maintenance", "support"] },
  { letter: "W2", title: "Preferences", description: "Language, date format, currency, theme and feature switches.", icon: Server, group: "System", section: "preferences", keywords: ["language", "theme", "currency", "format"] },
  { letter: "X", title: "Audit & Logs", description: "Full history of who changed which setting, and when.", icon: History, group: "System", section: "history", keywords: ["audit", "history", "log", "change"] },
  { letter: "Y", title: "My Profile", description: "Your own name, photo and contact details.", icon: UserRound, group: "System", to: "/dashboard/profile", keywords: ["profile", "account", "me"] },
];

const GROUPS = ["Organization", "Academics", "Operations", "Communication", "System"] as const;

function SettingsPage() {
  const { role } = useAuth();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return CARDS.filter((c) => {
      if (group !== "all" && c.group !== group) return false;
      if (!term) return true;
      return (
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.keywords.some((k) => k.includes(term))
      );
    });
  }, [q, group]);

  const isSuper = role === "super_admin";

  return (
    <DashboardShell title="Configuration Center" subtitle="Every ERP setting, grouped and searchable">
      <div className="space-y-5">
        <div className="glass-card rounded-2xl p-4 shadow-soft">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search settings — logo, fee, grade, numbering, menu…"
              aria-label="Search settings"
              className="w-full rounded-xl border bg-white/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["all", ...GROUPS].map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${group === g ? "gradient-brand text-white shadow-brand" : "border text-ink hover:bg-cyan-soft"}`}
              >
                {g === "all" ? "All" : g}
              </button>
            ))}
          </div>
        </div>

        {!isSuper ? (
          <p className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            Some sections are limited to Super Admin accounts.
          </p>
        ) : null}

        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No settings match “{q}”.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((c) => {
              const Icon = c.icon;
              const body = (
                <>
                  <span className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white shadow-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="mt-3 text-sm font-bold text-ink">{c.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand">
                    Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </>
              );
              const cls = "glass-card group rounded-2xl p-5 shadow-soft transition hover:-translate-y-0.5";
              return c.to ? (
                <Link key={c.title} to={c.to} className={cls}>{body}</Link>
              ) : (
                <Link key={c.title} to="/dashboard/configuration" search={{ section: c.section }} className={cls}>{body}</Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
