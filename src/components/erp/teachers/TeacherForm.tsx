import { useState } from "react";
import { Loader2, Upload, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  BLOOD_GROUPS, DEPARTMENTS, DESIGNATIONS, GENDERS, TEACHER_STATUSES, TIMINGS, WEEK_DAYS,
  T_STATUS_LABEL, emptyTeacher, teacherSchema, type TeacherInput,
} from "@/lib/teachers.shared";
import { uploadTeacherFile } from "@/lib/teachers.storage";

const STEPS = ["Personal", "Contact", "Employment", "Documents", "Review"] as const;

const input = "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";
const label = "mb-1 block text-xs font-semibold text-ink";

function Field({ children, title, error }: { children: React.ReactNode; title: string; error?: string }) {
  return (
    <div>
      <span className={label}>{title}</span>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export type TeacherFormProps = {
  initial?: Partial<TeacherInput>;
  branches: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string; code?: string }>;
  batches: Array<{ id: string; name: string; code?: string }>;
  initialCourseIds?: string[];
  initialBatchIds?: string[];
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: TeacherInput, assignments: { courseIds: string[]; batchIds: string[] }) => void;
  onCancel?: () => void;
};

export function TeacherForm({
  initial, branches, courses, batches, initialCourseIds = [], initialBatchIds = [],
  submitting, submitLabel = "Save Teacher", onSubmit, onCancel,
}: TeacherFormProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<TeacherInput>({ ...emptyTeacher(), ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courseIds, setCourseIds] = useState<string[]>(initialCourseIds);
  const [batchIds, setBatchIds] = useState<string[]>(initialBatchIds);
  const [uploading, setUploading] = useState<string | null>(null);

  const set = (k: keyof TeacherInput, v: any) => setValues((s) => ({ ...s, [k]: v }));

  const days = String(values.working_days ?? "").split(",").filter(Boolean);
  const toggleDay = (d: string) =>
    set("working_days", (days.includes(d) ? days.filter((x) => x !== d) : [...days, d]).join(","));

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const validate = () => {
    const res = teacherSchema.safeParse(values);
    if (res.success) {
      setErrors({});
      return true;
    }
    const e: Record<string, string> = {};
    for (const i of res.error.issues) e[String(i.path[0])] = i.message;
    setErrors(e);
    return false;
  };

  const next = () => {
    if (step === 0 || step === 1) {
      const res = teacherSchema.safeParse(values);
      if (!res.success) {
        const keys = step === 0 ? ["full_name", "aadhaar_number", "pan_number"] : ["mobile", "alternate_mobile", "email", "pin_code"];
        const bad = res.error.issues.filter((i) => keys.includes(String(i.path[0])));
        if (bad.length) {
          const e: Record<string, string> = {};
          for (const i of bad) e[String(i.path[0])] = i.message;
          setErrors(e);
          toast.error(bad[0]!.message);
          return;
        }
      }
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const upload = async (key: keyof TeacherInput, file: File | null | undefined) => {
    if (!file) return;
    setUploading(String(key));
    try {
      set(key, await uploadTeacherFile(String(key).replace("_url", ""), file));
      toast.success("File uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const submit = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      setStep(0);
      return;
    }
    onSubmit(values, { courseIds, batchIds });
  };

  const FileRow = ({ k, title }: { k: keyof TeacherInput; title: string }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{values[k] ? String(values[k]) : "No file uploaded"}</div>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white">
        {uploading === String(k) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
        <input type="file" className="hidden" onChange={(e) => upload(k, e.target.files?.[0])} />
      </label>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <ol className="mb-6 flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                i === step ? "bg-brand text-white" : i < step ? "bg-cyan-soft text-brand" : "bg-slate-100 text-slate-500"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>} {s}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field title="Full Name *" error={errors['full_name']}>
            <input className={input} value={values.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
          </Field>
          <Field title="Father's Name">
            <input className={input} value={values.father_name ?? ""} onChange={(e) => set("father_name", e.target.value)} />
          </Field>
          <Field title="Mother's Name">
            <input className={input} value={values.mother_name ?? ""} onChange={(e) => set("mother_name", e.target.value)} />
          </Field>
          <Field title="Date of Birth">
            <input type="date" className={input} value={values.dob ?? ""} onChange={(e) => set("dob", e.target.value)} />
          </Field>
          <Field title="Gender">
            <select className={input} value={values.gender ?? ""} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Select</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field title="Blood Group">
            <select className={input} value={values.blood_group ?? ""} onChange={(e) => set("blood_group", e.target.value)}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field title="Aadhaar Number" error={errors['aadhaar_number']}>
            <input className={input} value={values.aadhaar_number ?? ""} onChange={(e) => set("aadhaar_number", e.target.value)} />
          </Field>
          <Field title="PAN Number" error={errors['pan_number']}>
            <input className={input} value={values.pan_number ?? ""} onChange={(e) => set("pan_number", e.target.value.toUpperCase())} />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field title="Mobile *" error={errors['mobile']}>
            <input className={input} value={values.mobile ?? ""} onChange={(e) => set("mobile", e.target.value)} />
          </Field>
          <Field title="Alternate Mobile" error={errors['alternate_mobile']}>
            <input className={input} value={values.alternate_mobile ?? ""} onChange={(e) => set("alternate_mobile", e.target.value)} />
          </Field>
          <Field title="Email" error={errors['email']}>
            <input className={input} value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field title="Address">
              <textarea rows={2} className={input} value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>
          <Field title="District">
            <input className={input} value={values.district ?? ""} onChange={(e) => set("district", e.target.value)} />
          </Field>
          <Field title="State">
            <input className={input} value={values.state ?? ""} onChange={(e) => set("state", e.target.value)} />
          </Field>
          <Field title="PIN Code" error={errors['pin_code']}>
            <input className={input} value={values.pin_code ?? ""} onChange={(e) => set("pin_code", e.target.value)} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field title="Qualification">
              <input className={input} value={values.qualification ?? ""} onChange={(e) => set("qualification", e.target.value)} />
            </Field>
            <Field title="Experience">
              <input className={input} placeholder="e.g. 5 years" value={values.experience ?? ""} onChange={(e) => set("experience", e.target.value)} />
            </Field>
            <Field title="Designation">
              <select className={input} value={values.designation ?? ""} onChange={(e) => set("designation", e.target.value)}>
                <option value="">Select</option>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field title="Department">
              <select className={input} value={values.department ?? ""} onChange={(e) => set("department", e.target.value)}>
                <option value="">Select</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field title="Branch">
              <select className={input} value={values.branch_id ?? ""} onChange={(e) => set("branch_id", e.target.value)}>
                <option value="">Select</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field title="Joining Date">
              <input type="date" className={input} value={values.joining_date ?? ""} onChange={(e) => set("joining_date", e.target.value)} />
            </Field>
            <Field title="Monthly Salary (₹)">
              <input type="number" min={0} className={input} value={String(values.salary ?? 0)} onChange={(e) => set("salary", e.target.value)} />
            </Field>
            <Field title="Preferred Timings">
              <select className={input} value={values.preferred_timings ?? ""} onChange={(e) => set("preferred_timings", e.target.value)}>
                <option value="">Select</option>
                {TIMINGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field title="Status">
              <select className={input} value={values.status ?? "active"} onChange={(e) => set("status", e.target.value)}>
                {TEACHER_STATUSES.map((s) => <option key={s} value={s}>{T_STATUS_LABEL[s]}</option>)}
              </select>
            </Field>
          </div>

          <Field title="Subjects Taught">
            <input className={input} placeholder="Comma separated, e.g. C, C++, Tally" value={values.subjects ?? ""} onChange={(e) => set("subjects", e.target.value)} />
          </Field>

          <div>
            <span className={label}>Working Days</span>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${days.includes(d) ? "bg-brand text-white" : "border border-border bg-white text-ink"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <span className={label}>Assigned Courses</span>
              <div className="max-h-44 space-y-1 overflow-auto rounded-xl border border-border p-2">
                {courses.length === 0 && <p className="p-2 text-xs text-muted-foreground">No courses available.</p>}
                {courses.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={courseIds.includes(c.id)} onChange={() => toggle(courseIds, setCourseIds, c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className={label}>Assigned Batches</span>
              <div className="max-h-44 space-y-1 overflow-auto rounded-xl border border-border p-2">
                {batches.length === 0 && <p className="p-2 text-xs text-muted-foreground">No batches available.</p>}
                {batches.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={batchIds.includes(b.id)} onChange={() => toggle(batchIds, setBatchIds, b.id)} />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Field title="Remarks">
            <textarea rows={2} className={input} value={values.remarks ?? ""} onChange={(e) => set("remarks", e.target.value)} />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FileRow k="photo_url" title="Passport Photo" />
          <FileRow k="aadhaar_url" title="Aadhaar Card" />
          <FileRow k="pan_url" title="PAN Card" />
          <FileRow k="qualification_url" title="Qualification Certificate" />
          <FileRow k="experience_url" title="Experience Certificate" />
          <FileRow k="signature_url" title="Signature" />
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {[
            ["Name", values.full_name], ["Mobile", values.mobile], ["Email", values.email],
            ["Designation", values.designation], ["Department", values.department],
            ["Qualification", values.qualification], ["Experience", values.experience],
            ["Joining Date", values.joining_date], ["Salary", values.salary],
            ["Subjects", values.subjects], ["Working Days", values.working_days],
            ["Timings", values.preferred_timings], ["Status", values.status],
            ["Courses", `${courseIds.length} selected`], ["Batches", `${batchIds.length} selected`],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-xl border border-border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">{k}</div>
              <div className="font-semibold text-ink">{v ? String(v) : "—"}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink">
          Cancel
        </button>
        <div className="flex items-center gap-2">
          <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-brand">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" disabled={submitting} onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}