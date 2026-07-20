import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Sparkles, ArrowRight, ArrowLeft, AlertCircle, Check, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { submitAdmission, listCoursesPublic, listBranchesPublic, listBatchesPublic } from "@/lib/admissions.functions";
import { emailService, smsService } from "@/lib/notifications.stub";

export const Route = createFileRoute("/admission")({
  head: () => ({
    meta: [
      { title: "Online Admission — Krishna Computer Center" },
      { name: "description", content: "Apply online for professional computer courses at Krishna Computer Center. Instant application number and admission approval." },
      { property: "og:title", content: "Online Admission — Krishna Computer Center" },
      { property: "og:description", content: "Fast, secure online admission form for our Delhi NCR branches." },
    ],
  }),
  component: AdmissionPage,
});

const STEPS = ["Personal", "Address", "Course", "Documents", "Declaration"] as const;
const DRAFT_KEY = "kcc:admission-draft:v2";
const MAX_MB = 3;
const FILE_FIELDS = [
  { key: "photo_url", label: "Student Photo", accept: "image/jpeg,image/jpg,image/png", required: true },
  { key: "signature_url", label: "Signature", accept: "image/jpeg,image/jpg,image/png", required: true },
  { key: "aadhaar_front_url", label: "Aadhaar Front", accept: "image/jpeg,image/jpg,image/png,application/pdf", required: true },
  { key: "aadhaar_back_url", label: "Aadhaar Back", accept: "image/jpeg,image/jpg,image/png,application/pdf", required: true },
  { key: "qualification_url", label: "Qualification Certificate", accept: "image/jpeg,image/jpg,image/png,application/pdf", required: false },
  { key: "passport_photo_url", label: "Passport Size Photo", accept: "image/jpeg,image/jpg,image/png", required: false },
] as const;

type FormState = Record<string, string>;

function AdmissionPage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitAdmission);
  const loadCourses = useServerFn(listCoursesPublic);
  const loadBranches = useServerFn(listBranchesPublic);
  const loadBatches = useServerFn(listBatchesPublic);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, { url: string; name: string } | null>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [agree, setAgree] = useState(false);
  const draftLoaded = useRef(false);
  const draftId = useRef<string>("");

  // Load draft + a per-session upload folder id
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setForm(d.form ?? {});
        setUploads(d.uploads ?? {});
        draftId.current = d.id ?? crypto.randomUUID();
      } else {
        draftId.current = crypto.randomUUID();
      }
    } catch { draftId.current = crypto.randomUUID(); }
    draftLoaded.current = true;
  }, []);

  // Autosave
  useEffect(() => {
    if (!draftLoaded.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ id: draftId.current, form, uploads }));
    } catch {}
  }, [form, uploads]);

  useEffect(() => {
    loadCourses().then(setCourses).catch(() => {});
    loadBranches().then(setBranches).catch(() => {});
  }, [loadCourses, loadBranches]);

  useEffect(() => {
    if (form.branch_id || form.course_id) {
      loadBatches({ data: { branch_id: form.branch_id || undefined, course_id: form.course_id || undefined } })
        .then(setBatches).catch(() => setBatches([]));
    } else setBatches([]);
  }, [form.branch_id, form.course_id, loadBatches]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.first_name?.trim()) return "First name is required";
      if (!form.last_name?.trim()) return "Last name is required";
      if (!/^\d{10}$/.test((form.mobile ?? "").replace(/\D/g, ""))) return "Mobile must be 10 digits";
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return "Invalid email";
      if (form.aadhaar_number && !/^\d{12}$/.test(form.aadhaar_number.replace(/\s/g, ""))) return "Aadhaar must be 12 digits";
      if (!form.father_name?.trim()) return "Father's name is required";
    }
    if (step === 1) {
      if (!form.address?.trim()) return "Address is required";
      if (!form.city?.trim()) return "City is required";
      if (form.pincode && !/^\d{6}$/.test(form.pincode)) return "Pincode must be 6 digits";
    }
    if (step === 2) {
      if (!form.branch_id) return "Please select a branch";
      if (!form.course_id) return "Please select a course";
    }
    if (step === 3) {
      for (const f of FILE_FIELDS) {
        if (f.required && !uploads[f.key]?.url) return `${f.label} is required`;
      }
    }
    if (step === 4 && !agree) return "You must accept the declaration to submit";
    return null;
  };

  const next = () => {
    const v = validateStep();
    if (v) { setErr(v); toast.error(v); return; }
    setErr(null);
    setStep(s => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => { setErr(null); setStep(s => Math.max(0, s - 1)); };

  const uploadFile = async (key: string, file: File, accept: string) => {
    setErr(null);
    const types = accept.split(",").map(s => s.trim());
    if (!types.includes(file.type)) { toast.error("Unsupported file type"); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`File exceeds ${MAX_MB}MB`); return; }
    setUploading(key);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `admissions/${draftId.current}/${key}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
      setUploads(prev => ({ ...prev, [key]: { url: pub.publicUrl, name: file.name } }));
      toast.success(`${file.name} uploaded`);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally { setUploading(null); }
  };

  const onSubmit = async () => {
    const v = validateStep();
    if (v) { setErr(v); toast.error(v); return; }
    setBusy(true); setErr(null);
    try {
      const payload: any = {
        full_name: `${form.first_name ?? ""} ${form.last_name ?? ""}`.trim(),
        email: form.email ?? "",
        phone: (form.mobile ?? "").replace(/\D/g, ""),
        alternate_mobile: form.alternate_mobile ?? "",
        date_of_birth: form.dob ?? "",
        gender: form.gender ?? "",
        aadhaar_number: (form.aadhaar_number ?? "").replace(/\s/g, ""),
        guardian_name: form.father_name ?? "",
        mother_name: form.mother_name ?? "",
        address: form.address ?? "",
        city: form.city ?? "",
        state: form.state ?? "",
        pincode: form.pincode ?? "",
        qualification: form.qualification ?? "",
        branch_id: form.branch_id ?? "",
        course_id: form.course_id ?? "",
        batch_id: form.batch_id ?? "",
        preferred_timing: form.preferred_timing ?? "",
        source: "website",
        photo_url: uploads.photo_url?.url ?? "",
        signature_url: uploads.signature_url?.url ?? "",
        aadhaar_front_url: uploads.aadhaar_front_url?.url ?? "",
        aadhaar_back_url: uploads.aadhaar_back_url?.url ?? "",
        qualification_url: uploads.qualification_url?.url ?? "",
        passport_photo_url: uploads.passport_photo_url?.url ?? "",
      };
      const row = await submit({ data: payload });
      const appNo = (row as any).application_no ?? (row as any).admission_no;
      const courseName = courses.find(c => c.id === form.course_id)?.name;
      const branchName = branches.find(b => b.id === form.branch_id)?.name;
      emailService.admissionSubmitted({ to: payload.email, applicationNo: appNo, fullName: payload.full_name, courseName, branchName });
      if (payload.phone) smsService.admissionSubmitted({ to: payload.phone, applicationNo: appNo });
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      navigate({
        to: "/admission/success",
        search: { app: appNo, name: payload.full_name, course: courseName ?? "", branch: branchName ?? "" },
      });
    } catch (e: any) {
      setErr(e?.message ?? "Submission failed");
      toast.error(e?.message ?? "Submission failed");
    } finally { setBusy(false); }
  };

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Admissions Open · 2026"
        title={<>Start your journey with <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Krishna Computer Center</span></>}
        subtitle="Complete the 5 easy steps below. Your progress is autosaved on this device."
      />
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Stepper */}
          <div className="mb-8 rounded-3xl border bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink/60">Step {step + 1} of {STEPS.length}</div>
              <div className="text-xs font-semibold text-brand-dark">{progress}% complete</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-cyan-soft">
              <motion.div initial={false} animate={{ width: `${progress}%` }} className="h-full gradient-brand" />
            </div>
            <ol className="mt-4 grid grid-cols-5 gap-2">
              {STEPS.map((label, i) => (
                <li key={label} className={`flex flex-col items-center gap-1 text-center text-[10px] sm:text-xs ${i <= step ? "text-brand-dark" : "text-muted-foreground"}`}>
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${i < step ? "bg-emerald-500 text-white" : i === step ? "gradient-brand text-white shadow-brand" : "bg-cyan-soft text-brand-dark"}`}>
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="font-semibold">{label}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-soft sm:p-8">
            {err && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{err}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                {step === 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First Name *" value={form.first_name} onChange={(v: string) => set("first_name", v)} />
                    <Field label="Last Name *" value={form.last_name} onChange={(v: string) => set("last_name", v)} />
                    <SelectField label="Gender" value={form.gender} onChange={(v: string) => set("gender", v)} options={["", "Male", "Female", "Other"]} />
                    <Field label="Date of Birth" type="date" value={form.dob} onChange={(v: string) => set("dob", v)} />
                    <Field label="Father's Name *" value={form.father_name} onChange={(v: string) => set("father_name", v)} />
                    <Field label="Mother's Name" value={form.mother_name} onChange={(v: string) => set("mother_name", v)} />
                    <Field label="Mobile Number *" type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={(v: string) => set("mobile", v)} />
                    <Field label="Alternate Mobile" type="tel" inputMode="numeric" maxLength={10} value={form.alternate_mobile} onChange={(v: string) => set("alternate_mobile", v)} />
                    <Field label="Email" type="email" value={form.email} onChange={(v: string) => set("email", v)} />
                    <Field label="Aadhaar Number" inputMode="numeric" maxLength={12} value={form.aadhaar_number} onChange={(v: string) => set("aadhaar_number", v)} />
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Address *" className="sm:col-span-2" value={form.address} onChange={(v: string) => set("address", v)} />
                    <Field label="City *" value={form.city} onChange={(v: string) => set("city", v)} />
                    <Field label="State" value={form.state} onChange={(v: string) => set("state", v)} />
                    <Field label="Pincode" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(v: string) => set("pincode", v)} />
                    <SelectField label="Qualification" value={form.qualification} onChange={(v: string) => set("qualification", v)} options={["", "10th", "12th", "Graduate", "Post Graduate"]} />
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField label="Select Branch *" value={form.branch_id} onChange={(v: string) => set("branch_id", v)}
                      options={[{ value: "", label: "— Select a branch —" }, ...branches.map(b => ({ value: b.id, label: `${b.name}${b.city ? ` · ${b.city}` : ""}` }))]} />
                    <SelectField label="Select Course *" value={form.course_id} onChange={(v: string) => set("course_id", v)}
                      options={[{ value: "", label: "— Select a course —" }, ...courses.map(c => ({ value: c.id, label: `${c.code} · ${c.name}` }))]} />
                    <SelectField label="Select Batch" value={form.batch_id} onChange={(v: string) => set("batch_id", v)}
                      options={[{ value: "", label: batches.length ? "— Select a batch —" : "No active batches" }, ...batches.map(b => ({ value: b.id, label: `${b.name}${b.timing ? ` · ${b.timing}` : ""}` }))]} />
                    <SelectField label="Preferred Timing" value={form.preferred_timing} onChange={(v: string) => set("preferred_timing", v)} options={["", "Morning", "Afternoon", "Evening", "Weekend"]} />
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {FILE_FIELDS.map(f => (
                      <FileTile key={f.key}
                        label={f.label + (f.required ? " *" : "")}
                        accept={f.accept}
                        state={uploads[f.key]}
                        loading={uploading === f.key}
                        onFile={(file) => uploadFile(f.key, file, f.accept)}
                      />
                    ))}
                    <p className="sm:col-span-2 text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF (where applicable). Max {MAX_MB}MB per file.</p>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-cyan-soft/40 p-5">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-dark">Review your application</h3>
                      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                        <Row k="Name" v={`${form.first_name ?? ""} ${form.last_name ?? ""}`} />
                        <Row k="Mobile" v={form.mobile} />
                        <Row k="Email" v={form.email} />
                        <Row k="Course" v={courses.find(c => c.id === form.course_id)?.name} />
                        <Row k="Branch" v={branches.find(b => b.id === form.branch_id)?.name} />
                        <Row k="Batch" v={batches.find(b => b.id === form.batch_id)?.name || "—"} />
                      </dl>
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border bg-white p-4">
                      <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
                      <span className="text-sm text-ink">
                        I certify that all information provided is correct and I have uploaded genuine documents. I understand that any false information may lead to cancellation of admission.
                      </span>
                    </label>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || busy}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-soft disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-full gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={onSubmit} disabled={busy || !agree} className="inline-flex items-center gap-2 rounded-full gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {busy ? "Submitting…" : "Submit Application"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, value, onChange, type = "text", className, inputMode, maxLength }: any) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</span>
      <div className="mt-1.5 rounded-xl border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
        <input value={value ?? ""} onChange={e => onChange(e.target.value)} type={type} inputMode={inputMode} maxLength={maxLength} className="w-full bg-transparent text-sm focus:outline-none" />
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, options, className }: any) {
  const opts = options.map((o: any) => typeof o === "string" ? { value: o, label: o || "—" } : o);
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</span>
      <div className="mt-1.5 rounded-xl border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
        <select value={value ?? ""} onChange={e => onChange(e.target.value)} className="w-full bg-transparent text-sm focus:outline-none">
          {opts.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </label>
  );
}

function FileTile({ label, accept, state, loading, onFile }: { label: string; accept: string; state: { url: string; name: string } | null | undefined; loading: boolean; onFile: (f: File) => void; }) {
  const isPdf = state?.name?.toLowerCase().endsWith(".pdf");
  return (
    <label className={`group relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-3 py-5 text-center text-xs transition ${state?.url ? "border-emerald-400 bg-emerald-50/60 text-emerald-800" : "border-brand/30 bg-cyan-soft/40 text-brand-dark hover:border-brand"}`}>
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      ) : state?.url ? (
        isPdf ? <FileText className="h-6 w-6 text-emerald-600" /> : <ImageIcon className="h-6 w-6 text-emerald-600" />
      ) : (
        <Upload className="h-6 w-6 text-brand" />
      )}
      <span className="font-semibold">{label}</span>
      <span className="max-w-[90%] truncate text-[10px] text-muted-foreground">
        {state?.url ? state.name : `${accept.replace(/image\//g, "").replace(/application\//g, "").toUpperCase()}`}
      </span>
      <input type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }} />
    </label>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) {
  return (<><dt className="text-xs uppercase tracking-wider text-ink/60">{k}</dt><dd className="font-semibold text-ink">{v || "—"}</dd></>);
}
