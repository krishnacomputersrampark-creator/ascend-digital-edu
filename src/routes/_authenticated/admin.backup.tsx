import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { Database, HardDrive, Download, Upload, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/backup")({
  head: () => ({ meta: [{ title: "Backup · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: BackupPage,
});

function BackupPage() {
  return (
    <DashboardShell title="Backup & Restore" subtitle="Database and storage backup interface (configuration UI — no live jobs)">
      <div className="grid gap-4 md:grid-cols-2">
        <Card icon={Database} title="Database Backup" body="Snapshot all ERP tables to a portable archive." action="Run backup" />
        <Card icon={HardDrive} title="Storage Backup" body="Bundle uploaded assets (photos, certificates, materials)." action="Run backup" />
        <Card icon={Upload} title="Restore" body="Upload an archive to restore records (placeholder — disabled)." action="Choose file" disabled />
        <Card icon={History} title="Backup History" body="No previous backups yet. Backups you run will appear here." action="Refresh" />
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Backups are managed automatically by Lovable Cloud. This screen provides the UI surface for future manual backup jobs.
      </p>
    </DashboardShell>
  );
}

function Card({ icon: Icon, title, body, action, disabled }: { icon: any; title: string; body: string; action: string; disabled?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-soft text-brand"><Icon className="h-5 w-5" /></span>
        <div className="text-base font-bold text-ink">{title}</div>
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
      <button disabled={disabled} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-50">
        <Download className="h-4 w-4" /> {action}
      </button>
    </div>
  );
}