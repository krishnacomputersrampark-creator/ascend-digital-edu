import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Printer, Download, ArrowRight, Phone, Mail } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { z } from "zod";

const searchSchema = z.object({
  app: z.string().optional().default(""),
  name: z.string().optional().default(""),
  course: z.string().optional().default(""),
  branch: z.string().optional().default(""),
});

export const Route = createFileRoute("/admission/success")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Application Submitted — Krishna Computer Center" },
      { name: "description", content: "Your online admission application has been submitted successfully." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { app, name, course, branch } = Route.useSearch();
  const submittedAt = new Date().toLocaleString("en-IN");

  const doPrint = () => window.print();
  const doDownload = () => {
    const html = document.getElementById("receipt")?.outerHTML ?? "";
    const blob = new Blob([
      `<html><head><meta charset="utf-8"><title>Admission Receipt ${app}</title>` +
      `<style>body{font-family:Inter,system-ui,sans-serif;padding:32px;color:#111} .card{border:1px solid #e5e7eb;border-radius:16px;padding:24px;max-width:640px;margin:auto} h1{margin:0 0 4px} dl{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin-top:12px} dt{color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.05em} dd{margin:0;font-weight:600}</style>` +
      `</head><body>${html}</body></html>`,
    ], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Admission-Receipt-${app}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SiteLayout>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-white p-8 text-center shadow-brand print:shadow-none">
            <span className="inline-grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-brand">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-3xl font-extrabold text-ink">Application Submitted!</h1>
            <p className="mt-2 text-muted-foreground">Please save your application number for future reference.</p>

            <div id="receipt" className="card mx-auto mt-6 max-w-xl rounded-2xl border bg-cyan-soft/40 p-6 text-left">
              <h2 className="text-xl font-extrabold text-brand-dark">Krishna Computer Center</h2>
              <p className="text-xs text-ink/60">Admission Acknowledgement Receipt</p>
              <div className="mt-4 rounded-xl bg-white p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/60">Application Number</p>
                <p className="mt-1 text-3xl font-extrabold gradient-text">{app}</p>
              </div>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-y-2 gap-x-4 text-sm">
                <dt className="text-xs uppercase tracking-wider text-ink/60">Name</dt><dd className="font-semibold text-ink">{name || "—"}</dd>
                <dt className="text-xs uppercase tracking-wider text-ink/60">Course</dt><dd className="font-semibold text-ink">{course || "—"}</dd>
                <dt className="text-xs uppercase tracking-wider text-ink/60">Branch</dt><dd className="font-semibold text-ink">{branch || "—"}</dd>
                <dt className="text-xs uppercase tracking-wider text-ink/60">Submitted</dt><dd className="font-semibold text-ink">{submittedAt}</dd>
                <dt className="text-xs uppercase tracking-wider text-ink/60">Status</dt><dd className="font-semibold text-amber-700">Pending Review</dd>
              </dl>
              <p className="mt-4 text-[11px] text-ink/60">This is a system-generated receipt. Please carry a copy when visiting the branch.</p>
            </div>

            <div className="mt-6 rounded-2xl border bg-white p-5 text-left">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-dark">Next Steps</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
                <li>Our counsellor will call you within one working day.</li>
                <li>Visit the branch with original documents for verification.</li>
                <li>Complete the fee payment to confirm your seat.</li>
                <li>You will receive your Student ID after approval to access the Student Zone.</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <a href="tel:+919999999999" className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-1.5 font-semibold text-ink"><Phone className="h-4 w-4 text-brand" /> +91 99999 99999</a>
                <a href="mailto:admissions@krishnacomputer.in" className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-1.5 font-semibold text-ink"><Mail className="h-4 w-4 text-brand" /> admissions@krishnacomputer.in</a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
              <button onClick={doPrint} className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-soft hover:-translate-y-0.5 transition">
                <Printer className="h-4 w-4" /> Print Application
              </button>
              <button onClick={doDownload} className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-soft hover:-translate-y-0.5 transition">
                <Download className="h-4 w-4" /> Download Receipt
              </button>
              <Link to="/" className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand">
                Back to Home <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}