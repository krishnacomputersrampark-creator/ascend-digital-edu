import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award, PlusCircle, LayoutTemplate, History, Search, Loader2, Download,
  Ban, RefreshCw, Eye, Filter, FileSpreadsheet,
} from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import {
  listCertificates, revokeCertificate, reissueCertificate, certificateAnalytics,
  CERT_STATUS_LABEL, CERT_TYPE_LABEL, type CertificateRow, type CertStatus,
  toCsv, downloadFile,
} from "@/lib/certificates.repo";
import { downloadCertificatePdf } from "@/lib/certificates.pdf";
import { toast } from "sonner";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard/certificates")({
  head: () => ({ meta: [{ title: "Certificates · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: CertificatesHome,
});

function CertificatesHome() {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CertStatus | "all">("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = () => {
    setLoading(true);
    Promise.all([listCertificates({ q, status }), certificateAnalytics()])
      .then(([r, s]) => { setRows(r); setStats(s); })
      .catch((e) => toast.error(e.message ?? "Unable to load"))
      .finally(() => setLoading(false));
  };
  useEffect(load, [q, status]);

  const paged = useMemo(() => rows.slice((page - 1) * perPage, page * perPage), [rows, page]);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));

  const onRevoke = async (id: string) => {
    const reason = window.prompt("Reason for revoking this certificate?");
    if (!reason) return;
    try { await revokeCertificate(id, reason); toast.success("Certificate revoked"); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const onReissue = async (id: string) => {
    if (!confirm("Revoke this certificate and issue a new one?")) return;
    try { const r = await reissueCertificate(id); toast.success(`Reissued as ${r.certificate_number}`); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const onExport = () => {
    const csv = toCsv(rows.map((r) => ({
      certificate_number: r.certificate_number,
      student: r.student?.full_name ?? "",
      student_code: r.student?.student_code ?? "",
      course: r.course?.name ?? "",
      branch: r.branch?.name ?? "",
      type: CERT_TYPE_LABEL[r.certificate_type],
      grade: r.grade ?? "",
      percentage: r.percentage ?? "",
      issue_date: r.issue_date,
      status: CERT_STATUS_LABEL[r.status],
    })));
    downloadFile(`certificates-${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  const cards = stats ? [
    { label: "Total", value: stats.total, sub: "all certificates", accent: "from-blue-500 to-cyan-500" },
    { label: "Issued", value: stats.issued, sub: "valid", accent: "from-emerald-500 to-teal-500" },
    { label: "Revoked", value: stats.revoked, sub: "invalidated", accent: "from-rose-500 to-red-500" },
    { label: "Draft", value: stats.pending, sub: "pending", accent: "from-amber-500 to-orange-500" },
  ] : [];

  const monthly = stats?.monthly ?? [];
  const byTypeData = stats ? Object.entries(stats.byType as Record<string, number>).map(([k, v]) => ({ type: CERT_TYPE_LABEL[k as keyof typeof CERT_TYPE_LABEL] ?? k, count: v })) : [];

  return (
    <DashboardShell
      title="Certificate Management"
      subtitle="Issue, verify, revoke and reissue certificates"
      actions={
        <>
          <Link to="/dashboard/certificates/create" className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow hover:brightness-110"><PlusCircle className="h-4 w-4"/>Issue Certificate</Link>
          <Link to="/dashboard/certificates/templates" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"><LayoutTemplate className="h-4 w-4"/>Templates</Link>
          <Link to="/dashboard/certificates/history" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"><History className="h-4 w-4"/>History</Link>
          <button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4"/>Export CSV</button>
        </>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border bg-gradient-to-br ${c.accent} p-4 text-white shadow-soft`}>
            <div className="text-[11px] font-semibold uppercase opacity-90">{c.label}</div>
            <div className="mt-1 text-3xl font-black">{c.value}</div>
            <div className="text-xs opacity-80">{c.sub}</div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-4 shadow-soft">
            <div className="mb-3 text-sm font-bold text-ink">Certificates issued (monthly)</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0674ae" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-soft">
            <div className="mb-3 text-sm font-bold text-ink">By type</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" fontSize={10} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-soft">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Search by certificate number or token…" className="w-full rounded-full border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border bg-white px-1 py-1 text-xs font-semibold">
            <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground"/>
            {(["all","issued","reissued","revoked","draft"] as const).map((s) => (
              <button key={s} onClick={() => { setPage(1); setStatus(s as any); }} className={`rounded-full px-3 py-1.5 ${status===s?"gradient-brand text-white":"text-ink/70 hover:bg-slate-50"}`}>
                {s === "all" ? "All" : CERT_STATUS_LABEL[s as CertStatus] ?? s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <Award className="mx-auto mb-3 h-10 w-10 text-brand/40" />
            <div className="text-sm font-semibold text-ink">No certificates found</div>
            <div className="text-xs text-muted-foreground">Issue your first certificate to get started.</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Certificate No</th>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2">Course</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Issued</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-cyan-soft/30">
                      <td className="px-4 py-2 font-mono text-xs font-semibold text-brand-dark">{r.certificate_number}</td>
                      <td className="px-4 py-2">
                        <div className="font-semibold text-ink">{r.student?.full_name ?? "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{r.student?.student_code}</div>
                      </td>
                      <td className="px-4 py-2">{r.course?.name ?? "—"}</td>
                      <td className="px-4 py-2 text-xs">{CERT_TYPE_LABEL[r.certificate_type]}</td>
                      <td className="px-4 py-2 text-xs">{new Date(r.issue_date).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <Link to="/certificate-verification/$certificateNumber" params={{ certificateNumber: r.certificate_number }} className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" title="Verify"><Eye className="h-3.5 w-3.5"/></Link>
                          <button onClick={() => downloadCertificatePdf(r).catch((e) => toast.error(e.message))} className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" title="Download PDF"><Download className="h-3.5 w-3.5"/></button>
                          {r.status !== "revoked" && (
                            <>
                              <button onClick={() => onReissue(r.id)} className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50" title="Reissue"><RefreshCw className="h-3.5 w-3.5"/></button>
                              <button onClick={() => onRevoke(r.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50" title="Revoke"><Ban className="h-3.5 w-3.5"/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
              <div>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, rows.length)} of {rows.length}</div>
              <div className="flex gap-1">
                <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Prev</button>
                <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function StatusBadge({ status }: { status: CertStatus }) {
  const map: Record<CertStatus, string> = {
    issued: "bg-emerald-100 text-emerald-700",
    reissued: "bg-sky-100 text-sky-700",
    revoked: "bg-rose-100 text-rose-700",
    expired: "bg-amber-100 text-amber-700",
    draft: "bg-slate-100 text-slate-600",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${map[status]}`}>{CERT_STATUS_LABEL[status]}</span>;
}