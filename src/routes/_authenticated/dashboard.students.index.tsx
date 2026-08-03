import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Search, Download, Loader2, Users, UserCheck, GraduationCap, UserMinus,
  Plus, Upload, Trash2, Pencil, Eye, IdCard, FileText, ChevronLeft, ChevronRight, X,
  RefreshCw, Printer, QrCode, Receipt, CalendarPlus, Clock, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listBranchesPublic, listCoursesPublic, listBatchesPublic } from "@/lib/admissions.functions";
import {
  deleteStudents, exportStudents, importStudents, listStudentsAdvanced, setStudentStatus, studentStats,
} from "@/lib/students.functions";
import {
  downloadImportTemplate, downloadStudentQr, exportStudentsCsv, exportStudentsPdf, exportStudentsXlsx,
  parseImportFile, printAdmissionForm, printIdCard,
} from "@/lib/students.export";
import { STATUS_CLASS, STATUS_LABEL, STUDENT_STATUSES, fmtDate } from "@/lib/students.shared";
import { signedUrlFor } from "@/lib/students.client";

export const Route = createFileRoute("/_authenticated/dashboard/students/")({
  head: () => ({ meta: [{ title: "Students · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: StudentsPage,
});

const PAGE_SIZES = [10, 25, 50, 100];

function StudentsPage() {
  const fetchList = useServerFn(listStudentsAdvanced);
  const fetchStats = useServerFn(studentStats);
  const fetchExport = useServerFn(exportStudents);
  const fetchBranches = useServerFn(listBranchesPublic);
  const fetchCourses = useServerFn(listCoursesPublic);
  const fetchBatches = useServerFn(listBatchesPublic);
  const removeStudents = useServerFn(deleteStudents);
  const changeStatus = useServerFn(setStudentStatus);
  const runImport = useServerFn(importStudents);
  const navigate = useNavigate();

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [gender, setGender] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "full_name" | "joined_at" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filters = useCallback(
    () => ({
      q: search || undefined,
      branch_id: branch || undefined,
      course_id: course || undefined,
      batch_id: batch || undefined,
      gender,
      status,
      from: from || undefined,
      to: to || undefined,
      sortBy,
      sortDir,
      page,
      pageSize,
    }),
    [search, branch, course, batch, gender, status, from, to, sortBy, sortDir, page, pageSize],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await fetchList({ data: filters() });
      setRows(res.rows);
      setTotal(res.total);
      setSelected([]);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load students");
    } finally {
      setLoading(false);
    }
  }, [fetchList, filters]);

  const refreshStats = useCallback(() => {
    fetchStats().then(setStats).catch(() => {});
  }, [fetchStats]);

  useEffect(() => {
    fetchBranches().then(setBranches).catch(() => {});
    fetchCourses().then(setCourses).catch(() => {});
    refreshStats();
  }, [fetchBranches, fetchCourses, refreshStats]);

  useEffect(() => {
    fetchBatches({ data: { branch_id: branch || undefined, course_id: course || undefined } }).then(setBatches).catch(() => {});
  }, [fetchBatches, branch, course]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allChecked = rows.length > 0 && selected.length === rows.length;

  const doExport = async (kind: "xlsx" | "csv" | "pdf" | "print") => {
    const data: any[] = await fetchExport({ data: filters() });
    if (!data.length) { toast.error("Nothing to export for these filters."); return; }
    if (kind === "xlsx") exportStudentsXlsx(data);
    if (kind === "csv") exportStudentsCsv(data);
    if (kind === "pdf") exportStudentsPdf(data);
    if (kind === "print") window.print();
  };

  const doDelete = async (ids: string[]) => {
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} student record(s)? They will be archived and can be restored by an administrator.`)) return;
    await removeStudents({ data: { ids } });
    toast.success(`${ids.length} student(s) deleted.`);
    load();
    refreshStats();
  };

  const doStatus = async (id: string, next: string) => {
    await changeStatus({ data: { id, status: next } });
    toast.success("Status updated.");
    load();
    refreshStats();
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      const parsed = await parseImportFile(file);
      const res: any = await runImport({ data: { rows: parsed } });
      toast.success(`Imported ${res.inserted} student(s). ${res.failed ? `${res.failed} row(s) skipped.` : ""}`);
      if (res.errors?.length) console.warn("Import issues:", res.errors);
      load();
      refreshStats();
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed.");
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  };

  const resetFilters = () => {
    setQ(""); setSearch(""); setBranch(""); setCourse(""); setBatch("");
    setGender("all"); setStatus("all"); setFrom(""); setTo(""); setPage(1);
  };

  return (
    <DashboardShell
      title="Students"
      subtitle="Master directory across all branches, courses and batches."
      actions={
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { load(); refreshStats(); toast.success("Refreshed."); }} className={ghostBtn}><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => doExport("print")} className={ghostBtn}><Printer className="h-4 w-4" /> Print</button>
          <button onClick={() => downloadImportTemplate()} className={ghostBtn}><FileText className="h-4 w-4" /> Template</button>
          <button onClick={() => importRef.current?.click()} disabled={importing} className={ghostBtn}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
          <button onClick={() => doExport("xlsx")} className={ghostBtn}><Download className="h-4 w-4" /> Excel</button>
          <button onClick={() => doExport("csv")} className={ghostBtn}>CSV</button>
          <button onClick={() => doExport("pdf")} className={ghostBtn}>PDF</button>
          <Link to="/dashboard/students/new" className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand">
            <Plus className="h-4 w-4" /> Add student
          </Link>
        </div>
      }
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total students" value={stats?.total ?? 0} icon={Users} />
        <StatCard label="Active" value={stats?.active ?? 0} icon={UserCheck} />
        <StatCard label="Inactive" value={stats?.inactive ?? 0} icon={UserMinus} />
        <StatCard label="Today's admissions" value={stats?.today ?? 0} icon={CalendarPlus} />
        <StatCard label="Pending admissions" value={stats?.pendingAdmissions ?? 0} icon={Clock} />
        <StatCard label="Branches covered" value={stats?.byBranch?.length ?? 0} icon={Building2} />
      </div>

      {stats && (
        <div className="mb-5 grid gap-4 lg:grid-cols-4">
          <MiniReport title="Students by branch" rows={stats.byBranch} icon={Building2} />
          <MiniReport title="Students by course" rows={stats.byCourse} icon={GraduationCap} />
          <MiniReport title="Students by gender" rows={stats.byGender} icon={Users} />
          <MiniReport
            title="Admissions"
            rows={[
              { name: "Today", value: stats.today ?? 0 },
              { name: "This month", value: stats.thisMonth ?? 0 },
              { name: "Completed", value: stats.completed ?? 0 },
              { name: "Dropped", value: stats.dropped ?? 0 },
            ]}
            icon={CalendarPlus}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white shadow-soft">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, father, mobile, email, admission or enrollment no…" className="w-full rounded-full border border-border bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">All branches</option>
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={course} onChange={(e) => { setCourse(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">All courses</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </select>
          <select value={batch} onChange={(e) => { setBatch(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">All batches</option>
            {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
            <option value="all">All statuses</option>
            {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }} className={selectCls}>
            <option value="all">Any gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={selectCls} aria-label="Joined from" />
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={selectCls} aria-label="Joined to" />
          <select value={`${sortBy}:${sortDir}`} onChange={(e) => { const [b, d] = e.target.value.split(":"); setSortBy(b as any); setSortDir(d as any); }} className={selectCls}>
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="full_name:asc">Name A–Z</option>
            <option value="full_name:desc">Name Z–A</option>
            <option value="joined_at:desc">Recently joined</option>
          </select>
          <button onClick={resetFilters} className={ghostBtn}><X className="h-4 w-4" /> Reset</button>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-cyan-soft/40 px-4 py-3 text-sm">
            <span className="font-semibold text-ink">{selected.length} selected</span>
            <button onClick={() => doDelete(selected)} className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white">
              <Trash2 className="h-3.5 w-3.5" /> Delete selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-cyan-soft/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allChecked} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} aria-label="Select all" />
                </th>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Admission / IDs</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Parents</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Admission date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={12} className="py-14 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-14 text-center">
                    <div className="text-sm font-bold text-ink">No students found</div>
                    <p className="mt-1 text-sm text-muted-foreground">Adjust your filters, import a spreadsheet, or add a student.</p>
                    <Link to="/dashboard/students/new" className="mt-4 inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand">
                      <Plus className="h-4 w-4" /> Add student
                    </Link>
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-cyan-soft/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))}
                      aria-label={`Select ${r.full_name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StudentAvatar row={r} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-brand-dark">{r.admission_number ?? "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{r.student_code} · {r.enrollment_no}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/dashboard/students/$id" params={{ id: r.id }} className="font-semibold text-ink hover:text-brand">{r.full_name}</Link>
                    <div className="text-[11px] text-muted-foreground">{r.gender ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{r.father_name || "—"}</div>
                    <div className="text-muted-foreground">{r.mother_name || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-semibold text-ink">{r.phone}</div>
                    <div className="text-muted-foreground">{r.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{r.course?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{r.batch?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{r.branch?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(r.joined_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => doStatus(r.id, e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[r.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {[...new Set([r.status, ...STUDENT_STATUSES])].map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button title="View" onClick={() => navigate({ to: "/dashboard/students/$id", params: { id: r.id } })} className={iconBtn}><Eye className="h-4 w-4" /></button>
                      <button title="Edit" onClick={() => navigate({ to: "/dashboard/students/$id/edit", params: { id: r.id } })} className={iconBtn}><Pencil className="h-4 w-4" /></button>
                      <button title="ID card" onClick={() => printIdCard(r, window.location.origin)} className={iconBtn}><IdCard className="h-4 w-4" /></button>
                      <button title="Admission form" onClick={() => printAdmissionForm(r)} className={iconBtn}><Printer className="h-4 w-4" /></button>
                      <button title="QR code" onClick={() => downloadStudentQr(r, window.location.origin)} className={iconBtn}><QrCode className="h-4 w-4" /></button>
                      <button title="Fees" onClick={() => navigate({ to: "/dashboard/fees/collect" })} className={iconBtn}><Receipt className="h-4 w-4" /></button>
                      <button title="Delete" onClick={() => doDelete([r.id])} className={`${iconBtn} text-rose-600`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm">
          <div className="text-muted-foreground">
            {total === 0 ? "0 records" : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
          </div>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className={selectCls}>
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`${iconBtn} disabled:opacity-40`}><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-xs font-semibold text-ink">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className={`${iconBtn} disabled:opacity-40`}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

const ghostBtn = "inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft hover:border-brand";
const iconBtn = "grid h-8 w-8 place-items-center rounded-lg border border-border bg-white text-ink hover:border-brand";
const selectCls = "rounded-full border border-border bg-white px-4 py-2 text-sm";

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white"><Icon className="h-4 w-4" /></span>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-ink">{value}</div>
    </div>
  );
}

function MiniReport({ title, rows, icon: Icon }: { title: string; rows: Array<{ name: string; value: number }>; icon: any }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-brand" /> {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.slice(0, 5).map((r) => (
            <li key={r.name}>
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span className="truncate pr-2 capitalize">{r.name}</span>
                <span>{r.value}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-cyan-soft">
                <div className="h-1.5 rounded-full gradient-brand" style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}