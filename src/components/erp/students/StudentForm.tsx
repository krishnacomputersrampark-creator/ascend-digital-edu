import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { listBranchesPublic, listCoursesPublic, listBatchesPublic } from "@/lib/admissions.functions";
import { listFacultyOptions } from "@/lib/students.functions";
import { uploadStudentDocFile, uploadStudentPhotoFile } from "@/lib/students.client";
import {
  BLOOD_GROUPS,
  CATEGORIES,
  EMPTY_STUDENT,
  GENDERS,
  STUDENT_STATUSES,
  inr,
  netPayable,
  studentSchema,
  type StudentInput,
} from "@/lib/students.shared";

const STEPS = ["Personal", "Contact", "Academic", "Fees", "Documents"];

export function StudentForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<StudentInput>;
  submitLabel: string;
  onSubmit: (values: any) => Promise<void>;
}) {
  const fetchBranches = useServerFn(listBranchesPublic);
  const fetchCourses = useServerFn(listCoursesPublic);
  const fetchBatches = useServerFn(listBatchesPublic);
  const fetchFaculty = useServerFn(listFacultyOptions);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<StudentInput>({ ...EMPTY_STUDENT, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches().then(setBranches).catch(() => {});
    fetchCourses().then(setCourses).catch(() => {});
    fetchFaculty().then(setFaculty).catch(() => {});
  }, [fetchBranches, fetchCourses, fetchFaculty]);

  useEffect(() => {
    fetchBatches({ data: { branch_id: (values.branch_id as string) || undefined, course_id: (values.course_id as string) || undefined } })
      .then(setBatches)
      .catch(() => {});
  }, [fetchBatches, values.branch_id, values.course_id]);

  const set = (k: keyof StudentInput, v: any) => setValues((s) => ({ ...s, [k]: v }));

  const stepFields: Record<number, Array<keyof StudentInput>> = useMemo(
    () => ({
      0: ["full_name", "father_name", "mother_name", "date_of_birth", "gender", "category", "blood_group", "aadhaar_number"],
      1: ["phone", "alternate_mobile", "email", "address", "city", "district", "state", "pincode", "guardian_name", "guardian_phone"],
      2: ["branch_id", "course_id", "batch_id", "faculty_id", "roll_no", "joined_at", "status"],
      3: ["course_fee", "admission_fee", "registration_fee", "discount"],
      4: ["photo_url", "signature_url", "aadhaar_doc_url", "marksheet_url", "certificate_url"],
    }),
    [],
  );

  const validateStep = (index: number) => {
    const parsed = studentSchema.safeParse(values);
    const next: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (stepFields[index]!.includes(key as keyof StudentInput)) next[key] = issue.message;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    const parsed = studentSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (next[String(i.path[0])] = i.message));
      setErrors(next);
      const first = parsed.error.issues[0];
      const idx = Object.entries(stepFields).find(([, keys]) => keys.includes(String(first?.path[0]) as keyof StudentInput))?.[0];
      if (idx) setStep(Number(idx));
      toast.error(first?.message ?? "Please review the form.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(parsed.data);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the student.");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (field: keyof StudentInput, kind: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be smaller than 5 MB.");
      return;
    }
    setUploading(String(field));
    try {
      const path = kind === "photo" ? await uploadStudentPhotoFile(file) : await uploadStudentDocFile(kind, file);
      set(field, path);
      toast.success("Uploaded.");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white shadow-soft">
      <ol className="flex flex-wrap gap-2 border-b border-border p-4">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                i === step ? "gradient-brand text-white shadow-brand" : i < step ? "bg-cyan-soft text-brand-dark" : "border border-border text-muted-foreground"
              }`}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-[10px]">
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {step === 0 && (
          <>
            <Field label="Full name" required error={errors.full_name}>
              <input className={inputCls} value={values.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
            </Field>
            <Field label="Father's name" error={errors.father_name}>
              <input className={inputCls} value={values.father_name ?? ""} onChange={(e) => set("father_name", e.target.value)} />
            </Field>
            <Field label="Mother's name" error={errors.mother_name}>
              <input className={inputCls} value={values.mother_name ?? ""} onChange={(e) => set("mother_name", e.target.value)} />
            </Field>
            <Field label="Date of birth" error={errors.date_of_birth}>
              <input type="date" className={inputCls} value={values.date_of_birth ?? ""} onChange={(e) => set("date_of_birth", e.target.value)} />
            </Field>
            <Field label="Gender" error={errors.gender}>
              <select className={inputCls} value={values.gender ?? ""} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g[0]!.toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Category" error={errors.category}>
              <select className={inputCls} value={values.category ?? ""} onChange={(e) => set("category", e.target.value)}>
                <option value="">Select</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Blood group" error={errors.blood_group}>
              <select className={inputCls} value={values.blood_group ?? ""} onChange={(e) => set("blood_group", e.target.value)}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Aadhaar number" error={errors.aadhaar_number}>
              <input inputMode="numeric" maxLength={12} className={inputCls} value={values.aadhaar_number ?? ""} onChange={(e) => set("aadhaar_number", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Occupation" error={errors.occupation}>
              <input className={inputCls} value={values.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Mobile number" required error={errors.phone}>
              <input inputMode="numeric" maxLength={10} className={inputCls} value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Alternate mobile" error={errors.alternate_mobile}>
              <input inputMode="numeric" maxLength={10} className={inputCls} value={values.alternate_mobile ?? ""} onChange={(e) => set("alternate_mobile", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input type="email" className={inputCls} value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Address" error={errors.address} wide>
              <textarea rows={2} className={inputCls} value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="City" error={errors.city}>
              <input className={inputCls} value={values.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="District" error={errors.district}>
              <input className={inputCls} value={values.district ?? ""} onChange={(e) => set("district", e.target.value)} />
            </Field>
            <Field label="State" error={errors.state}>
              <input className={inputCls} value={values.state ?? ""} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="PIN code" error={errors.pincode}>
              <input inputMode="numeric" maxLength={6} className={inputCls} value={values.pincode ?? ""} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label="Guardian name" error={errors.guardian_name}>
              <input className={inputCls} value={values.guardian_name ?? ""} onChange={(e) => set("guardian_name", e.target.value)} />
            </Field>
            <Field label="Guardian phone" error={errors.guardian_phone}>
              <input className={inputCls} value={values.guardian_phone ?? ""} onChange={(e) => set("guardian_phone", e.target.value)} />
            </Field>
            <Field label="Emergency contact" error={errors.emergency_contact}>
              <input className={inputCls} value={values.emergency_contact ?? ""} onChange={(e) => set("emergency_contact", e.target.value)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Branch" error={errors.branch_id}>
              <select className={inputCls} value={values.branch_id ?? ""} onChange={(e) => set("branch_id", e.target.value)}>
                <option value="">Select branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Course" error={errors.course_id}>
              <select
                className={inputCls}
                value={values.course_id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  set("course_id", id);
                  const c = courses.find((x) => x.id === id);
                  if (c?.fees) set("course_fee", Number(c.fees));
                }}
              >
                <option value="">Select course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
              </select>
            </Field>
            <Field label="Batch" error={errors.batch_id}>
              <select className={inputCls} value={values.batch_id ?? ""} onChange={(e) => set("batch_id", e.target.value)}>
                <option value="">Select batch</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.timing ? ` · ${b.timing}` : ""}</option>)}
              </select>
            </Field>
            <Field label="Assigned faculty" error={errors.faculty_id}>
              <select className={inputCls} value={values.faculty_id ?? ""} onChange={(e) => set("faculty_id", e.target.value)}>
                <option value="">Unassigned</option>
                {faculty.map((f) => <option key={f.id} value={f.id}>{f.full_name || f.email}</option>)}
              </select>
            </Field>
            <Field label="Roll number" error={errors.roll_no}>
              <input className={inputCls} value={values.roll_no ?? ""} onChange={(e) => set("roll_no", e.target.value)} />
            </Field>
            <Field label="Joining date" error={errors.joined_at}>
              <input type="date" className={inputCls} value={values.joined_at ?? ""} onChange={(e) => set("joined_at", e.target.value)} />
            </Field>
            <Field label="Status" error={errors.status}>
              <select className={inputCls} value={values.status ?? "active"} onChange={(e) => set("status", e.target.value)}>
                {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{s[0]!.toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Course fee (₹)" error={errors.course_fee}>
              <input type="number" min={0} className={inputCls} value={Number(values.course_fee ?? 0)} onChange={(e) => set("course_fee", e.target.value)} />
            </Field>
            <Field label="Admission fee (₹)" error={errors.admission_fee}>
              <input type="number" min={0} className={inputCls} value={Number(values.admission_fee ?? 0)} onChange={(e) => set("admission_fee", e.target.value)} />
            </Field>
            <Field label="Registration fee (₹)" error={errors.registration_fee}>
              <input type="number" min={0} className={inputCls} value={Number(values.registration_fee ?? 0)} onChange={(e) => set("registration_fee", e.target.value)} />
            </Field>
            <Field label="Discount (₹)" error={errors.discount}>
              <input type="number" min={0} className={inputCls} value={Number(values.discount ?? 0)} onChange={(e) => set("discount", e.target.value)} />
            </Field>
            <div className="sm:col-span-2 lg:col-span-3 rounded-xl bg-cyan-soft/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net payable</div>
              <div className="text-2xl font-extrabold text-ink">
                {inr(netPayable({
                  course_fee: Number(values.course_fee ?? 0),
                  admission_fee: Number(values.admission_fee ?? 0),
                  registration_fee: Number(values.registration_fee ?? 0),
                  discount: Number(values.discount ?? 0),
                }))}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <FileField label="Passport photo" value={values.photo_url as string} busy={uploading === "photo_url"} accept="image/*" onPick={(f) => upload("photo_url", "photo", f)} />
            <FileField label="Signature" value={values.signature_url as string} busy={uploading === "signature_url"} accept="image/*" onPick={(f) => upload("signature_url", "signature", f)} />
            <FileField label="Aadhaar card" value={values.aadhaar_doc_url as string} busy={uploading === "aadhaar_doc_url"} accept="image/*,application/pdf" onPick={(f) => upload("aadhaar_doc_url", "aadhaar", f)} />
            <FileField label="Last marksheet" value={values.marksheet_url as string} busy={uploading === "marksheet_url"} accept="image/*,application/pdf" onPick={(f) => upload("marksheet_url", "marksheet", f)} />
            <FileField label="Other certificate" value={values.certificate_url as string} busy={uploading === "certificate_url"} accept="image/*,application/pdf" onPick={(f) => upload("certificate_url", "certificate", f)} />
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border p-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</div>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={goNext} className="inline-flex items-center gap-1 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-brand">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={saving} className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30";

function Field({ label, children, error, required, wide }: { label: string; children: React.ReactNode; error?: string; required?: boolean; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

function FileField({ label, value, accept, busy, onPick }: { label: string; value?: string; accept: string; busy: boolean; onPick: (f: File | undefined) => void }) {
  return (
    <label className="block cursor-pointer rounded-xl border border-dashed border-border p-4 transition hover:border-brand">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm text-ink">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-brand" />}
        {value ? "Uploaded — click to replace" : "Click to upload (max 5 MB)"}
      </span>
      <input type="file" accept={accept} className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
    </label>
  );
}