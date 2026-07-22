import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { fetchAuditLogs, type AuditRow } from "@/lib/admin.repo";
import { Search, Loader2, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 25;

  const load = () => {
    setLoading(true);
    fetchAuditLogs({ q, entity: entity || undefined, action: action || undefined, limit: perPage, offset: (page - 1) * perPage })
      .then((res) => { setRows(res.rows); setTotal(res.total); })
      .finally(() => setLoading(false));
  };
  useEffect(load, [q, entity, action, page]);

  const exportCsv = () => {
    const header = ["When", "Actor", "Action", "Entity", "Entity ID"];
    const body = rows.map((r) => [new Date(r.created_at).toLocaleString(), r.actor_email ?? "—", r.action, r.entity, r.entity_id ?? ""]);
    const csv = [header, ...body].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <DashboardShell title="Audit Logs" subtitle="Immutable trail of system activity" actions={
      <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink shadow-soft ring-1 ring-border">
        <FileSpreadsheet className="h-4 w-4" /> Export CSV
      </button>
    }>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Search actor email or entity ID" className="w-full rounded-xl border border-border bg-white pl-10 pr-3 py-2 text-sm" />
        </div>
        <input value={entity} onChange={(e) => { setPage(1); setEntity(e.target.value); }} placeholder="Entity (e.g. students)" className="w-56 rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        <input value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} placeholder="Action (e.g. update)" className="w-56 rounded-xl border border-border bg-white px-3 py-2 text-sm" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-cyan-soft text-left text-xs uppercase text-brand-dark">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Entity ID</th>
              <th className="px-4 py-3">Meta</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No audit records match.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60 hover:bg-cyan-soft/40">
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-2.5 font-medium text-ink">{r.actor_email ?? "—"}</td>
                <td className="px-4 py-2.5"><span className="rounded-full bg-cyan-soft px-2 py-0.5 text-xs font-bold text-brand">{r.action}</span></td>
                <td className="px-4 py-2.5 text-ink">{r.entity}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.entity_id ?? "—"}</td>
                <td className="max-w-md truncate px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.meta ? JSON.stringify(r.meta) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <div>{total.toLocaleString()} record(s)</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      </div>
    </DashboardShell>
  );
}