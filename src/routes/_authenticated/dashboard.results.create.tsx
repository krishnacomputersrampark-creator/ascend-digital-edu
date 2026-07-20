import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listBranchesPublic, listCoursesPublic, listBatchesPublic } from "@/lib/admissions.functions";
import { saveExam, saveSubject, deleteSubject, listSubjects, EXAM_TYPES, EXAM_TYPE_LABEL } from "@/lib/results.functions";

export const Route = createFileRoute("/_authenticated/dashboard/results/create")({
  head: () => ({ meta: [{ title: "Create Exam · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: CreateExamPage,
});

function CreateExamPage() {
  const nav = useNavigate();
  const fnBranches = useServerFn(listBranchesPublic);
  const fnCourses = useServerFn(listCoursesPublic);
  const fnBatches = useServerFn(listBatchesPublic);
  const fnSaveExam = useServerFn(saveExam);
  const fnSubjects = useServerFn(listSubjects);
  const fnSaveSubject = useServerFn(saveSubject);
  const fnDelSubject = useServerFn(deleteSubject);

  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState({
    exam_name: "", exam_type: "monthly_test" as (typeof EXAM_TYPES)[number],
    course_id: "", batch_id: "", branch_id: "",
    exam_date: "", result_publish_date: "",
  });
  const [sub, setSub] = useState({ subject_code: "", subject_name: "", maximum_marks: 100, theory_marks: 70, practical_marks: 30, minimum_passing_marks: 40 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fnBranches().then(setBranches);
    fnCourses().then(setCourses);
    fnBatches().then(setBatches);
    fnSubjects().then(setSubjects);
  }, [fnBranches, fnCourses, fnBatches, fnSubjects]);

  const onCreateExam = async () => {
    if (!form.exam_name) return toast.error("Exam name is required");
    setSaving(true);
    try {
      const res = await fnSaveExam({ data: {
        exam_name: form.exam_name, exam_type: form.exam_type,
        course_id: form.course_id || null, batch_id: form.batch_id || null, branch_id: form.branch_id || null,
        exam_date: form.exam_date || null, result_publish_date: form.result_publish_date || null,
        status: "scheduled",
      } as any });
      toast.success("Exam created");
      nav({ to: "/dashboard/results/marks-entry", search: { exam_id: res.id } });
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const onAddSubject = async () => {
    if (!sub.subject_code || !sub.subject_name || !form.course_id) return toast.error("Select a course and fill subject fields");
    try {
      await fnSaveSubject({ data: { ...sub, course_id: form.course_id } as any });
      toast.success("Subject added");
      setSub({ subject_code: "", subject_name: "", maximum_marks: 100, theory_marks: 70, practical_marks: 30, minimum_passing_marks: 40 });
      setSubjects(await fnSubjects());
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const onDelSubject = async (id: string) => {
    if (!confirm("Delete subject?")) return;
    try { await fnDelSubject({ data: { id } }); setSubjects(await fnSubjects()); toast.success("Deleted"); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const filteredSubjects = subjects.filter(s => !form.course_id || s.course_id === form.course_id);

  const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <DashboardShell>
      <div className="mb-4"><Link to="/dashboard/results" className="text-xs font-semibold text-brand hover:underline">← Back to Results</Link></div>
      <h1 className="text-2xl font-black text-ink">Create Exam & Manage Subjects</h1>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur">
          <div className="mb-3 text-sm font-bold text-ink">Exam details</div>
          <div className="grid gap-3">
            <label className="text-xs font-semibold text-slate-600">Exam Name
              <input className={input} value={form.exam_name} onChange={e => setForm({...form, exam_name: e.target.value})} placeholder="e.g. Half Yearly – Nov 2026"/>
            </label>
            <label className="text-xs font-semibold text-slate-600">Type
              <select className={input} value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value as any})}>
                {EXAM_TYPES.map(t => <option key={t} value={t}>{EXAM_TYPE_LABEL[t]}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-600">Course
                <select className={input} value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})}>
                  <option value="">— Select —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Batch
                <select className={input} value={form.batch_id} onChange={e => setForm({...form, batch_id: e.target.value})}>
                  <option value="">— Any —</option>
                  {batches.filter(b => !form.course_id || b.course_id === form.course_id).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Branch
                <select className={input} value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})}>
                  <option value="">— Any —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Exam Date
                <input type="date" className={input} value={form.exam_date} onChange={e => setForm({...form, exam_date: e.target.value})}/>
              </label>
              <label className="text-xs font-semibold text-slate-600">Result Publish Date
                <input type="date" className={input} value={form.result_publish_date} onChange={e => setForm({...form, result_publish_date: e.target.value})}/>
              </label>
            </div>
            <button onClick={onCreateExam} disabled={saving} className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand py-2 text-sm font-semibold text-white shadow disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Save Exam & Go to Marks Entry
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white/70 p-4 backdrop-blur">
          <div className="mb-3 text-sm font-bold text-ink">Subjects for course</div>
          {!form.course_id && <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">Select a course above to manage its subjects.</div>}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input className={input} placeholder="Code (e.g. C01)" value={sub.subject_code} onChange={e => setSub({...sub, subject_code: e.target.value})}/>
            <input className={input} placeholder="Subject Name" value={sub.subject_name} onChange={e => setSub({...sub, subject_name: e.target.value})}/>
            <input type="number" className={input} placeholder="Max" value={sub.maximum_marks} onChange={e => setSub({...sub, maximum_marks: Number(e.target.value)})}/>
            <input type="number" className={input} placeholder="Passing" value={sub.minimum_passing_marks} onChange={e => setSub({...sub, minimum_passing_marks: Number(e.target.value)})}/>
            <input type="number" className={input} placeholder="Theory" value={sub.theory_marks} onChange={e => setSub({...sub, theory_marks: Number(e.target.value)})}/>
            <input type="number" className={input} placeholder="Practical" value={sub.practical_marks} onChange={e => setSub({...sub, practical_marks: Number(e.target.value)})}/>
          </div>
          <button onClick={onAddSubject} className="mt-2 flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"><PlusCircle className="h-4 w-4"/>Add subject</button>

          <div className="mt-4 max-h-72 overflow-auto rounded-xl border">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50"><tr><th className="p-2 text-left">Code</th><th className="p-2 text-left">Name</th><th className="p-2 text-right">Max</th><th></th></tr></thead>
              <tbody>
                {filteredSubjects.map(s => (
                  <tr key={s.id} className="border-t"><td className="p-2 font-mono">{s.subject_code}</td><td className="p-2">{s.subject_name}</td><td className="p-2 text-right">{s.maximum_marks}</td>
                    <td className="p-2"><button onClick={() => onDelSubject(s.id)} className="text-red-600 hover:underline"><Trash2 className="h-3.5 w-3.5"/></button></td></tr>
                ))}
                {!filteredSubjects.length && <tr><td colSpan={4} className="p-4 text-center text-slate-500">No subjects yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
