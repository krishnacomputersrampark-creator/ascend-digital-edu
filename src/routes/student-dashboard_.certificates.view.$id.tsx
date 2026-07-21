import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Printer, ShieldCheck, Award, Ban } from "lucide-react";
import { getCertificate, CERT_TYPE_LABEL, CERT_STATUS_LABEL, certificateVerificationUrl, type CertificateRow } from "@/lib/certificates.repo";
import { downloadCertificatePdf, certificateQrDataUrl } from "@/lib/certificates.pdf";
import { toast } from "sonner";
import logoAsset from "@/assets/logo.jpg.asset.json";

export const Route = createFileRoute("/student-dashboard_/certificates/view/$id")({
  head: () => ({ meta: [{ title: "Certificate · KCC Student Portal" }, { name: "robots", content: "noindex" }] }),
  component: ViewCertificatePage,
  errorComponent: () => <div className="p-10 text-center text-sm text-muted-foreground">Unable to load certificate.</div>,
  notFoundComponent: () => <div className="p-10 text-center text-sm text-muted-foreground">Certificate not found.</div>,
});

function ViewCertificatePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [cert, setCert] = useState<CertificateRow | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const c = await getCertificate(id);
        setCert(c);
        if (c) setQr(await certificateQrDataUrl(c.certificate_number));
      } catch (e: any) { toast.error(e.message ?? "Failed"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand"/></div>;
  if (!cert) return <div className="p-10 text-center text-sm text-muted-foreground">Certificate not found.</div>;

  const revoked = cert.status === "revoked";

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <button onClick={() => router.history.back()} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Back</button>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><Printer className="h-4 w-4"/>Print</button>
            <button
              onClick={() => downloadCertificatePdf(cert).catch((e) => toast.error(e.message))}
              disabled={revoked}
              className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
            ><Download className="h-4 w-4"/>Download PDF</button>
            <Link to="/certificate-verification/$certificateNumber" params={{ certificateNumber: cert.certificate_number }} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-brand"/>Verify</Link>
          </div>
        </div>

        <CertificatePreview cert={cert} qr={qr} />
      </div>
    </div>
  );
}

export function CertificatePreview({ cert, qr }: { cert: CertificateRow; qr: string | null }) {
  const revoked = cert.status === "revoked";
  return (
    <div className="relative overflow-hidden rounded-3xl border-[6px] border-double border-brand bg-white p-10 shadow-brand print:border-2 print:shadow-none">
      <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-cyan/40"/>
      {revoked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rotate-[-18deg] rounded-2xl border-4 border-rose-500/60 px-10 py-4 text-6xl font-black uppercase tracking-widest text-rose-500/60">Revoked</div>
        </div>
      )}

      <div className="relative grid grid-cols-[80px,1fr,120px] items-center gap-4">
        <img src={logoAsset.url} alt="KCC" className="h-16 w-16 rounded-xl object-cover"/>
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-dark">Institute of Computer Education</div>
          <div className="mt-1 text-2xl font-black text-brand">KRISHNA COMPUTER CENTER</div>
        </div>
        {qr && <img src={qr} alt="QR" className="ml-auto h-20 w-20 rounded-lg border p-1"/>}
      </div>

      <div className="relative mt-6 text-center">
        <div className="mx-auto h-[3px] w-32 gradient-brand"/>
        <h1 className="mt-4 text-5xl font-black text-brand-dark">Certificate</h1>
        <div className="mt-1 text-lg font-semibold text-brand">of {CERT_TYPE_LABEL[cert.certificate_type]}</div>

        <p className="mt-8 text-sm italic text-slate-500">This is to certify that</p>
        <div className="mt-2 text-4xl font-black text-ink">{cert.student?.full_name}</div>
        <div className="mx-auto mt-2 h-px w-80 bg-slate-200"/>

        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-700">
          bearing Student ID <b>{cert.student?.student_code}</b>
          {cert.student?.roll_no && <> (Roll No: <b>{cert.student.roll_no}</b>)</>} has successfully completed the course
          {" "}<b>“{cert.course?.name ?? "—"}”</b>{cert.branch?.name && <> at <b>{cert.branch.name}</b> branch</>}
          {(cert.grade || cert.percentage != null) && (
            <> with {cert.grade && <>Grade <b>{cert.grade}</b></>}{cert.grade && cert.percentage != null && " and "}{cert.percentage != null && <><b>{cert.percentage}%</b></>}</>
          )}.
        </p>
      </div>

      <div className="relative mt-10 grid grid-cols-3 items-end gap-6 text-sm">
        <div>
          <div className="text-[10px] font-bold uppercase text-brand-dark">Certificate No</div>
          <div className="font-mono font-semibold">{cert.certificate_number}</div>
          <div className="mt-3 text-[10px] font-bold uppercase text-brand-dark">Issue Date</div>
          <div className="font-semibold">{new Date(cert.issue_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
          {cert.completion_date && <>
            <div className="mt-3 text-[10px] font-bold uppercase text-brand-dark">Completion Date</div>
            <div className="font-semibold">{new Date(cert.completion_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </>}
        </div>
        <div className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-brand/40 text-[10px] font-bold text-brand">
            OFFICIAL<br/>SEAL · KCC
          </div>
        </div>
        <div className="text-center">
          <div className="mx-auto h-10 w-40 border-b border-slate-400"/>
          <div className="mt-1 text-xs font-bold text-ink">Authorized Signatory</div>
          <div className="text-[10px] text-muted-foreground">Krishna Computer Center</div>
        </div>
      </div>

      <div className="relative mt-8 rounded-xl border border-dashed bg-slate-50 p-3 text-center text-[10px] text-muted-foreground">
        Verify authenticity at <b>{certificateVerificationUrl(cert.certificate_number)}</b> · Status: <b>{CERT_STATUS_LABEL[cert.status]}</b>
      </div>
    </div>
  );
}