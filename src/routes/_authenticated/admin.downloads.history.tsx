import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Search, FileSpreadsheet } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listAllHistory, type HistoryRow } from "@/lib/downloads.repo";
import { downloadExcelCsv } from "@/lib/downloads.utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/downloads/history")({
  head: () => ({ meta: [{ title: "Download History · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    listAllHistory({ from: from || undefined, to: to || undefined, limit: 500 })
      .then(setRows).catch((e) => toast.error(e.message ?? "Failed")).finally(() => setLoading(false));
  };
  useEffect(load, [from, to]);

  const filtered = q ? rows.filter((r) =>
    (r.material?.title ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (r.student?.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (r.student?.student_code ?? "").toLowerCase().includes(q.toLowerCase()),
  ) : rows;

  const onExport = () => downloadExcelCsv("download-history", filtered.map((r) => ({
    downloaded_at: r.downloaded_at,
    student: r.student?.full_name ?? "",
    student_code: r.student?.student_code ?? "",
    material: r.material?.title ?? "",
    file_name: r.material?.file_name ?? "",
    file_type: r.material?.file_type ?? "",
    device: r.device ?? "",
  })));

  return (
    <DashboardShell
      title="Download history"
      subtitle="Complete log of student downloads"
      actions={
        <>
          <button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><FileSpreadsheet className="h-4 w-4"/>Export</button>
          <Link to="/admin/downloads" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Back</Link>
        </>
      }
    >
      <div className="mb-4 grid gap-3 rounded-2xl border bg-white p-3 shadow-soft sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search student or material" className="w-full rounded-xl border pl-10 pr-4 py-2 text-sm"/>
        </div>
        <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded-xl border px-3 py-2 text-sm"/>
        <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded-xl border px-3 py-2 text-sm"/>
      </div>

      <div className="rounded-2xl border bg-white shadow-soft">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No download records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
                <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Student</th><th className="px-4 py-2">Material</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Device</th></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-cyan-soft/30">
                    <td className="px-4 py-2 text-xs">{new Date(r.downloaded_at).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2"><div className="font-semibold text-ink">{r.student?.full_name ?? "—"}</div><div className="text-[11px] text-muted-foreground">{r.student?.student_code ?? ""}</div></td>
                    <td className="px-4 py-2">{r.material?.title ?? "—"}</td>
                    <td className="px-4 py-2 text-xs uppercase">{r.material?.file_type ?? "—"}</td>
                    <td className="px-4 py-2 text-[11px] text-muted-foreground line-clamp-1 max-w-[240px]">{r.device ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}