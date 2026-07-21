import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Loader2, Search } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import {
  listCertificates, CERT_STATUS_LABEL, CERT_TYPE_LABEL, toCsv, downloadFile,
  type CertificateRow,
} from "@/lib/certificates.repo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/certificates/history")({
  head: () => ({ meta: [{ title: "Certificate History · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    supabase.from("courses").select("id,name").order("name").then(({ data }) => setCourses((data ?? []) as any));
    supabase.from("branches").select("id,name").order("name").then(({ data }) => setBranches((data ?? []) as any));
  }, []);

  const load = () => {
    setLoading(true);
    listCertificates({ q, courseId: courseId || undefined, branchId: branchId || undefined, from: from || undefined, to: to || undefined })
      .then(setRows)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [q, courseId, branchId, from, to]);

  const onExport = () => {
    const csv = toCsv(rows.map((r) => ({
      certificate_number: r.certificate_number,
      student: r.student?.full_name ?? "",
      student_code: r.student?.student_code ?? "",
      roll_no: r.student?.roll_no ?? "",
      course: r.course?.name ?? "",
      branch: r.branch?.name ?? "",
      type: CERT_TYPE_LABEL[r.certificate_type],
      grade: r.grade ?? "",
      percentage: r.percentage ?? "",
      issue_date: r.issue_date,
      completion_date: r.completion_date ?? "",
      status: CERT_STATUS_LABEL[r.status],
    })));
    downloadFile(`certificates-history-${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  return (
    <DashboardShell
      title="Certificate history"
      subtitle="Search, filter and export all issued certificates"
      actions={
        <>
          <button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><FileSpreadsheet className="h-4 w-4"/>Export CSV</button>
          <Link to="/dashboard/certificates" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Back</Link>
        </>
      }
    >
      <div className="mb-4 grid gap-3 rounded-2xl border bg-white p-3 shadow-soft sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Certificate number or token" className="w-full rounded-xl border pl-10 pr-4 py-2 text-sm"/>
        </div>
        <select value={courseId} onChange={(e)=>setCourseId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={branchId} onChange={(e)=>setBranchId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded-xl border px-3 py-2 text-sm"/>
          <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded-xl border px-3 py-2 text-sm"/>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-soft">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No certificates match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Certificate No</th>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Course</th>
                  <th className="px-4 py-2">Branch</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Grade</th>
                  <th className="px-4 py-2">Issued</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-cyan-soft/30">
                    <td className="px-4 py-2 font-mono text-xs font-semibold text-brand-dark">{r.certificate_number}</td>
                    <td className="px-4 py-2"><div className="font-semibold text-ink">{r.student?.full_name}</div><div className="text-[11px] text-muted-foreground">{r.student?.student_code}</div></td>
                    <td className="px-4 py-2 text-xs">{r.course?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-xs">{r.branch?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-xs">{CERT_TYPE_LABEL[r.certificate_type]}</td>
                    <td className="px-4 py-2 text-xs">{r.grade ?? "—"} {r.percentage != null ? `(${r.percentage}%)` : ""}</td>
                    <td className="px-4 py-2 text-xs">{new Date(r.issue_date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-2 text-xs">{CERT_STATUS_LABEL[r.status]}</td>
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