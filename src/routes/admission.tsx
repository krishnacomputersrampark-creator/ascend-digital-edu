import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Upload, Sparkles, ArrowRight } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

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
  const [submitted, setSubmitted] = useState<string | null>(null);
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
            <form
              onSubmit={(e) => { e.preventDefault(); setSubmitted("KCC-APP-" + Math.floor(100000 + Math.random()*899999)); }}
              className="rounded-3xl border bg-white p-6 shadow-soft sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Student Name" name="name" required />
                <Field label="Father's Name" name="father" required />
                <Field label="Mother's Name" name="mother" required />
                <Field label="Date of Birth" name="dob" type="date" required />
                <Field label="Mobile Number" name="mobile" type="tel" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Gender" name="gender">
                  <select className="w-full bg-transparent text-sm focus:outline-none"><option>Male</option><option>Female</option><option>Other</option></select>
                </Field>
                <Field label="Qualification" name="qual">
                  <select className="w-full bg-transparent text-sm focus:outline-none"><option>10th</option><option>12th</option><option>Graduate</option><option>Post Graduate</option></select>
                </Field>
                <Field label="Course Selection" name="course">
                  <select className="w-full bg-transparent text-sm focus:outline-none"><option>ADCA</option><option>DCA</option><option>PGDCA</option><option>CCC</option><option>O Level</option><option>Python</option><option>Tally Prime</option><option>Digital Marketing</option></select>
                </Field>
                <Field label="Branch Selection" name="branch">
                  <select className="w-full bg-transparent text-sm focus:outline-none"><option>Karawal Nagar</option><option>Rampark, Loni</option></select>
                </Field>
                <Field label="Address" name="address" className="sm:col-span-2" required />
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
              <button className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5">
                <Sparkles className="h-4 w-4" /> Submit Application <ArrowRight className="h-4 w-4" />
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