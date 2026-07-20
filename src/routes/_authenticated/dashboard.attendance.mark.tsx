import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, CheckCheck, XCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listBranchesPublic, listCoursesPublic, listBatchesPublic } from "@/lib/admissions.functions";
import { listStudentsForAttendance, listAttendanceForDate, saveAttendance, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/attendance.functions";

export const Route = createFileRoute("/_authenticated/dashboard/attendance/mark")({
  head: () => ({ meta: [{ title: "Mark Attendance · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: MarkAttendancePage,
});

type Student = { id: string; student_code: string; enrollment_no: string; full_name: string };
type Entry = { status: AttendanceStatus; remarks: string; check_in_time: string; check_out_time: string };

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present", absent: "Absent", late: "Late", half_day: "Half Day", leave: "Leave", holiday: "Holiday",
};
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  absent: "bg-red-100 text-red-700 border-red-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
  half_day: "bg-orange-100 text-orange-700 border-orange-300",
  leave: "bg-blue-100 text-blue-700 border-blue-300",
  holiday: "bg-slate-100 text-slate-700 border-slate-300",
};

function MarkAttendancePage() {
  const fetchBranches = useServerFn(listBranchesPublic);
  const fetchCourses = useServerFn(listCoursesPublic);
  const fetchBatches = useServerFn(listBatchesPublic);
  const fetchStudents = useServerFn(listStudentsForAttendance);
  const fetchExisting = useServerFn(listAttendanceForDate);
  const save = useServerFn(saveAttendance);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { fetchBranches().then(setBranches); fetchCourses().then(setCourses); }, [fetchBranches, fetchCourses]);
  useEffect(() => {
    fetchBatches({ data: { branch_id: branch || undefined, course_id: course || undefined } }).then(setBatches);
  }, [branch, course, fetchBatches]);

  const loadStudents = async () => {
    if (!branch && !course && !batch) { toast.error("Select at least one filter"); return; }
    setLoading(true);
    try {
      const [list, existing] = await Promise.all([
        fetchStudents({ data: { branch_id: branch || undefined, course_id: course || undefined, batch_id: batch || undefined } }),
        fetchExisting({ data: { date, branch_id: branch || undefined, course_id: course || undefined, batch_id: batch || undefined } }),
      ]);
      setStudents(list as Student[]);
      const map: Record<string, Entry> = {};
      (list as Student[]).forEach((s) => {
        const e = (existing as any[]).find((x) => x.student_id === s.id);
        map[s.id] = {
          status: (e?.status as AttendanceStatus) ?? "present",
          remarks: e?.remarks ?? "",
          check_in_time: e?.check_in_time ?? "",
          check_out_time: e?.check_out_time ?? "",
        };
      });
      setEntries(map);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const setAll = (status: AttendanceStatus) => {
    const next: Record<string, Entry> = {};
    students.forEach((s) => { next[s.id] = { ...(entries[s.id] ?? { remarks: "", check_in_time: "", check_out_time: "" } as Entry), status }; });
    setEntries(next);
  };

  const handleSave = async () => {
    if (new Date(date) > new Date(today)) { toast.error("Cannot mark attendance for a future date"); return; }
    if (students.length === 0) { toast.error("Load students first"); return; }
    setSaving(true);
    try {
      const payload = {
        date,
        branch_id: branch || null,
        course_id: course || null,
        batch_id: batch || null,
        entries: students.map((s) => ({
          student_id: s.id,
          status: entries[s.id]?.status ?? "present",
          remarks: entries[s.id]?.remarks || null,
          check_in_time: entries[s.id]?.check_in_time || null,
          check_out_time: entries[s.id]?.check_out_time || null,
        })),
      };
      const res = await save({ data: payload as any });
      toast.success(`Attendance saved (${res.count} records)`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(
    () => students.filter((s) => !q || s.full_name.toLowerCase().includes(q.toLowerCase()) || s.student_code.toLowerCase().includes(q.toLowerCase())),
    [students, q],
  );

  return (
    <DashboardShell
      title="Mark Attendance"
      subtitle="Select filters, load the class roster, then mark and save."
    >
      <section className="rounded-2xl border bg-white p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Date</label>
            <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Course</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">All courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Batch</label>
            <select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">All batches</option>
              {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={loadStudents} disabled={loading} className="w-full rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Load Students"}
            </button>
          </div>
        </div>
      </section>

      {students.length > 0 && (
        <section className="mt-5 rounded-2xl border bg-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              <span className="text-sm font-semibold">{filtered.length} of {students.length} students</span>
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="rounded-full border px-4 py-1.5 text-sm" />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setAll("present")} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700"><CheckCheck className="h-3 w-3" /> All Present</button>
              <button onClick={() => setAll("absent")} className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"><XCircle className="h-3 w-3" /> All Absent</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1 rounded-full gradient-brand px-4 py-1.5 text-xs font-semibold text-white shadow-brand disabled:opacity-60">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Attendance
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cyan-soft/40 text-left text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Check-in</th>
                  <th className="p-3">Check-out</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const e = entries[s.id] ?? { status: "present" as AttendanceStatus, remarks: "", check_in_time: "", check_out_time: "" };
                  return (
                    <tr key={s.id} className="border-t hover:bg-cyan-soft/20">
                      <td className="p-3 font-semibold text-ink">{s.full_name}</td>
                      <td className="p-3 text-muted-foreground">{s.student_code}</td>
                      <td className="p-3">
                        <select
                          value={e.status}
                          onChange={(ev) => setEntries((p) => ({ ...p, [s.id]: { ...e, status: ev.target.value as AttendanceStatus } }))}
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold ${STATUS_COLOR[e.status]}`}
                        >
                          {ATTENDANCE_STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
                        </select>
                      </td>
                      <td className="p-3"><input type="time" value={e.check_in_time} onChange={(ev) => setEntries((p) => ({ ...p, [s.id]: { ...e, check_in_time: ev.target.value } }))} className="rounded-lg border px-2 py-1 text-xs" /></td>
                      <td className="p-3"><input type="time" value={e.check_out_time} onChange={(ev) => setEntries((p) => ({ ...p, [s.id]: { ...e, check_out_time: ev.target.value } }))} className="rounded-lg border px-2 py-1 text-xs" /></td>
                      <td className="p-3"><input value={e.remarks} onChange={(ev) => setEntries((p) => ({ ...p, [s.id]: { ...e, remarks: ev.target.value } }))} placeholder="—" className="w-full rounded-lg border px-2 py-1 text-xs" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {students.length === 0 && !loading && (
        <div className="mt-6 rounded-2xl border bg-white p-10 text-center text-sm text-muted-foreground shadow-soft">
          Select a branch / course / batch and click <b>Load Students</b> to begin.
        </div>
      )}
    </DashboardShell>
  );
}