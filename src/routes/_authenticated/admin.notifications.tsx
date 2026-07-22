import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { Send, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  sendNotification, listBranchesLite, listCoursesLite, listBatchesLite, searchStudentsLite,
  type NotificationScope,
} from "@/lib/admin.repo";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({ meta: [{ title: "Notification Center · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: NotificationCenter,
});

const TYPES = [
  { v: "announcement", label: "Announcement" },
  { v: "reminder", label: "Reminder" },
  { v: "fee_alert", label: "Fee Alert" },
  { v: "result", label: "Result" },
  { v: "attendance", label: "Attendance" },
  { v: "general", label: "General Notice" },
];

function NotificationCenter() {
  const [scopeKind, setScopeKind] = useState<NotificationScope["kind"]>("all");
  const [branchId, setBranchId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<any[]>([]);

  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("announcement");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listBranchesLite().then(setBranches);
    listCoursesLite().then(setCourses);
    listBatchesLite().then(setBatches);
  }, []);

  useEffect(() => {
    if (!studentQuery.trim()) { setStudentResults([]); return; }
    const t = setTimeout(() => searchStudentsLite(studentQuery).then(setStudentResults), 200);
    return () => clearTimeout(t);
  }, [studentQuery]);

  const build = (): NotificationScope | null => {
    if (scopeKind === "all") return { kind: "all" };
    if (scopeKind === "branch") return branchId ? { kind: "branch", branch_id: branchId } : null;
    if (scopeKind === "course") return courseId ? { kind: "course", course_id: courseId } : null;
    if (scopeKind === "batch") return batchId ? { kind: "batch", batch_id: batchId } : null;
    if (scopeKind === "student") return studentId ? { kind: "student", student_id: studentId } : null;
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scope = build();
    if (!scope) return toast.error("Choose a target for this notification.");
    if (!title.trim()) return toast.error("Title is required.");
    setBusy(true);
    try {
      const res = await sendNotification({ title, description, type, link: link || undefined, scope });
      toast.success(`Notification sent to ${res.inserted} recipient(s).`);
      setTitle(""); setDescription(""); setLink("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send notification.");
    } finally { setBusy(false); }
  };

  return (
    <DashboardShell title="Notification Center" subtitle="Broadcast to students by scope">
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={140} className="input" placeholder="e.g. Diwali holiday — 3 Nov" />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input" placeholder="Details students will see in-app." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="input">
                {TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Deep link (optional)">
              <input value={link} onChange={(e) => setLink(e.target.value)} className="input" placeholder="/student-dashboard/fees" />
            </Field>
          </div>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send notification
          </button>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="text-sm font-bold text-ink">Target</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(["all", "branch", "course", "batch", "student"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setScopeKind(k)} className={`rounded-xl border px-3 py-2 font-semibold capitalize ${scopeKind === k ? "border-brand bg-cyan-soft text-brand" : "border-border text-ink/70"}`}>
                {k === "all" ? "All students" : k}
              </button>
            ))}
          </div>

          {scopeKind === "branch" && (
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input">
              <option value="">Choose branch…</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {scopeKind === "course" && (
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input">
              <option value="">Choose course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {scopeKind === "batch" && (
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="input">
              <option value="">Choose batch…</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {scopeKind === "student" && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Search by name, code, enrollment" className="input pl-9" />
              </div>
              {studentResults.length > 0 && (
                <ul className="max-h-56 overflow-auto rounded-xl border border-border">
                  {studentResults.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => { setStudentId(s.id); setStudentQuery(s.full_name); setStudentResults([]); }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-cyan-soft ${studentId === s.id ? "bg-cyan-soft" : ""}`}>
                        <span className="font-semibold">{s.full_name}</span>
                        <span className="text-xs text-muted-foreground">{s.student_code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {studentId && <div className="rounded-lg bg-cyan-soft px-3 py-2 text-xs text-brand-dark">Selected student ID: <span className="font-mono">{studentId}</span></div>}
            </div>
          )}
        </div>
      </form>
      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:#fff;border-radius:0.75rem;padding:0.55rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px rgba(6,182,212,0.25)}`}</style>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}