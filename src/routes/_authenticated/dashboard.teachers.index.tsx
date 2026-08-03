import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Search, Plus, Upload, Download, Loader2, GraduationCap, UserCheck, UserMinus, Wallet,
  Trash2, Pencil, Eye, IdCard, ChevronLeft, ChevronRight, RefreshCw, Printer,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listBranchesPublic, listCoursesPublic } from "@/lib/admissions.functions";
import {
  deleteTeachers, exportTeachers, importTeachers, listTeachers, setTeacherStatus, teacherStats,
} from "@/lib/teachers.functions";
import {
  downloadTeacherImportTemplate, exportTeachersCsv, exportTeachersPdf, exportTeachersXlsx,
  parseTeacherImportFile, printTeacherIdCard,
} from "@/lib/teachers.export";
import {
  DEPARTMENTS, DESIGNATIONS, TEACHER_STATUSES, T_STATUS_CLASS, T_STATUS_LABEL, fmtDate, inr,
} from "@/lib/teachers.shared";

export const Route = createFileRoute("/_authenticated/dashboard/teachers/")({
  head: () => ({
    meta: [
      { title: "Teachers Management · KCC ERP" },
      { name: "description", content: "Manage Krishna Computer Center faculty: profiles, assignments, salaries and logins." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeachersList,
});

type Filters = {
  q: string; status: string; branchId: string; designation: string; department: string;
  page: number; pageSize: number; sortBy: "created_at" | "full_name" | "joining_date" | "teacher_id"; sortDir: "asc" | "desc";
};

const initialFilters: Filters = {
  q: "", status: "all", branchId: "all", designation: "all", department: "all",
  page: 1, pageSize: 10, sortBy: "created_at", sortDir: "desc",
};

function TeachersList() {
  const navigate = useNavigate();
  const fetchList = useServerFn(listTeachers);
  const fetchStats = useServerFn(teacherStats);
  const fetchExport = useServerFn(exportTeachers);
  const runImport = useServerFn(importTeachers);
  const removeMany = useServerFn(deleteTeachers);
  const statusMany = useServerFn(setTeacherStatus);
  const getBranches = useServerFn(listBranchesPublic);
  const getCourses = useServerFn(listCoursesPublic);

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await fetchList({ data: filters });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load teachers");
    } finally {
      setLoading(false);
    }
  }, [fetchList, filters]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
    getBranches().then((r: any) => setBranches(r ?? [])).catch(() => {});
    getCourses().then((r: any) => setCourses(r ?? [])).catch(() => {});
  }, [fetchStats, getBranches, getCourses]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));
  const allChecked = rows.length > 0 && selected.length === rows.length;

  const doExport = async (kind: "xlsx" | "csv" | "pdf") => {
    try {
      const data: any[] = await fetchExport({ data: filters });
      if (!data.length) return toast.error("Nothing to export");
      if (kind === "xlsx") exportTeachersXlsx(data);
      if (kind === "csv") exportTeachersCsv(data);
      if (kind === "pdf") exportTeachersPdf(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  };

  const onImport = async (file?: File | null) => {
    if (!file) return;
    try {
      const parsed = await parseTeacherImportFile(file);
      const res: any = await runImport({ data: { rows: parsed } });
      toast.success(`Imported ${res.inserted} teacher(s)`);
      if (res.errors?.length) toast.error(res.errors.slice(0, 3).join(" · "));
      void refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    }
  };

  const bulkStatus = async (status: string) => {
    if (!selected.length) return;
    await statusMany({ data: { ids: selected, status } });
    toast.success(`Updated ${selected.length} teacher(s)`);
    setSelected([]);
    void refresh();
  };

  const bulkDelete = async () => {
    if (!selected.length || !window.confirm(`Delete ${selected.length} teacher(s)?`)) return;
    await removeMany({ data: { ids: selected } });
    toast.success("Deleted");
    setSelected([]);
    void refresh();
  };

  const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";
  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-ink";

  return (
    <DashboardShell
      title="Teachers Management"
      subtitle="Faculty records, assignments, documents and logins"
      actions={
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button className={btn} onClick={downloadTeacherImportTemplate}><Download className="h-4 w-4" /> Template</button>
          <button className={btn} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
          <Link to="/dashboard/teachers/new" className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-brand">
            <Plus className="h-4 w-4" /> Add Teacher
          </Link>
        </div>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Teachers", value: stats?.total ?? 0, icon: GraduationCap },
          { label: "Active", value: stats?.active ?? 0, icon: UserCheck },
          { label: "Inactive / Resigned", value: (stats?.inactive ?? 0) + (stats?.resigned ?? 0), icon: UserMinus },
          { label: "Monthly Salary", value: inr(stats?.salaryTotal ?? 0), icon: Wallet },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <s.icon className="h-4 w-4 text-brand" /> {s.label}
            </div>
            <div className="mt-1 text-2xl font-extrabold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={filters.q} onChange={(e) => set({ q: e.target.value })}
            placeholder="Search name, ID, mobile, email or subject"
            className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>
        <select className={sel} value={filters.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="all">All statuses</option>
          {TEACHER_STATUSES.map((s) => <option key={s} value={s}>{T_STATUS_LABEL[s]}</option>)}
        </select>
        <select className={sel} value={filters.branchId} onChange={(e) => set({ branchId: e.target.value })}>
          <option value="all">All branches</option>
          {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={sel} value={filters.designation} onChange={(e) => set({ designation: e.target.value })}>
          <option value="all">All designations</option>
          {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={sel} value={filters.department} onChange={(e) => set({ department: e.target.value })}>
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={sel} value={`${filters.sortBy}:${filters.sortDir}`}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split(":") as [Filters["sortBy"], Filters["sortDir"]];
            set({ sortBy, sortDir });
          }}>
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="full_name:asc">Name A–Z</option>
          <option value="full_name:desc">Name Z–A</option>
          <option value="joining_date:desc">Recently joined</option>
          <option value="teacher_id:asc">Teacher ID</option>
        </select>
        <div className="flex gap-2">
          <button className={btn} onClick={() => doExport("xlsx")}>Excel</button>
          <button className={btn} onClick={() => doExport("csv")}>CSV</button>
          <button className={btn} onClick={() => doExport("pdf")}>PDF</button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-cyan-soft px-3 py-2 text-sm">
          <span className="font-semibold text-brand">{selected.length} selected</span>
          <button className={btn} onClick={() => bulkStatus("active")}>Mark Active</button>
          <button className={btn} onClick={() => bulkStatus("inactive")}>Mark Inactive</button>
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600" onClick={bulkDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-soft">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">
                <input type="checkbox" checked={allChecked} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} />
              </th>
              <th className="p-3">Teacher</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Designation</th>
              <th className="p-3">Branch</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Salary</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">No teachers found. Add your first faculty member.</td></tr>
            ) : rows.map((t) => (
              <tr key={t.id} className="border-t border-border/70 hover:bg-slate-50/70">
                <td className="p-3">
                  <input type="checkbox" checked={selected.includes(t.id)}
                    onChange={(e) => setSelected((s) => (e.target.checked ? [...s, t.id] : s.filter((x) => x !== t.id)))} />
                </td>
                <td className="p-3">
                  <div className="font-bold text-ink">{t.full_name}</div>
                  <div className="text-xs text-muted-foreground">{t.teacher_id} · {t.employee_code}</div>
                </td>
                <td className="p-3 text-xs">
                  <div>{t.mobile}</div>
                  <div className="text-muted-foreground">{t.email ?? "—"}</div>
                </td>
                <td className="p-3 text-xs">
                  <div>{t.designation ?? "—"}</div>
                  <div className="text-muted-foreground">{t.department ?? "—"}</div>
                </td>
                <td className="p-3 text-xs">{t.branch?.name ?? "—"}</td>
                <td className="p-3 text-xs">{fmtDate(t.joining_date)}</td>
                <td className="p-3 text-xs font-semibold">{inr(t.salary)}</td>
                <td className="p-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${T_STATUS_CLASS[t.status] ?? ""}`}>
                    {T_STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button title="View" className="grid h-8 w-8 place-items-center rounded-lg border border-border"
                      onClick={() => navigate({ to: "/dashboard/teachers/$id", params: { id: t.id } })}><Eye className="h-4 w-4" /></button>
                    <button title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-border"
                      onClick={() => navigate({ to: "/dashboard/teachers/$id/edit", params: { id: t.id } })}><Pencil className="h-4 w-4" /></button>
                    <button title="ID Card" className="grid h-8 w-8 place-items-center rounded-lg border border-border"
                      onClick={() => printTeacherIdCard(t)}><IdCard className="h-4 w-4" /></button>
                    <button title="Print" className="grid h-8 w-8 place-items-center rounded-lg border border-border"
                      onClick={() => window.print()}><Printer className="h-4 w-4" /></button>
                    <button title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-600"
                      onClick={async () => {
                        if (!window.confirm(`Delete ${t.full_name}?`)) return;
                        await removeMany({ data: { ids: [t.id] } });
                        toast.success("Deleted");
                        void refresh();
                      }}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {total === 0 ? "No records" : `Showing ${(filters.page - 1) * filters.pageSize + 1}–${Math.min(filters.page * filters.pageSize, total)} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <select className={sel} value={filters.pageSize} onChange={(e) => set({ pageSize: Number(e.target.value) })}>
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <span className="px-1 font-semibold text-ink">{filters.page} / {pages}</span>
          <button disabled={filters.page >= pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </DashboardShell>
  );
}