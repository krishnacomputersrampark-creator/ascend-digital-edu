import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Sparkles, ArrowRight, ArrowLeft, AlertCircle, Check, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { submitAdmission, listCoursesPublic, listBranchesPublic, listBatchesPublic, checkAdmissionDuplicates, listAdmissionFormFields } from "@/lib/admissions.functions";
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

const STEPS = ["Personal", "Contact", "Academic", "Course", "Documents", "Declaration"] as const;
const DRAFT_KEY = "kcc:admission-draft:v3";
const MAX_MB = 3;
const FILE_FIELDS = [
  { key: "photo_url", label: "Student Photo", accept: "image/jpeg,image/jpg,image/png", required: true },
  { key: "signature_url", label: "Signature", accept: "image/jpeg,image/jpg,image/png", required: true },
  { key: "aadhaar_front_url", label: "Aadhaar Front", accept: "image/jpeg,image/jpg,image/png,application/pdf", required: true },
  { key: "aadhaar_back_url", label: "Aadhaar Back", accept: "image/jpeg,image/jpg,image/png,application/pdf", required: true },
  { key: "marksheet_url", label: "Marksheet", accept: "image/jpeg,image/jpg,image/png,application/pdf", required: false },
  { key: "qualification_url", label: "Qualification Certificate", accept: "image/jpeg,image/jpg,image/png,application/pdf", required: false },
  { key: "other_doc_1_url", label: "Other Document", accept: "image/jpeg,image/jpg,image/png,application/pdf", required: false },
] as const;

type FormState = Record<string, string>;
type FieldCfg = { field_key: string; label: string; is_visible: boolean; is_required: boolean; sort_order: number };

const DEFAULT_REQUIRED = new Set([
  "first_name", "last_name", "father_name", "gender", "dob",
  "mobile", "address", "state", "district", "qualification",
  "branch_id", "course_id",
  "photo_url", "signature_url", "aadhaar_front_url", "aadhaar_back_url",
  "declaration_agree",
]);

function AdmissionPage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitAdmission);
  const checkDup = useServerFn(checkAdmissionDuplicates);
  const loadCourses = useServerFn(listCoursesPublic);
  const loadBranches = useServerFn(listBranchesPublic);
  const loadBatches = useServerFn(listBatchesPublic);
  const loadFieldCfg = useServerFn(listAdmissionFormFields);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, { url: string; name: string } | null>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [cfg, setCfg] = useState<Record<string, FieldCfg>>({});
  const [agree, setAgree] = useState(false);
  const draftLoaded = useRef(false);
  const draftId = useRef<string>("");

  // Field-level configuration controlled by Super Admin (Configuration → Forms)
  const vis = (k: string) => cfg[k]?.is_visible !== false;
  const req = (k: string) => (cfg[k] ? cfg[k].is_required : DEFAULT_REQUIRED.has(k));
  const lbl = (k: string, fallback: string) => `${cfg[k]?.label || fallback}${req(k) ? " *" : ""}`;
  const ord = (k: string, fallback: number) => cfg[k]?.sort_order ?? fallback;
  const ordered = (items: { key: string; node: React.ReactNode }[]) =>
    items.filter(i => vis(i.key)).sort((a, b) => ord(a.key, 0) - ord(b.key, 0)).map(i => <div key={i.key} className="contents">{i.node}</div>);


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
    loadFieldCfg()
      .then((rows: any[]) => setCfg(Object.fromEntries((rows ?? []).map(r => [r.field_key, r]))))
      .catch(() => {});
  }, [loadCourses, loadBranches, loadFieldCfg]);

  useEffect(() => {
    if (form.branch_id || form.course_id) {
      loadBatches({ data: { branch_id: form.branch_id || undefined, course_id: form.course_id || undefined } })
        .then(setBatches).catch(() => setBatches([]));
    } else setBatches([]);
  }, [form.branch_id, form.course_id, loadBatches]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const validateStep = (): string | null => {
    // A hidden field is never validated; a visible field is validated per its configured requirement.
    const missing = (k: string, fallbackLabel: string) =>
      vis(k) && req(k) && !(form[k] ?? "").trim() ? `${cfg[k]?.label || fallbackLabel} is required` : null;
    const filled = (k: string) => vis(k) && !!(form[k] ?? "").trim();

    if (step === 0) {
      for (const [k, l] of [["first_name", "First name"], ["last_name", "Last name"], ["father_name", "Father's name"],
        ["mother_name", "Mother's name"], ["gender", "Gender"], ["dob", "Date of birth"],
        ["blood_group", "Blood group"], ["category", "Category"], ["aadhaar_number", "Aadhaar number"]] as const) {
        const m = missing(k, l); if (m) return m;
      }
      if (filled("aadhaar_number") && !/^\d{12}$/.test(form.aadhaar_number.replace(/\s/g, ""))) return "Aadhaar must be 12 digits";
    }
    if (step === 1) {
      for (const [k, l] of [["mobile", "Mobile number"], ["alternate_mobile", "Alternate mobile"], ["email", "Email"],
        ["address", "Address"], ["state", "State"], ["district", "District"], ["pincode", "PIN code"]] as const) {
        const m = missing(k, l); if (m) return m;
      }
      if (filled("mobile") && !/^\d{10}$/.test(form.mobile.replace(/\D/g, ""))) return "Mobile must be 10 digits";
      if (filled("alternate_mobile") && !/^\d{10}$/.test(form.alternate_mobile.replace(/\D/g, ""))) return "Alternate mobile must be 10 digits";
      if (filled("email") && !/^\S+@\S+\.\S+$/.test(form.email)) return "Invalid email";
      if (filled("pincode") && !/^\d{6}$/.test(form.pincode)) return "Pincode must be 6 digits";
    }
    if (step === 2) {
      for (const [k, l] of [["qualification", "Qualification"], ["school", "School / College"], ["board", "Board / University"],
        ["passing_year", "Passing year"], ["percentage", "Percentage"]] as const) {
        const m = missing(k, l); if (m) return m;
      }
      if (filled("percentage") && (Number(form.percentage) < 0 || Number(form.percentage) > 100)) return "Percentage must be between 0 and 100";
      if (filled("passing_year") && !/^\d{4}$/.test(form.passing_year)) return "Passing year must be 4 digits";
    }
    if (step === 3) {
      for (const [k, l] of [["branch_id", "Branch"], ["course_id", "Course"], ["batch_id", "Batch"],
        ["session", "Session"], ["preferred_timing", "Preferred timing"]] as const) {
        const m = missing(k, l); if (m) return m;
      }
    }
    if (step === 4) {
      for (const f of FILE_FIELDS) {
        if (vis(f.key) && req(f.key) && !uploads[f.key]?.url) return `${cfg[f.key]?.label || f.label} is required`;
      }
    }
    if (step === 5 && vis("declaration_agree") && req("declaration_agree") && !agree) return "You must accept the declaration to submit";
    return null;
  };


  const next = async () => {
    const v = validateStep();
    if (v) { setErr(v); toast.error(v); return; }
    if (step === 1) {
      // Live duplicate check on mobile / email / Aadhaar
      try {
        const res = await checkDup({
          data: {
            phone: (form.mobile ?? "").replace(/\D/g, ""),
            email: form.email ?? "",
            aadhaar_number: (form.aadhaar_number ?? "").replace(/\s/g, ""),
          },
        });
        if (!res.ok) { setErr(res.messages.join(" ")); toast.error(res.messages[0]); return; }
      } catch { /* fall through — server re-validates on submit */ }
    }
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
      const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      // Store the storage path (private bucket → admin generates signed URL on view).
      setUploads(prev => ({ ...prev, [key]: { url: path, name: file.name } }));
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
        father_name: form.father_name ?? "",
        mother_name: form.mother_name ?? "",
        blood_group: form.blood_group ?? "",
        category: form.category ?? "",
        address: form.address ?? "",
        city: form.district ?? form.city ?? "",
        district: form.district ?? "",
        state: form.state ?? "",
        pincode: form.pincode ?? "",
        qualification: form.qualification ?? "",
        school: form.school ?? "",
        board: form.board ?? "",
        passing_year: form.passing_year ?? "",
        percentage: form.percentage ? Number(form.percentage) : "",
        session: form.session ?? "",
        branch_id: form.branch_id ?? "",
        course_id: form.course_id ?? "",
        batch_id: form.batch_id ?? "",
        preferred_timing: form.preferred_timing ?? "",
        source: "website",
        photo_url: uploads.photo_url?.url ?? "",
        signature_url: uploads.signature_url?.url ?? "",
        aadhaar_front_url: uploads.aadhaar_front_url?.url ?? "",
        aadhaar_back_url: uploads.aadhaar_back_url?.url ?? "",
        marksheet_url: uploads.marksheet_url?.url ?? "",
        qualification_url: uploads.qualification_url?.url ?? "",
        other_documents: uploads.other_doc_1_url?.url
          ? [{ name: uploads.other_doc_1_url.name, url: uploads.other_doc_1_url.url }]
          : [],
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
        search: {
          app: appNo,
          name: payload.full_name,
          course: courseName ?? "",
          branch: branchName ?? "",
        },
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
            <ol className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                    {ordered([
                      { key: "first_name", node: <Field label={lbl("first_name", "First Name")} value={form.first_name} onChange={(v: string) => set("first_name", v)} /> },
                      { key: "last_name", node: <Field label={lbl("last_name", "Last Name")} value={form.last_name} onChange={(v: string) => set("last_name", v)} /> },
                      { key: "father_name", node: <Field label={lbl("father_name", "Father's Name")} value={form.father_name} onChange={(v: string) => set("father_name", v)} /> },
                      { key: "mother_name", node: <Field label={lbl("mother_name", "Mother's Name")} value={form.mother_name} onChange={(v: string) => set("mother_name", v)} /> },
                      { key: "gender", node: <SelectField label={lbl("gender", "Gender")} value={form.gender} onChange={(v: string) => set("gender", v)} options={["", "Male", "Female", "Other"]} /> },
                      { key: "dob", node: <Field label={lbl("dob", "Date of Birth")} type="date" value={form.dob} onChange={(v: string) => set("dob", v)} /> },
                      { key: "blood_group", node: <SelectField label={lbl("blood_group", "Blood Group")} value={form.blood_group} onChange={(v: string) => set("blood_group", v)} options={["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} /> },
                      { key: "category", node: <SelectField label={lbl("category", "Category")} value={form.category} onChange={(v: string) => set("category", v)} options={["", "General", "OBC", "SC", "ST", "EWS"]} /> },
                      { key: "aadhaar_number", node: <Field label={lbl("aadhaar_number", "Aadhaar Number")} inputMode="numeric" maxLength={12} value={form.aadhaar_number} onChange={(v: string) => set("aadhaar_number", v)} /> },
                    ])}
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {ordered([
                      { key: "mobile", node: <Field label={lbl("mobile", "Mobile Number")} type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={(v: string) => set("mobile", v)} /> },
                      { key: "alternate_mobile", node: <Field label={lbl("alternate_mobile", "Alternate Mobile")} type="tel" inputMode="numeric" maxLength={10} value={form.alternate_mobile} onChange={(v: string) => set("alternate_mobile", v)} /> },
                      { key: "email", node: <Field label={lbl("email", "Email")} type="email" className="sm:col-span-2" value={form.email} onChange={(v: string) => set("email", v)} /> },
                      { key: "address", node: <Field label={lbl("address", "Address")} className="sm:col-span-2" value={form.address} onChange={(v: string) => set("address", v)} /> },
                      { key: "state", node: <Field label={lbl("state", "State")} value={form.state} onChange={(v: string) => set("state", v)} /> },
                      { key: "district", node: <Field label={lbl("district", "District")} value={form.district} onChange={(v: string) => set("district", v)} /> },
                      { key: "pincode", node: <Field label={lbl("pincode", "PIN Code")} inputMode="numeric" maxLength={6} value={form.pincode} onChange={(v: string) => set("pincode", v)} /> },
                    ])}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {ordered([
                      { key: "qualification", node: <SelectField label={lbl("qualification", "Highest Qualification")} value={form.qualification} onChange={(v: string) => set("qualification", v)} options={["", "8th", "10th", "12th", "Diploma", "Graduate", "Post Graduate"]} /> },
                      { key: "school", node: <Field label={lbl("school", "School / College")} value={form.school} onChange={(v: string) => set("school", v)} /> },
                      { key: "board", node: <Field label={lbl("board", "Board / University")} value={form.board} onChange={(v: string) => set("board", v)} /> },
                      { key: "passing_year", node: <Field label={lbl("passing_year", "Passing Year")} inputMode="numeric" maxLength={4} value={form.passing_year} onChange={(v: string) => set("passing_year", v)} /> },
                      { key: "percentage", node: <Field label={lbl("percentage", "Percentage / CGPA %")} inputMode="decimal" value={form.percentage} onChange={(v: string) => set("percentage", v)} /> },
                    ])}
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {ordered([
                      { key: "branch_id", node: <SelectField label={lbl("branch_id", "Select Branch")} value={form.branch_id} onChange={(v: string) => set("branch_id", v)}
                        options={[{ value: "", label: "— Select a branch —" }, ...branches.map(b => ({ value: b.id, label: `${b.name}${b.city ? ` · ${b.city}` : ""}` }))]} /> },
                      { key: "course_id", node: <SelectField label={lbl("course_id", "Select Course")} value={form.course_id} onChange={(v: string) => set("course_id", v)}
                        options={[{ value: "", label: "— Select a course —" }, ...courses.map(c => ({ value: c.id, label: `${c.code} · ${c.name}` }))]} /> },
                      { key: "batch_id", node: <SelectField label={lbl("batch_id", "Select Batch")} value={form.batch_id} onChange={(v: string) => set("batch_id", v)}
                        options={[{ value: "", label: batches.length ? "— Select a batch —" : "No active batches" }, ...batches.map(b => ({ value: b.id, label: `${b.name}${b.timing ? ` · ${b.timing}` : ""}` }))]} /> },
                      { key: "session", node: <Field label={lbl("session", "Session")} value={form.session} onChange={(v: string) => set("session", v)} /> },
                      { key: "preferred_timing", node: <SelectField label={lbl("preferred_timing", "Preferred Timing")} value={form.preferred_timing} onChange={(v: string) => set("preferred_timing", v)} options={["", "Morning", "Afternoon", "Evening", "Weekend"]} /> },
                    ])}
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ordered(FILE_FIELDS.map(f => ({
                      key: f.key,
                      node: (
                        <FileTile
                          label={lbl(f.key, f.label)}
                          accept={f.accept}
                          state={uploads[f.key]}
                          loading={uploading === f.key}
                          onFile={(file) => uploadFile(f.key, file, f.accept)}
                        />
                      ),
                    })))}
                    <p className="sm:col-span-2 text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF (where applicable). Max {MAX_MB}MB per file.</p>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-cyan-soft/40 p-5">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-brand-dark">Review your application</h3>
                      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                        <Row k="Name" v={`${form.first_name ?? ""} ${form.last_name ?? ""}`} />
                        {vis("mobile") ? <Row k="Mobile" v={form.mobile} /> : null}
                        {vis("email") ? <Row k="Email" v={form.email} /> : null}
                        {vis("course_id") ? <Row k="Course" v={courses.find(c => c.id === form.course_id)?.name} /> : null}
                        {vis("branch_id") ? <Row k="Branch" v={branches.find(b => b.id === form.branch_id)?.name} /> : null}
                        {vis("batch_id") ? <Row k="Batch" v={batches.find(b => b.id === form.batch_id)?.name || "—"} /> : null}
                      </dl>
                    </div>
                    {vis("declaration_agree") ? (
                      <label className="flex items-start gap-3 rounded-xl border bg-white p-4">
                        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
                        <span className="text-sm text-ink">
                          I certify that all information provided is correct and I have uploaded genuine documents. I understand that any false information may lead to cancellation of admission.
                        </span>
                      </label>
                    ) : null}
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
