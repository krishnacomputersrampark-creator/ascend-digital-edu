import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Download, Loader2, Users } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listStudents, listBranchesPublic, listCoursesPublic } from "@/lib/admissions.functions";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_authenticated/dashboard/students")({
  head: () => ({ meta: [{ title: "Students · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: StudentsPage,
});

type Row = Awaited<ReturnType<typeof listStudents>>[number];

function StudentsPage() {
  const fetchList = useServerFn(listStudents);
  const fetchBranches = useServerFn(listBranchesPublic);
  const fetchCourses = useServerFn(listCoursesPublic);

  const [rows, setRows] = useState<Row[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "passed_out" | "dropped">("active");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchList({ data: { q, branch_id: branch || undefined, course_id: course || undefined, status } });
      setRows(data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBranches().then(setBranches);
    fetchCourses().then(setCourses);
  }, [fetchBranches, fetchCourses]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [branch, course, status]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter(r => r.status === "active").length,
  }), [rows]);

  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <DashboardShell
      title="Students"
      subtitle="Master directory across all branches and batches."
      actions={
        <button onClick={exportXlsx} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft">
          <Download className="h-4 w-4" /> Export
        </button>
      }
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Showing" value={stats.total} icon={Users} />
        <StatCard label="Active" value={stats.active} icon={Users} />
        <StatCard label="Branches" value={branches.length} icon={Users} />
        <StatCard label="Courses" value={courses.length} icon={Users} />
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-soft">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search by name, code, phone…" className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="rounded-full border border-border bg-white px-4 py-2 text-sm">
            <option value="">All branches</option>
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={course} onChange={(e) => setCourse(e.target.value)} className="rounded-full border border-border bg-white px-4 py-2 text-sm">
            <option value="">All courses</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="rounded-full border border-border bg-white px-4 py-2 text-sm">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="passed_out">Passed out</option>
            <option value="dropped">Dropped</option>
          </select>
          <button onClick={load} className="rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-brand">Apply</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-cyan-soft/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
              <tr>
                <th className="px-4 py-3">Enrollment</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="py-14 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="py-14 text-center text-muted-foreground">No students yet. Approve an admission to enroll one.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-cyan-soft/30">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-brand-dark">{r.enrollment_no}</div>
                    <div className="text-[11px] text-muted-foreground">{r.student_code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.joined_at ? new Date(r.joined_at as string).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}

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