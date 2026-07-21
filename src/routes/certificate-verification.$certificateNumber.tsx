import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Ban, Loader2, ShieldAlert, Printer, ArrowLeft } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import {
  verifyCertificate, CERT_TYPE_LABEL, CERT_STATUS_LABEL, maskMobile, type CertificateRow,
} from "@/lib/certificates.repo";
import { certificateQrDataUrl } from "@/lib/certificates.pdf";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/certificate-verification/$certificateNumber")({
  head: ({ params }) => ({
    meta: [
      { title: `Verify ${params.certificateNumber} — Krishna Computer Center` },
      { name: "description", content: `Verification status for KCC certificate ${params.certificateNumber}.` },
      { property: "og:title", content: `Verify certificate ${params.certificateNumber}` },
      { property: "og:description", content: "Instant online verification of KCC certificates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyResultPage,
});

function VerifyResultPage() {
  const { certificateNumber } = Route.useParams();
  const [cert, setCert] = useState<CertificateRow | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const c = await verifyCertificate(certificateNumber);
        setCert(c);
        if (c) {
          setQr(await certificateQrDataUrl(c.certificate_number));
          const { data } = await supabase.from("students").select("phone").eq("id", c.student_id).maybeSingle();
          setMobile(data?.phone ?? null);
        }
      } finally { setLoading(false); }
    })();
  }, [certificateNumber]);

  if (loading) return (
    <SiteLayout><div className="py-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-brand"/></div></SiteLayout>
  );

  if (!cert) {
    return (
      <SiteLayout>
        <PageHero eyebrow="Not Found" title={<>Certificate <span className="text-rose-200">Not Found</span></>} subtitle={certificateNumber}/>
        <section className="py-14">
          <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-8 text-center shadow-soft">
            <ShieldAlert className="mx-auto h-14 w-14 text-rose-500"/>
            <h2 className="mt-4 text-2xl font-black text-ink">This certificate could not be verified</h2>
            <p className="mt-2 text-sm text-muted-foreground">The certificate number <b>{certificateNumber}</b> does not exist in our records. It may have been mistyped or forged.</p>
            <Link to="/certificate-verification" className="mt-6 inline-flex items-center gap-1.5 rounded-xl gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand"><ArrowLeft className="h-4 w-4"/>Try again</Link>
          </div>
        </section>
      </SiteLayout>
    );
  }

  const revoked = cert.status === "revoked";
  return (
    <SiteLayout>
      <div className={`${revoked ? "bg-gradient-to-br from-rose-700 to-rose-500" : "gradient-brand-dark"} text-white`}>
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">Verification Result</div>
              <h1 className="mt-2 flex items-center gap-3 text-4xl font-black">
                {revoked ? <Ban className="h-9 w-9"/> : <BadgeCheck className="h-9 w-9"/>}
                {revoked ? "Revoked Certificate" : "Verified Authentic"}
              </h1>
              <p className="mt-1 text-sm opacity-90">Certificate <span className="font-mono font-semibold">{cert.certificate_number}</span></p>
            </div>
            {qr && <img src={qr} alt="QR" className="h-24 w-24 rounded-xl border-4 border-white/70 bg-white p-1"/>}
          </div>
        </div>
      </div>

      <section className="py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {revoked && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <div className="font-bold">This certificate has been revoked by the institute.</div>
              {cert.revoked_reason && <div className="mt-1 text-xs opacity-80">Reason: {cert.revoked_reason}</div>}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <Card title="Student details">
                <Row k="Full name" v={cert.student?.full_name ?? "—"} />
                <Row k="Student ID" v={cert.student?.student_code ?? "—"} />
                {cert.student?.roll_no && <Row k="Roll No" v={cert.student.roll_no} />}
                <Row k="Mobile" v={maskMobile(mobile) || "—"} />
              </Card>

              <Card title="Course & institute">
                <Row k="Course" v={cert.course?.name ?? "—"} />
                <Row k="Branch" v={cert.branch?.name ?? "—"} />
                <Row k="Certificate type" v={CERT_TYPE_LABEL[cert.certificate_type]} />
                {cert.template?.template_name && <Row k="Template" v={cert.template.template_name} />}
              </Card>

              <Card title="Certificate details">
                <Row k="Certificate No" v={<span className="font-mono">{cert.certificate_number}</span>} />
                <Row k="Issue date" v={new Date(cert.issue_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />
                {cert.completion_date && <Row k="Completion date" v={new Date(cert.completion_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />}
                {cert.grade && <Row k="Grade" v={cert.grade + (cert.percentage != null ? ` · ${cert.percentage}%` : "")} />}
                <Row k="Status" v={<span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${revoked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{CERT_STATUS_LABEL[cert.status]}</span>} />
              </Card>
            </div>

            <aside className="space-y-3">
              <div className={`rounded-3xl border-2 p-5 text-center ${revoked ? "border-rose-300 bg-rose-50" : "border-emerald-300 bg-emerald-50"}`}>
                <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${revoked ? "bg-rose-500" : "bg-emerald-500"} text-white shadow`}>
                  {revoked ? <Ban className="h-8 w-8"/> : <BadgeCheck className="h-8 w-8"/>}
                </div>
                <div className={`mt-3 text-lg font-black ${revoked ? "text-rose-700" : "text-emerald-700"}`}>
                  {revoked ? "Revoked" : "Authentic"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {revoked ? "Do not accept this certificate as valid." : "This certificate is valid and was issued by Krishna Computer Center."}
                </div>
              </div>
              <button onClick={() => window.print()} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><Printer className="h-4 w-4"/>Print result</button>
              <Link to="/certificate-verification" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl gradient-brand px-3 py-2 text-sm font-semibold text-white shadow-brand">Verify another</Link>
              <div className="rounded-xl border bg-white p-3 text-[10px] text-muted-foreground">
                Verification performed at {new Date().toLocaleString("en-IN")}.
              </div>
            </aside>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white shadow-soft">
      <div className="border-b px-5 py-3 text-xs font-bold uppercase tracking-wider text-brand-dark">{title}</div>
      <dl className="divide-y">{children}</dl>
    </div>
  );
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-5 py-2.5 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="col-span-2 font-semibold text-ink">{v}</dd>
    </div>
  );
}