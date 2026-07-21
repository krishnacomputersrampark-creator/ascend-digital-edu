import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Award, Loader2, Search, Download, Eye } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import {
  CERT_TYPES, CERT_TYPE_LABEL, createCertificate, listTemplates,
  type CertType, type CertificateTemplate, getCertificate,
} from "@/lib/certificates.repo";
import { downloadCertificatePdf } from "@/lib/certificates.pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/certificates/create")({
  head: () => ({ meta: [{ title: "Issue Certificate · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: CreateCertificatePage,
});

const schema = z.object({
  student_id: z.string().uuid("Select a student"),
  course_id: z.string().uuid().nullable(),
  branch_id: z.string().uuid().nullable(),
  template_id: z.string().uuid().nullable(),
  issue_date: z.string().min(1),
  completion_date: z.string().nullable(),
  grade: z.string().max(4).nullable(),
  percentage: z.number().min(0).max(100).nullable(),
  certificate_type: z.enum(CERT_TYPES),
});
type FormValues = z.infer<typeof schema>;

type StudentSuggest = {
  id: string; full_name: string; student_code: string; roll_no: string | null;
  course_id: string | null; branch_id: string | null;
  course?: { name: string } | null; branch?: { name: string } | null;
};

function CreateCertificatePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggests, setSuggests] = useState<StudentSuggest[]>([]);
  const [selected, setSelected] = useState<StudentSuggest | null>(null);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      certificate_type: "course_completion",
      issue_date: new Date().toISOString().slice(0, 10),
      completion_date: null, grade: null, percentage: null,
      student_id: "" as any, course_id: null, branch_id: null, template_id: null,
    },
  });

  useEffect(() => { listTemplates().then(setTemplates).catch(() => {}); }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setSuggests([]); return; }
    setLoadingSuggest(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, student_code, roll_no, course_id, branch_id, course:courses(name), branch:branches(name)")
        .or(`full_name.ilike.%${query}%,student_code.ilike.%${query}%,roll_no.ilike.%${query}%`)
        .limit(8);
      setSuggests((data ?? []) as any);
      setLoadingSuggest(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const pickStudent = (s: StudentSuggest) => {
    setSelected(s); setSuggests([]); setQuery(s.full_name);
    setValue("student_id", s.id);
    setValue("course_id", s.course_id);
    setValue("branch_id", s.branch_id);
  };

  const currentType = watch("certificate_type");
  const filteredTemplates = useMemo(
    () => templates.filter((t) => !t.course_id || t.course_id === watch("course_id")),
    [templates, watch("course_id")],
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createCertificate({
        student_id: values.student_id,
        course_id: values.course_id,
        branch_id: values.branch_id,
        template_id: values.template_id,
        issue_date: values.issue_date,
        completion_date: values.completion_date,
        grade: values.grade,
        percentage: values.percentage,
        certificate_type: values.certificate_type,
      });
      toast.success(`Issued ${created.certificate_number}`);
      const full = await getCertificate(created.id);
      if (full) await downloadCertificatePdf(full);
      navigate({ to: "/dashboard/certificates" });
    } catch (e: any) {
      const msg = e?.message ?? "Failed";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        toast.error("An active certificate of this type already exists for this student & course.");
      } else toast.error(msg);
    }
  });

  return (
    <DashboardShell
      title="Issue new certificate"
      subtitle="Generate a certificate with a unique number and QR verification"
      actions={<Link to="/dashboard/certificates" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Back</Link>}
    >
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border bg-white p-5 shadow-soft">
            <div className="mb-2 text-xs font-semibold uppercase text-brand">Step 1 · Student</div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} placeholder="Search by name, student ID or roll number" className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              {loadingSuggest && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
              {suggests.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-brand">
                  {suggests.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => pickStudent(s)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-cyan-soft/50">
                        <span className="grid h-9 w-9 place-items-center rounded-full gradient-brand text-white text-xs font-bold">{s.full_name.slice(0,2).toUpperCase()}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-ink">{s.full_name}</div>
                          <div className="text-[11px] text-muted-foreground">{s.student_code} · {s.course?.name ?? "—"} · {s.branch?.name ?? "—"}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.student_id && <p className="mt-2 text-xs text-rose-600">{errors.student_id.message}</p>}
            {selected && (
              <div className="mt-3 grid gap-2 rounded-xl bg-cyan-soft/40 p-3 text-xs sm:grid-cols-3">
                <div><div className="text-[10px] uppercase text-brand-dark">Student</div><div className="font-semibold">{selected.full_name}</div></div>
                <div><div className="text-[10px] uppercase text-brand-dark">Student ID</div><div className="font-semibold">{selected.student_code}</div></div>
                <div><div className="text-[10px] uppercase text-brand-dark">Course</div><div className="font-semibold">{selected.course?.name ?? "—"}</div></div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-soft">
            <div className="mb-3 text-xs font-semibold uppercase text-brand">Step 2 · Certificate details</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Certificate type">
                <select {...register("certificate_type")} className="w-full rounded-xl border px-3 py-2 text-sm">
                  {CERT_TYPES.map((t) => <option key={t} value={t}>{CERT_TYPE_LABEL[t]}</option>)}
                </select>
              </Field>
              <Field label="Template">
                <select {...register("template_id")} className="w-full rounded-xl border px-3 py-2 text-sm">
                  <option value="">— Default —</option>
                  {filteredTemplates.map((t) => <option key={t.id} value={t.id}>{t.template_name}</option>)}
                </select>
              </Field>
              <Field label="Issue date"><input type="date" {...register("issue_date")} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
              <Field label="Completion date"><input type="date" {...register("completion_date")} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
              <Field label="Grade (optional)"><input {...register("grade")} placeholder="A+, A, B…" className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
              <Field label="Percentage (optional)"><input type="number" step="0.01" min={0} max={100} {...register("percentage", { setValueAs: (v) => v === "" || v == null ? null : Number(v) })} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-soft">
            <div className="mb-3 text-xs font-semibold uppercase text-brand">Preview</div>
            <div className="relative aspect-[297/210] w-full overflow-hidden rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-white via-cyan-soft/30 to-white p-4 text-center">
              <div className="absolute inset-2 rounded-xl border border-cyan/50" />
              <div className="relative">
                <div className="text-[9px] font-bold uppercase tracking-widest text-brand-dark">Krishna Computer Center</div>
                <div className="mt-1 text-lg font-black text-brand">Certificate</div>
                <div className="text-[10px] text-slate-600">of {CERT_TYPE_LABEL[currentType]}</div>
                <div className="mt-2 text-[9px] italic text-slate-500">This is to certify that</div>
                <div className="mt-1 text-base font-black text-ink truncate">{selected?.full_name ?? "Student Name"}</div>
                <div className="mt-1 text-[9px] text-slate-600 line-clamp-2">has successfully completed <b>{selected?.course?.name ?? "the course"}</b></div>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand px-4 py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4"/>}
              Issue certificate
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground">A unique <b>KCC-CERT-YYYY-000000</b> number and QR verification will be generated automatically.</p>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}