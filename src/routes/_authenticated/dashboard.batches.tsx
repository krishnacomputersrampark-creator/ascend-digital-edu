import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Layers, PlayCircle, CalendarClock, CheckCircle2, Sunrise, Sun, Sunset, CalendarDays,
  Plus, Search, Download, Upload, Loader2, Pencil, Trash2, Users, RefreshCw, Printer, X,
  ChevronLeft, ChevronRight, UserPlus, ArrowLeftRight, UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listBranchesPublic, listCoursesPublic } from "@/lib/admissions.functions";
import {
  assignStudentsToBatch, batchStats, deleteBatches, exportBatches, importBatches, listAssignableStudents,
  listBatchStudents, listBatches, listTeacherOptions, removeStudentsFromBatch, saveBatch, setBatchStatus,
} from "@/lib/catalog.functions";
import {
  downloadBatchTemplate, exportBatchesCsv, exportBatchesPdf, exportBatchesXlsx, parseImportFile, printTable,
} from "@/lib/catalog.export";
import {
  BATCH_MODES, BATCH_SESSIONS, BATCH_STATUSES, B_STATUS_CLASS, B_STATUS_LABEL, WEEK_DAYS,
  batchSchema, fmtDate, fmtTime,
} from "@/lib/courses.shared";

export const Route = createFileRoute("/_authenticated/dashboard/batches")({
  head: () => ({
    meta: [
      { title: "Batches Management · KCC ERP" },
      { name: "description", content: "Schedule batches, assign teachers and students, and track capacity across every Krishna Computer Center branch." },
      { property: "og:title", content: "Batches Management · KCC ERP" },
      { property: "og:description", content: "Batch scheduling and student allocation for Krishna Computer Center ERP." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BatchesPage,
});

type Filters = {
  q: string; branchId: string; courseId: string; teacherId: string; status: string; session: string;
  page: number; pageSize: number; sortBy: "created_at" | "name" | "code" | "start_date"; sortDir: "asc" | "desc";
};
const initial: Filters = {
  q: "", branchId: "all", courseId: "all", teacherId: "all", status: "all", session: "all",
  page: 1, pageSize: 10, sortBy: "created_at", sortDir: "desc",
};

const emptyBatch: any = {
  name: "", code: "", course_id: "", branch_id: "", teacher_id: "", session: "Morning",
  start_date: "", end_date: "", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], start_time: "", end_time: "",
  capacity: 30, room_number: "", mode: "offline", status: "upcoming", remarks: "",
};

function BatchesPage() {
  const fetchList = useServerFn(listBatches);
  const fetchStats = useServerFn(batchStats);
  const fetchExport = useServerFn(exportBatches);
  const save = useServerFn(saveBatch);
  const remove = useServerFn(deleteBatches);
  const setStatus = useServerFn(setBatchStatus);
  const runImport = useServerFn(importBatches);
  const getBranches = useServerFn(listBranchesPublic);
  const getCourses = useServerFn(listCoursesPublic);
  const getTeachers = useServerFn(listTeacherOptions);
  const getBatchStudents = useServerFn(listBatchStudents);
  const getAssignable = useServerFn(listAssignableStudents);
  const assign = useServerFn(assignStudentsToBatch);
  const unassign = useServerFn(removeStudentsFromBatch);

  const [filters, setFilters] = useState<Filters>(initial);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<null | { ids: string[] }>(null);
  const [manage, setManage] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await fetchList({ data: filters });
      setRows(res.rows);
      setTotal(res.total);
      setStats(await fetchStats({} as any));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [fetchList, fetchStats, filters]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    void (async () => {
      try {
        const [b, c, t] = await Promise.all([getBranches({} as any), getCourses({} as any), getTeachers({} as any)]);
        setBranches(b as any[]); setCourses(c as any[]); setTeachers(t as any[]);
      } catch { /* dropdowns stay empty */ }
    })();
  }, [getBranches, getCourses, getTeachers]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));

  const bulk = async (fn: () => Promise<any>, msg: string) => {
    try { await fn(); toast.success(msg); setSelected([]); await refresh(); }
    catch (e: any) { toast.error(e?.message ?? "Action failed"); }
  };

  const onSave = async () => {
    setErrors({});
    const parsed = batchSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      await save({ data: parsed.data as any });
      toast.success(form.id ? "Batch updated" : "Batch created");
      setForm(null);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const doExport = async (kind: "xlsx" | "csv" | "pdf" | "print") => {
    try {
      const data: any[] = await fetchExport({ data: filters });
      if (!data.length) return toast.error("Nothing to export");
      if (kind === "xlsx") exportBatchesXlsx(data);
      if (kind === "csv") exportBatchesCsv(data);
      if (kind === "pdf") exportBatchesPdf(data);
      if (kind === "print") printTable("Batches", data, "batches");
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  };

  const onImport = async (file: File) => {
    try {
      const parsed = await parseImportFile(file);
      if (!parsed.length) return toast.error("The file has no rows");
      const res: any = await runImport({ data: { rows: parsed } });
      toast.success(`Imported ${res.ok} batch(es)${res.failed ? `, ${res.failed} failed` : ""}`);
      if (res.errors?.length) console.warn(res.errors);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    }
  };

  return (
    <DashboardShell
      title="Batches"
      subtitle="Schedules, teacher allocation, capacity and student assignment"
      actions={
        <>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-ink"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => { setErrors({}); setForm({ ...emptyBatch }); }} className="inline-flex items-center gap-2 rounded-xl gradient-brand px-4 py-2 text-sm font-bold text-white shadow-brand"><Plus className="h-4 w-4" /> Add Batch</button>
        </>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Stat label="Total" value={stats?.total} icon={Layers} />
        <Stat label="Running" value={stats?.running} icon={PlayCircle} />
        <Stat label="Upcoming" value={stats?.upcoming} icon={CalendarClock} />
        <Stat label="Completed" value={stats?.completed} icon={CheckCircle2} />
        <Stat label="Morning" value={stats?.morning} icon={Sunrise} />
        <Stat label="Afternoon" value={stats?.afternoon} icon={Sun} />
        <Stat label="Evening" value={stats?.evening} icon={Sunset} />
        <Stat label="Weekend" value={stats?.weekend} icon={CalendarDays} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3 shadow-soft">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search batch name, code or room…" className="w-full rounded-xl border border-border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>
        <Sel value={filters.branchId} onChange={(v) => set({ branchId: v })} options={[["all", "All Branches"], ...branches.map((b) => [b.id, b.name] as [string, string])]} />
        <Sel value={filters.courseId} onChange={(v) => set({ courseId: v })} options={[["all", "All Courses"], ...courses.map((c) => [c.id, c.name] as [string, string])]} />
        <Sel value={filters.teacherId} onChange={(v) => set({ teacherId: v })} options={[["all", "All Teachers"], ...teachers.map((t) => [t.id, t.full_name] as [string, string])]} />
        <Sel value={filters.status} onChange={(v) => set({ status: v })} options={[["all", "All Status"], ...BATCH_STATUSES.map((s) => [s, B_STATUS_LABEL[s]!] as [string, string])]} />
        <Sel value={filters.session} onChange={(v) => set({ session: v })} options={[["all", "All Timings"], ...BATCH_SESSIONS.map((s) => [s, s] as [string, string])]} />
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImport(f); e.target.value = ""; }} />
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold"><Upload className="h-4 w-4" /> Import</button>
        <button onClick={() => downloadBatchTemplate()} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">Template</button>
        <button onClick={() => void doExport("xlsx")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Excel</button>
        <button onClick={() => void doExport("csv")} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">CSV</button>
        <button onClick={() => void doExport("pdf")} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">PDF</button>
        <button onClick={() => void doExport("print")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold"><Printer className="h-4 w-4" /> Print</button>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-cyan-soft px-4 py-2 text-sm">
          <span className="font-semibold text-brand">{selected.length} selected</span>
          {BATCH_STATUSES.map((s) => (
            <button key={s} onClick={() => void bulk(() => setStatus({ data: { ids: selected, status: s } }), `Marked ${B_STATUS_LABEL[s]}`)} className="rounded-lg bg-white px-3 py-1 font-semibold">{B_STATUS_LABEL[s]}</button>
          ))}
          <button onClick={() => setConfirm({ ids: selected })} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 font-semibold text-white"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-cyan-soft/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3"><input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} /></th>
                <th className="px-3 py-3">Batch Code</th>
                <th className="px-3 py-3">Batch Name</th>
                <th className="px-3 py-3">Course</th>
                <th className="px-3 py-3">Teacher</th>
                <th className="px-3 py-3">Branch</th>
                <th className="px-3 py-3">Session</th>
                <th className="px-3 py-3">Timing</th>
                <th className="px-3 py-3">Capacity</th>
                <th className="px-3 py-3">Students</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={12} className="px-3 py-3"><div className="h-6 animate-pulse rounded bg-slate-100" /></td></tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={12} className="px-3 py-12 text-center text-muted-foreground">No batches yet — click “Add Batch” to schedule one.</td></tr>
              )}
              {!loading && rows.map((r) => (
                <tr key={r.id} className="hover:bg-cyan-soft/30">
                  <td className="px-3 py-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))} /></td>
                  <td className="px-3 py-3 font-mono text-xs font-semibold text-brand">{r.code}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{r.name}<div className="text-xs font-normal text-muted-foreground">{fmtDate(r.start_date)} → {fmtDate(r.end_date)}</div></td>
                  <td className="px-3 py-3">{r.course?.name ?? "—"}</td>
                  <td className="px-3 py-3">{r.teacher?.full_name ?? <span className="text-muted-foreground">Unassigned</span>}</td>
                  <td className="px-3 py-3">{r.branch?.name ?? "—"}</td>
                  <td className="px-3 py-3">{r.session ?? "—"}</td>
                  <td className="px-3 py-3">{fmtTime(r.start_time)} – {fmtTime(r.end_time)}</td>
                  <td className="px-3 py-3">{r.capacity}</td>
                  <td className="px-3 py-3">
                    <span className={`font-semibold ${Number(r.current_strength) >= Number(r.capacity) ? "text-red-600" : "text-ink"}`}>{r.current_strength}</span>
                    <span className="text-muted-foreground"> / {r.capacity}</span>
                  </td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${B_STATUS_CLASS[r.status] ?? ""}`}>{B_STATUS_LABEL[r.status] ?? r.status}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn title="Manage students" onClick={() => setManage(r)}><Users className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Edit" onClick={() => { setErrors({}); setForm({ ...emptyBatch, ...r, teacher_id: r.teacher_id ?? "", days: r.days ?? [], start_time: r.start_time?.slice(0, 5) ?? "", end_time: r.end_time?.slice(0, 5) ?? "", start_date: r.start_date ?? "", end_date: r.end_date ?? "" }); }}><Pencil className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Delete" onClick={() => setConfirm({ ids: [r.id] })}><Trash2 className="h-4 w-4 text-red-600" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">{total} batch(es) · {stats?.students ?? 0} students allocated</span>
          <div className="flex items-center gap-2">
            <select value={filters.pageSize} onChange={(e) => set({ pageSize: Number(e.target.value) })} className="rounded-lg border border-border px-2 py-1 text-sm">
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="rounded-lg border border-border p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <span>{filters.page} / {pages}</span>
            <button disabled={filters.page >= pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="rounded-lg border border-border p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {form && (
        <Modal title={form.id ? "Edit Batch" : "Add Batch"} onClose={() => setForm(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Batch Name *" error={errors['name']}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp" /></Field>
            <Field label="Batch Code (auto if blank)"><input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} className="inp" /></Field>
            <Field label="Course *" error={errors['course_id']}>
              <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="inp"><option value="">Select course</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </Field>
            <Field label="Branch *" error={errors['branch_id']}>
              <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} className="inp"><option value="">Select branch</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            </Field>
            <Field label="Teacher"><select value={form.teacher_id ?? ""} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="inp"><option value="">Unassigned</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name} ({t.teacher_id})</option>)}</select></Field>
            <Field label="Session / Timing"><select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} className="inp">{BATCH_SESSIONS.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Start Date"><input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="inp" /></Field>
            <Field label="End Date" error={errors['end_date']}><input type="date" value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="inp" /></Field>
            <Field label="Start Time"><input type="time" value={form.start_time ?? ""} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="inp" /></Field>
            <Field label="End Time" error={errors['end_time']}><input type="time" value={form.end_time ?? ""} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="inp" /></Field>
            <Field label="Maximum Capacity" error={errors['capacity']}><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="inp" /></Field>
            <Field label="Current Strength"><input value={form.current_strength ?? 0} readOnly className="inp bg-slate-50" /></Field>
            <Field label="Room Number"><input value={form.room_number ?? ""} onChange={(e) => setForm({ ...form, room_number: e.target.value })} className="inp" /></Field>
            <Field label="Mode"><select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="inp">{BATCH_MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="inp">{BATCH_STATUSES.map((s) => <option key={s} value={s}>{B_STATUS_LABEL[s]}</option>)}</select></Field>
            <Field label="Class Days" full>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((d) => {
                  const on = (form.days ?? []).includes(d);
                  return (
                    <button key={d} type="button" onClick={() => setForm({ ...form, days: on ? form.days.filter((x: string) => x !== d) : [...(form.days ?? []), d] })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ${on ? "gradient-brand text-white ring-transparent" : "bg-white text-ink ring-border"}`}>{d}</button>
                  );
                })}
              </div>
            </Field>
            <Field label="Remarks" full><textarea rows={2} value={form.remarks ?? ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="inp" /></Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button disabled={saving} onClick={() => void onSave()} className="inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Batch
            </button>
          </div>
        </Modal>
      )}

      {manage && (
        <ManageStudents
          batch={manage}
          onClose={() => setManage(null)}
          onChanged={() => void refresh()}
          getBatchStudents={getBatchStudents}
          getAssignable={getAssignable}
          assign={assign}
          unassign={unassign}
        />
      )}

      {confirm && (
        <Modal title="Delete batch(es)?" onClose={() => setConfirm(null)} narrow>
          <p className="text-sm text-muted-foreground">Soft delete only — records remain in the database. Batches with assigned students must be emptied first.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setConfirm(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button onClick={() => { const ids = confirm.ids; setConfirm(null); void bulk(() => remove({ data: { ids } }), "Batch(es) deleted"); }} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white">Delete</button>
          </div>
        </Modal>
      )}
    </DashboardShell>
  );
}

function ManageStudents({ batch, onClose, onChanged, getBatchStudents, getAssignable, assign, unassign }: any) {
  const [enrolled, setEnrolled] = useState<any[]>([]);
  const [pool, setPool] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [a, b] = await Promise.all([
        getBatchStudents({ data: { batchId: batch.id } }),
        getAssignable({ data: { courseId: batch.course_id, branchId: batch.branch_id, q } }),
      ]);
      setEnrolled(a as any[]);
      setPool((b as any[]).filter((s) => s.batch_id !== batch.id));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load students");
    } finally {
      setBusy(false);
    }
  }, [batch.id, batch.course_id, batch.branch_id, q, getAssignable, getBatchStudents]);

  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<any>, msg: string) => {
    setBusy(true);
    try { await fn(); toast.success(msg); setPick([]); await load(); onChanged(); }
    catch (e: any) { toast.error(e?.message ?? "Action failed"); }
    finally { setBusy(false); }
  };

  const seats = Number(batch.capacity ?? 0) - enrolled.length;

  return (
    <Modal title={`Students · ${batch.name} (${batch.code})`} onClose={onClose}>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Badge>Capacity {batch.capacity}</Badge>
        <Badge>Enrolled {enrolled.length}</Badge>
        <Badge>{seats > 0 ? `${seats} seat(s) free` : "Batch full"}</Badge>
        {batch.teacher?.full_name && <Badge>Teacher: {batch.teacher.full_name}</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Enrolled students</h3>
            {pick.length > 0 && (
              <button disabled={busy} onClick={() => void run(() => unassign({ data: { studentIds: pick.filter((id) => enrolled.some((s) => s.id === id)) } }), "Removed from batch")}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white"><UserMinus className="h-3.5 w-3.5" /> Remove</button>
            )}
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {enrolled.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No students yet.</p>}
            {enrolled.map((s) => (
              <label key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-cyan-soft/40">
                <input type="checkbox" checked={pick.includes(s.id)} onChange={(e) => setPick((p) => (e.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id)))} />
                <span className="font-semibold text-ink">{s.full_name}</span>
                <span className="text-xs text-muted-foreground">{s.enrollment_no ?? s.student_code}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-3">
          <div className="mb-2 flex items-center gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="inp" />
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {busy && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
            {!busy && pool.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No matching students.</p>}
            {pool.map((s) => (
              <label key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-cyan-soft/40">
                <input type="checkbox" checked={pick.includes(s.id)} onChange={(e) => setPick((p) => (e.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id)))} />
                <span className="font-semibold text-ink">{s.full_name}</span>
                <span className="text-xs text-muted-foreground">{s.enrollment_no ?? s.student_code}</span>
                {s.batch_id && <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">in {s.batch?.code ?? "another batch"}</span>}
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={busy || pick.length === 0} onClick={() => void run(() => assign({ data: { batchId: batch.id, studentIds: pick } }), "Students assigned")}
              className="inline-flex items-center gap-1 rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"><UserPlus className="h-3.5 w-3.5" /> Assign</button>
            <button disabled={busy || pick.length === 0} onClick={() => void run(() => assign({ data: { batchId: batch.id, studentIds: pick, force: true } }), "Students transferred")}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold disabled:opacity-50"><ArrowLeftRight className="h-3.5 w-3.5" /> Transfer here</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-cyan-soft px-3 py-1 text-xs font-bold text-brand">{children}</span>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: number | undefined; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-soft text-brand"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-ink">{value ?? <span className="inline-block h-6 w-10 animate-pulse rounded bg-slate-100" />}</div>
    </div>
  );
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return <button title={title} onClick={onClick} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-white hover:bg-cyan-soft">{children}</button>;
}

function Field({ label, children, error, full }: { label: string; children: React.ReactNode; error?: string; full?: boolean }) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block font-semibold text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

function Modal({ title, children, onClose, narrow }: { title: string; children: React.ReactNode; onClose: () => void; narrow?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm">
      <div className={`my-8 w-full ${narrow ? "max-w-md" : "max-w-3xl"} rounded-2xl bg-white p-6 shadow-brand`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-soft text-brand"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}