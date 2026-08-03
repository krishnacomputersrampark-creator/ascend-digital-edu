import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Search, Check, X, UserPlus, Download, Loader2, Eye, Printer, FileSpreadsheet,
  FileText, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, User,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import {
  listAdmissions,
  updateAdmissionStatus,
  convertAdmissionToStudent,
  admissionStats,
  listBranchesPublic,
  listCoursesPublic,
} from "@/lib/admissions.functions";
import {
  exportAdmissionsExcel, exportAdmissionsCsv, exportAdmissionsPdf, downloadApplicationPdf,
} from "@/lib/admissions.pdf";

export const Route = createFileRoute("/_authenticated/dashboard/admissions/")({
  head: () => ({ meta: [{ title: "Admissions · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: AdmissionsPage,
});

type Row = Awaited<ReturnType<typeof listAdmissions>>[number];
type Branch = Awaited<ReturnType<typeof listBranchesPublic>>[number];
type Course = Awaited<ReturnType<typeof listCoursesPublic>>[number];
const PAGE_SIZE = 10;

function AdmissionsPage() {
  const fetchList = useServerFn(listAdmissions);
  const fetchBranches = useServerFn(listBranchesPublic);
  const fetchCourses = useServerFn(listCoursesPublic);
  const fetchStats = useServerFn(admissionStats);
  const setStatus = useServerFn(updateAdmissionStatus);
  const convert = useServerFn(convertAdmissionToStudent);

  const [rows, setRows] = useState<Row[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof admissionStats>> | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "cancelled">("pending");
  const [branchId, setBranchId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<{ key: "full_name" | "created_at" | "status"; dir: "asc" | "desc" }>({ key: "created_at", dir: "desc" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([
        fetchList({ data: { status, q, branch_id: branchId || undefined, course_id: courseId || undefined, from: from || undefined, to: to || undefined } }),
        fetchStats(),
      ]);
      setRows(data);
      setStats(s);
      setPage(1);
    } catch (e: any) { toast.error(e?.message ?? "Failed to load admissions"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBranches().then(setBranches).catch(() => {});
    fetchCourses().then(setCourses).catch(() => {});
  }, [fetchBranches, fetchCourses]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, branchId, courseId, from, to]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a: any, b: any) => {
      const av = String(a[sort.key] ?? ""); const bv = String(b[sort.key] ?? "");
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return arr;
  }, [rows, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const toggleSort = (key: typeof sort.key) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  const act = async (fn: () => Promise<any>, id: string) => {
    setBusyId(id);
    try { await fn(); toast.success("Updated"); await load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusyId(null); }
  };

  const confirmAct = (message: string, fn: () => Promise<any>, id: string) => {
    if (!window.confirm(message)) return;
    void act(fn, id);
  };

  return (
    <DashboardShell
      title="Admissions"
      subtitle="Review, approve and convert online applications into enrolled students."
      actions={
        <div className="flex flex-wrap gap-2 print:hidden">
          <button onClick={() => exportAdmissionsExcel(sorted)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-soft hover:-translate-y-0.5 transition">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={() => exportAdmissionsCsv(sorted)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-soft">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => exportAdmissionsPdf(sorted)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-soft">
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-soft">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      }
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending", value: stats?.pending ?? 0, color: "from-amber-500 to-orange-500" },
          { label: "Approved", value: stats?.approved ?? 0, color: "from-emerald-500 to-teal-500" },
          { label: "Rejected", value: stats?.rejected ?? 0, color: "from-rose-500 to-red-500" },
          { label: "Today", value: stats?.today ?? 0, color: "from-blue-500 to-cyan-500" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-white p-4 shadow-soft">
            <div className={`inline-flex rounded-lg bg-gradient-to-br ${s.color} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white`}>{s.label}</div>
            <div className="mt-2 text-2xl font-extrabold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <MiniReport title="Branch wise" data={stats?.byBranch ?? []} />
        <MiniReport title="Course wise" data={stats?.byCourse ?? []} />
        <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark">Summary</h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Total applications</dt><dd className="font-semibold">{stats?.total ?? 0}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">This month</dt><dd className="font-semibold">{stats?.thisMonth ?? 0}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Approval ratio</dt><dd className="font-semibold">{stats?.approvalRatio ?? 0}%</dd></div>
          </dl>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-soft">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4 print:hidden">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search name, mobile or application no…"
              className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex gap-1 rounded-full bg-cyan-soft p-1">
            {(["pending","approved","rejected","all"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === s ? "gradient-brand text-white shadow-brand" : "text-brand-dark hover:bg-white"}`}>
                {s[0].toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-ink shadow-soft">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          <select value={branchId} onChange={e => setBranchId(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm">
            <option value="">All branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={courseId} onChange={e => setCourseId(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm">
            <option value="">All courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-cyan-soft/40 text-left text-[11px] uppercase tracking-wider text-ink/60">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Application ID</th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("full_name")}>
                  <span className="inline-flex items-center gap-1">Student <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-4 py-3">Father</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("status")}>
                  <span className="inline-flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("created_at")}>
                  <span className="inline-flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 w-full animate-pulse rounded bg-cyan-soft" /></td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={10} className="py-14 text-center text-muted-foreground">No admissions found.</td></tr>
              ) : paged.map((r: any) => (
                <tr key={r.id} className="hover:bg-cyan-soft/30">
                  <td className="px-4 py-3"><Avatar path={r.photo_url} name={r.full_name} /></td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-brand-dark">{r.application_no ?? r.admission_no}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{r.father_name || r.guardian_name || "—"}</td>
                  <td className="px-4 py-3">{r.phone}</td>
                  <td className="px-4 py-3 text-xs">{r.course?.name || r.course_preference || "—"}</td>
                  <td className="px-4 py-3 text-xs">{r.branch?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status as string} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at as string).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5 print:hidden">
                      <Link to="/dashboard/admissions/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-cyan-soft/50">
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                      <button onClick={() => downloadApplicationPdf(r)} title="Download application PDF" className="inline-flex items-center rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-cyan-soft/50">
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      {r.status === "pending" && (
                        <>
                          <button
                            disabled={busyId === r.id || branches.length === 0}
                            onClick={() => confirmAct(
                              `Approve ${r.full_name} and create a student record?`,
                              () => convert({ data: { id: r.id, branch_id: r.branch_id ?? branches[0].id } }),
                              r.id,
                            )}
                            className="inline-flex items-center gap-1 rounded-lg gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-brand disabled:opacity-50"
                            title="Approve and convert to Student"
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Enroll
                          </button>
                          <button
                            disabled={busyId === r.id}
                            onClick={() => confirmAct(`Reject ${r.full_name}? Add a reason on the detail page.`, () => setStatus({ data: { id: r.id, status: "rejected" } }), r.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {r.status !== "pending" && (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => act(() => setStatus({ data: { id: r.id, status: "pending" } }), r.id)}
                          className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs text-muted-foreground print:hidden">
          <span>Showing {paged.length} of {sorted.length} applications</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 font-semibold text-ink disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="font-semibold text-ink">Page {page} / {pageCount}</span>
            <button disabled={page >= pageCount} onClick={() => setPage(p => p + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 font-semibold text-ink disabled:opacity-40">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function MiniReport({ title, data }: { title: string; data: { name: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark">{title}</h3>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.slice(0, 5).map(d => (
            <li key={d.name} className="text-xs">
              <div className="flex justify-between"><span className="text-ink">{d.name}</span><span className="font-semibold">{d.count}</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cyan-soft">
                <div className="h-full gradient-brand" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Avatar({ path, name }: { path?: string | null; name?: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) { setUrl(null); return; }
    if (path.startsWith("http")) { setUrl(path); return; }
    supabase.storage.from("documents").createSignedUrl(path, 3600)
      .then(({ data }) => { if (alive) setUrl(data?.signedUrl ?? null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [path]);
  return url ? (
    <img src={url} alt={name ?? "Applicant photo"} className="h-9 w-9 rounded-full border border-border object-cover" />
  ) : (
    <div className="grid h-9 w-9 place-items-center rounded-full bg-cyan-soft text-brand-dark"><User className="h-4 w-4" /></div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    cancelled: "bg-slate-200 text-slate-700",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${map[status] ?? "bg-slate-100 text-slate-700"}`}>{status === "approved" && <Check className="h-3 w-3" />}{status}</span>;
}