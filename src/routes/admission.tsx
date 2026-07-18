import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { CheckCircle2, Upload, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { submitAdmission, listCoursesPublic, listBranchesPublic } from "@/lib/admissions.functions";

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

function AdmissionPage() {
  const submit = useServerFn(submitAdmission);
  const loadCourses = useServerFn(listCoursesPublic);
  const loadBranches = useServerFn(listBranchesPublic);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    loadCourses().then(setCourses).catch(() => {});
    loadBranches().then(setBranches).catch(() => {});
  }, [loadCourses, loadBranches]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("mobile") || ""),
      date_of_birth: String(fd.get("dob") || ""),
      gender: String(fd.get("gender") || ""),
      address: String(fd.get("address") || ""),
      guardian_name: String(fd.get("father") || ""),
      qualification: String(fd.get("qual") || ""),
      course_id: String(fd.get("course_id") || ""),
      branch_id: String(fd.get("branch_id") || ""),
      source: "website",
    };
    try {
      const row = await submit({ data: payload as any });
      setSubmitted(row.admission_no as string);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Admissions Open · 2026"
        title={<>Start your journey with <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Krishna Computer Center</span></>}
        subtitle="Fill this quick form and our counsellor will connect within one working day."
      />
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border bg-white p-10 text-center shadow-brand">
              <span className="inline-grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-brand"><CheckCircle2 className="h-8 w-8" /></span>
              <h2 className="mt-5 text-3xl font-extrabold text-ink">Application Submitted!</h2>
              <p className="mt-2 text-muted-foreground">Your application number is</p>
              <div className="mt-3 text-3xl font-extrabold gradient-text">{submitted}</div>
              <p className="mt-4 text-sm text-muted-foreground">Please save this number for follow-up. Our team will reach out on the mobile number provided.</p>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="rounded-3xl border bg-white p-6 shadow-soft sm:p-8">
              {err && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{err}</span>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Student Name" name="name" required />
                <Field label="Father's Name" name="father" required />
                <Field label="Mother's Name" name="mother" />
                <Field label="Date of Birth" name="dob" type="date" />
                <Field label="Mobile Number" name="mobile" type="tel" required />
                <Field label="Email" name="email" type="email" />
                <Field label="Gender" name="gender">
                  <select name="gender" className="w-full bg-transparent text-sm focus:outline-none"><option>Male</option><option>Female</option><option>Other</option></select>
                </Field>
                <Field label="Qualification" name="qual">
                  <select name="qual" className="w-full bg-transparent text-sm focus:outline-none"><option>10th</option><option>12th</option><option>Graduate</option><option>Post Graduate</option></select>
                </Field>
                <Field label="Course Selection" name="course_id">
                  <select name="course_id" className="w-full bg-transparent text-sm focus:outline-none">
                    <option value="">Select a course…</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                  </select>
                </Field>
                <Field label="Branch Selection" name="branch_id">
                  <select name="branch_id" className="w-full bg-transparent text-sm focus:outline-none">
                    <option value="">Select a branch…</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.city ? ` · ${b.city}` : ""}</option>)}
                  </select>
                </Field>
                <Field label="Address" name="address" className="sm:col-span-2" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Upload Photo","Upload Aadhaar","Upload Signature"].map((l) => (
                  <label key={l} className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-brand/30 bg-cyan-soft/40 px-3 py-4 text-center text-xs text-brand-dark hover:border-brand">
                    <Upload className="h-5 w-5 text-brand" />
                    <span className="font-semibold">{l}</span>
                    <span className="text-[10px] text-muted-foreground">JPG / PNG · Max 2MB</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                ))}
              </div>
              <button disabled={busy} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5 disabled:opacity-60">
                <Sparkles className="h-4 w-4" /> {busy ? "Submitting…" : "Submit Application"} <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">You'll receive an application number instantly. Approval within one working day.</p>
            </form>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, name, type = "text", required, className, children }: any) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</span>
      <div className="mt-1.5 rounded-xl border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
        {children ?? <input name={name} type={type} required={required} className="w-full bg-transparent text-sm focus:outline-none" />}
      </div>
    </label>
  );
}