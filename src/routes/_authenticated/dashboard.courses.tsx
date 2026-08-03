import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen, CheckCircle2, PauseCircle, Briefcase, Landmark, Timer, Plus, Search, Download,
  Upload, Loader2, Pencil, Trash2, Copy, Archive, RefreshCw, Printer, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import {
  courseStats, deleteCourses, duplicateCourse, exportCourses, importCourses, listCourses,
  saveCourse, setCourseStatus,
} from "@/lib/catalog.functions";
import {
  downloadCourseTemplate, exportCoursesCsv, exportCoursesPdf, exportCoursesXlsx, parseImportFile, printTable,
} from "@/lib/catalog.export";
import {
  CERTIFICATE_TYPES, COURSE_CATEGORIES, COURSE_MODES, COURSE_STATUSES, C_STATUS_CLASS, C_STATUS_LABEL,
  DURATION_UNITS, MEDIUMS, SUPPORTED_COURSES, courseSchema, inr,
} from "@/lib/courses.shared";

export const Route = createFileRoute("/_authenticated/dashboard/courses")({
  head: () => ({
    meta: [
      { title: "Courses Management · KCC ERP" },
      { name: "description", content: "Create, edit and organise every Krishna Computer Center course, fee and certificate type." },
      { property: "og:title", content: "Courses Management · KCC ERP" },
      { property: "og:description", content: "Course catalogue management for Krishna Computer Center ERP." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoursesPage,
});

type Filters = {
  q: string; category: string; status: string; mode: string;
  page: number; pageSize: number; sortBy: "created_at" | "name" | "code" | "course_fee"; sortDir: "asc" | "desc";
};
const initial: Filters = { q: "", category: "all", status: "all", mode: "all", page: 1, pageSize: 10, sortBy: "created_at", sortDir: "desc" };

const emptyCourse: any = {
  name: "", code: "", short_name: "", category: "Computer Courses", description: "", duration: "",
  duration_unit: "months", hours: "", eligibility: "", medium: "Bilingual", certificate_type: "Institute",
  exam_pattern: "", study_material: "", training_partner: "", course_fee: 0, registration_fee: 0,
  exam_fee: 0, mode: "offline", syllabus_url: "", prospectus_url: "", thumbnail_url: "", status: "active",
};

function CoursesPage() {
  const fetchList = useServerFn(listCourses);
  const fetchStats = useServerFn(courseStats);
  const fetchExport = useServerFn(exportCourses);
  const save = useServerFn(saveCourse);
  const remove = useServerFn(deleteCourses);
  const status = useServerFn(setCourseStatus);
  const dup = useServerFn(duplicateCourse);
  const runImport = useServerFn(importCourses);

  const [filters, setFilters] = useState<Filters>(initial);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<null | { ids: string[] }>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await fetchList({ data: filters });
      setRows(res.rows);
      setTotal(res.total);
      setStats(await fetchStats({} as any));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [fetchList, fetchStats, filters]);

  useEffect(() => { void refresh(); }, [refresh]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));

  const onSave = async () => {
    setErrors({});
    const parsed = courseSchema.safeParse({ ...form, hours: form.hours === "" ? null : form.hours });
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
      toast.success(form.id ? "Course updated" : "Course created");
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
      if (kind === "xlsx") exportCoursesXlsx(data);
      if (kind === "csv") exportCoursesCsv(data);
      if (kind === "pdf") exportCoursesPdf(data);
      if (kind === "print") printTable("Courses", data, "courses");
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  };

  const onImport = async (file: File) => {
    try {
      const parsed = await parseImportFile(file);
      if (!parsed.length) return toast.error("The file has no rows");
      const res: any = await runImport({ data: { rows: parsed } });
      toast.success(`Imported ${res.ok} course(s)${res.failed ? `, ${res.failed} failed` : ""}`);
      if (res.errors?.length) console.warn(res.errors);
      await refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    }
  };

  const bulk = async (fn: () => Promise<any>, msg: string) => {
    try { await fn(); toast.success(msg); setSelected([]); await refresh(); }
    catch (e: any) { toast.error(e?.message ?? "Action failed"); }
  };

  return (
    <DashboardShell
      title="Courses"
      subtitle="Complete course catalogue, fees, certificates and study material"
      actions={
        <>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-ink"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={() => { setErrors({}); setForm({ ...emptyCourse }); }} className="inline-flex items-center gap-2 rounded-xl gradient-brand px-4 py-2 text-sm font-bold text-white shadow-brand"><Plus className="h-4 w-4" /> Add Course</button>
        </>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total Courses" value={stats?.total} icon={BookOpen} />
        <Stat label="Active" value={stats?.active} icon={CheckCircle2} />
        <Stat label="Inactive" value={stats?.inactive} icon={PauseCircle} />
        <Stat label="Job Oriented" value={stats?.jobOriented} icon={Briefcase} />
        <Stat label="Government" value={stats?.government} icon={Landmark} />
        <Stat label="Short Term" value={stats?.shortTerm} icon={Timer} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3 shadow-soft">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search course name or code…" className="w-full rounded-xl border border-border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>
        <Select value={filters.category} onChange={(v) => set({ category: v })} options={[["all", "All Categories"], ...COURSE_CATEGORIES.map((c) => [c, c] as [string, string])]} />
        <Select value={filters.status} onChange={(v) => set({ status: v })} options={[["all", "All Status"], ...COURSE_STATUSES.map((s) => [s, C_STATUS_LABEL[s]!] as [string, string])]} />
        <Select value={filters.mode} onChange={(v) => set({ mode: v })} options={[["all", "All Modes"], ...COURSE_MODES.map((m) => [m, m] as [string, string])]} />
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImport(f); e.target.value = ""; }} />
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold"><Upload className="h-4 w-4" /> Import</button>
        <button onClick={() => downloadCourseTemplate()} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">Template</button>
        <button onClick={() => void doExport("xlsx")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold"><Download className="h-4 w-4" /> Excel</button>
        <button onClick={() => void doExport("csv")} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">CSV</button>
        <button onClick={() => void doExport("pdf")} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">PDF</button>
        <button onClick={() => void doExport("print")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold"><Printer className="h-4 w-4" /> Print</button>
      </div>

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-cyan-soft px-4 py-2 text-sm">
          <span className="font-semibold text-brand">{selected.length} selected</span>
          <button onClick={() => void bulk(() => status({ data: { ids: selected, status: "active" } }), "Activated")} className="rounded-lg bg-white px-3 py-1 font-semibold">Activate</button>
          <button onClick={() => void bulk(() => status({ data: { ids: selected, status: "inactive" } }), "Deactivated")} className="rounded-lg bg-white px-3 py-1 font-semibold">Deactivate</button>
          <button onClick={() => void bulk(() => status({ data: { ids: selected, status: "archived" } }), "Archived")} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 font-semibold"><Archive className="h-3.5 w-3.5" /> Archive</button>
          <button onClick={() => setConfirm({ ids: selected })} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 font-semibold text-white"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-cyan-soft/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3"><input type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} /></th>
                <Th label="Course Code" k="code" filters={filters} setFilters={setFilters} />
                <Th label="Course Name" k="name" filters={filters} setFilters={setFilters} />
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Duration</th>
                <Th label="Course Fee" k="course_fee" filters={filters} setFilters={setFilters} />
                <th className="px-3 py-3">Reg. Fee</th>
                <th className="px-3 py-3">Exam Fee</th>
                <th className="px-3 py-3">Certificate</th>
                <th className="px-3 py-3">Mode</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={12} className="px-3 py-3"><div className="h-6 animate-pulse rounded bg-slate-100" /></td></tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={12} className="px-3 py-12 text-center text-muted-foreground">No courses found. Try “Add Course” — suggested: {SUPPORTED_COURSES.slice(0, 6).join(", ")}…</td></tr>
              )}
              {!loading && rows.map((r) => (
                <tr key={r.id} className="hover:bg-cyan-soft/30">
                  <td className="px-3 py-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))} /></td>
                  <td className="px-3 py-3 font-mono text-xs font-semibold text-brand">{r.code}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{r.name}<div className="text-xs font-normal text-muted-foreground">{r.short_name}</div></td>
                  <td className="px-3 py-3">{r.category ?? "—"}</td>
                  <td className="px-3 py-3">{r.duration ? (/[a-z]/i.test(r.duration) ? r.duration : `${r.duration} ${r.duration_unit}`) : "—"}</td>
                  <td className="px-3 py-3 font-semibold">{inr(r.course_fee)}</td>
                  <td className="px-3 py-3">{inr(r.registration_fee)}</td>
                  <td className="px-3 py-3">{inr(r.exam_fee)}</td>
                  <td className="px-3 py-3">{r.certificate_type ?? "—"}</td>
                  <td className="px-3 py-3 capitalize">{r.mode}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${C_STATUS_CLASS[r.status] ?? ""}`}>{C_STATUS_LABEL[r.status] ?? r.status}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn title="Edit" onClick={() => { setErrors({}); setForm({ ...emptyCourse, ...r, hours: r.hours ?? "" }); }}><Pencil className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Duplicate" onClick={() => void bulk(() => dup({ data: { id: r.id } }), "Course duplicated")}><Copy className="h-4 w-4" /></IconBtn>
                      <IconBtn title="Delete" onClick={() => setConfirm({ ids: [r.id] })}><Trash2 className="h-4 w-4 text-red-600" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">{total} course(s)</span>
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
        <Modal title={form.id ? "Edit Course" : "Add Course"} onClose={() => setForm(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Course Name *" error={errors['name']}>
              <input list="kcc-courses" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp" />
              <datalist id="kcc-courses">{SUPPORTED_COURSES.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Course Code (auto if blank)"><input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} className="inp" /></Field>
            <Field label="Short Name"><input value={form.short_name ?? ""} onChange={(e) => setForm({ ...form, short_name: e.target.value })} className="inp" /></Field>
            <Field label="Category *" error={errors['category']}>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="inp">{COURSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="Duration"><input value={form.duration ?? ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="12" className="inp" /></Field>
            <Field label="Duration Unit"><select value={form.duration_unit} onChange={(e) => setForm({ ...form, duration_unit: e.target.value })} className="inp">{DURATION_UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field>
            <Field label="Total Hours"><input type="number" value={form.hours ?? ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="inp" /></Field>
            <Field label="Medium"><select value={form.medium ?? ""} onChange={(e) => setForm({ ...form, medium: e.target.value })} className="inp"><option value="">—</option>{MEDIUMS.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Certificate Type"><select value={form.certificate_type ?? ""} onChange={(e) => setForm({ ...form, certificate_type: e.target.value })} className="inp"><option value="">—</option>{CERTIFICATE_TYPES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Mode"><select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="inp">{COURSE_MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Training Partner"><input value={form.training_partner ?? ""} onChange={(e) => setForm({ ...form, training_partner: e.target.value })} className="inp" /></Field>
            <Field label="Eligibility"><input value={form.eligibility ?? ""} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} className="inp" /></Field>
            <Field label="Course Fee (₹)"><input type="number" value={form.course_fee} onChange={(e) => setForm({ ...form, course_fee: e.target.value })} className="inp" /></Field>
            <Field label="Registration Fee (₹)"><input type="number" value={form.registration_fee} onChange={(e) => setForm({ ...form, registration_fee: e.target.value })} className="inp" /></Field>
            <Field label="Exam Fee (₹)"><input type="number" value={form.exam_fee} onChange={(e) => setForm({ ...form, exam_fee: e.target.value })} className="inp" /></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="inp">{COURSE_STATUSES.map((s) => <option key={s} value={s}>{C_STATUS_LABEL[s]}</option>)}</select></Field>
            <Field label="Exam Pattern" full><input value={form.exam_pattern ?? ""} onChange={(e) => setForm({ ...form, exam_pattern: e.target.value })} className="inp" /></Field>
            <Field label="Study Material" full><input value={form.study_material ?? ""} onChange={(e) => setForm({ ...form, study_material: e.target.value })} className="inp" /></Field>
            <Field label="Syllabus PDF URL"><input value={form.syllabus_url ?? ""} onChange={(e) => setForm({ ...form, syllabus_url: e.target.value })} className="inp" /></Field>
            <Field label="Prospectus PDF URL"><input value={form.prospectus_url ?? ""} onChange={(e) => setForm({ ...form, prospectus_url: e.target.value })} className="inp" /></Field>
            <Field label="Thumbnail URL" full><input value={form.thumbnail_url ?? ""} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className="inp" /></Field>
            <Field label="Description" full><textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="inp" /></Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button disabled={saving} onClick={() => void onSave()} className="inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Course
            </button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal title="Delete course(s)?" onClose={() => setConfirm(null)} narrow>
          <p className="text-sm text-muted-foreground">This performs a soft delete — records stay in the database and linked history is preserved. Courses with active batches cannot be deleted.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setConfirm(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
            <button onClick={() => { const ids = confirm.ids; setConfirm(null); void bulk(() => remove({ data: { ids } }), "Course(s) deleted"); }} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white">Delete</button>
          </div>
        </Modal>
      )}
    </DashboardShell>
  );
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Th({ label, k, filters, setFilters }: { label: string; k: Filters["sortBy"]; filters: Filters; setFilters: (f: (p: Filters) => Filters) => void }) {
  return (
    <th className="cursor-pointer select-none px-3 py-3" onClick={() => setFilters((f) => ({ ...f, sortBy: k, sortDir: f.sortBy === k && f.sortDir === "asc" ? "desc" : "asc" }))}>
      {label}{filters.sortBy === k ? (filters.sortDir === "asc" ? " ↑" : " ↓") : ""}
    </th>
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