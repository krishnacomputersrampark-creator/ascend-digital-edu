import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listBranchesPublic, listCoursesPublic, listBatchesPublic } from "@/lib/admissions.functions";
import { listAttendanceHistory, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/attendance.functions";

export const Route = createFileRoute("/_authenticated/dashboard/attendance/history")({
  head: () => ({ meta: [{ title: "Attendance History · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: AttendanceHistoryPage,
});

const STATUS_COLOR: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-amber-100 text-amber-700",
  half_day: "bg-orange-100 text-orange-700",
  leave: "bg-blue-100 text-blue-700",
  holiday: "bg-slate-100 text-slate-700",
};

function AttendanceHistoryPage() {
  const fetchHistory = useServerFn(listAttendanceHistory);
  const fetchBranches = useServerFn(listBranchesPublic);
  const fetchCourses = useServerFn(listCoursesPublic);
  const fetchBatches = useServerFn(listBatchesPublic);

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");
  const [rows, setRows] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 50;

  useEffect(() => { fetchBranches().then(setBranches); fetchCourses().then(setCourses); }, [fetchBranches, fetchCourses]);
  useEffect(() => { fetchBatches({ data: { branch_id: branch || undefined, course_id: course || undefined } }).then(setBatches); }, [branch, course, fetchBatches]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory({ data: {
        from, to,
        branch_id: branch || undefined,
        course_id: course || undefined,
        batch_id: batch || undefined,
        status: status || undefined,
      } });
      setRows(data);
      setPage(1);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const exportCsv = () => {
    const header = "Date,Student,Code,Status,Check-in,Check-out,Branch,Course,Batch,Remarks\n";
    const body = rows.map((r) => [
      r.attendance_date, r.student?.full_name ?? "", r.student?.student_code ?? "",
      r.status, r.check_in_time ?? "", r.check_out_time ?? "",
      r.branch?.name ?? "", r.course?.name ?? "", r.batch?.name ?? "",
      `"${(r.remarks ?? "").replace(/"/g, '""')}"`,
    ].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attendance-${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const exportXlsx = () => {
    const flat = rows.map((r) => ({
      Date: r.attendance_date, Student: r.student?.full_name, Code: r.student?.student_code,
      Status: r.status, CheckIn: r.check_in_time, CheckOut: r.check_out_time,
      Branch: r.branch?.name, Course: r.course?.name, Batch: r.batch?.name, Remarks: r.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance-${from}_${to}.xlsx`);
  };
  const printPdf = () => window.print();

  const paged = rows.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));

  return (
    <DashboardShell
      title="Attendance History"
      subtitle="Filter records by date range, branch, course, batch or status."
      actions={
        <>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-2 text-xs font-semibold shadow-soft"><Download className="h-3 w-3" /> CSV</button>
          <button onClick={exportXlsx} className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-2 text-xs font-semibold shadow-soft"><Download className="h-3 w-3" /> Excel</button>
          <button onClick={printPdf} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-3 py-2 text-xs font-semibold text-white shadow-brand"><Download className="h-3 w-3" /> PDF</button>
        </>
      }
    >
      <section className="rounded-2xl border bg-white p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">All</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          </div>
          <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Course</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">All</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Batch</label>
            <select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">All</option>{batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          </div>
          <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-lg border px-3 py-2 text-sm"><option value="">All</option>{ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="flex items-end">
            <button onClick={load} disabled={loading} className="w-full rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : <><Filter className="mr-1 inline h-3 w-3" /> Apply</>}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border bg-white shadow-soft">
        <div className="border-b p-4 text-sm font-semibold">{rows.length} records</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cyan-soft/40 text-left text-xs font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Date</th><th className="p-3">Student</th><th className="p-3">Code</th>
                <th className="p-3">Status</th><th className="p-3">In</th><th className="p-3">Out</th>
                <th className="p-3">Batch</th><th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand" /></td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No records for the selected filters.</td></tr>
              ) : paged.map((r) => (
                <tr key={r.id} className="border-t hover:bg-cyan-soft/20">
                  <td className="p-3">{r.attendance_date}</td>
                  <td className="p-3 font-semibold text-ink">{r.student?.full_name}</td>
                  <td className="p-3 text-muted-foreground">{r.student?.student_code}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[r.status]}`}>{r.status}</span></td>
                  <td className="p-3">{r.check_in_time ?? "—"}</td>
                  <td className="p-3">{r.check_out_time ?? "—"}</td>
                  <td className="p-3">{r.batch?.name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.remarks ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > perPage && (
          <div className="flex items-center justify-between border-t p-4 text-sm">
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full border bg-white px-3 py-1 text-xs disabled:opacity-40">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-full border bg-white px-3 py-1 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}