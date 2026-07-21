import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldCheck, QrCode, Loader2 } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { verifyCertificate, verifyByStudentAndCert } from "@/lib/certificates.repo";
import { toast } from "sonner";

export const Route = createFileRoute("/certificate-verification")({
  head: () => ({
    meta: [
      { title: "Verify Certificate — Krishna Computer Center" },
      { name: "description", content: "Instantly verify authenticity of any Krishna Computer Center certificate by number, student ID or QR code." },
      { property: "og:title", content: "Certificate Verification — Krishna Computer Center" },
      { property: "og:description", content: "Confirm authenticity of KCC certificates in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"cert" | "sid" | "qr">("cert");
  const [certNo, setCertNo] = useState("");
  const [sid, setSid] = useState("");
  const [sidCert, setSidCert] = useState("");
  const [loading, setLoading] = useState(false);

  const onCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certNo.trim()) return;
    setLoading(true);
    try {
      const c = await verifyCertificate(certNo.trim());
      if (!c) { toast.error("Certificate not found"); return; }
      nav({ to: "/certificate-verification/$certificateNumber", params: { certificateNumber: c.certificate_number } });
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setLoading(false); }
  };
  const onSid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sid.trim()) return;
    setLoading(true);
    try {
      const c = await verifyByStudentAndCert(sid.trim(), sidCert.trim() || undefined);
      if (!c) { toast.error("No matching certificate found"); return; }
      nav({ to: "/certificate-verification/$certificateNumber", params: { certificateNumber: c.certificate_number } });
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Trust & Verification"
        title={<>Verify a <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Certificate</span></>}
        subtitle="Confirm authenticity of any Krishna Computer Center certificate in seconds."
      />
      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-white p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap gap-1 rounded-full bg-cyan-soft p-1 text-xs font-semibold">
              {([["cert","Certificate No"],["sid","Student ID"],["qr","QR Code"]] as const).map(([k,l]) => (
                <button key={k} onClick={()=>setTab(k)} className={`flex-1 rounded-full px-3 py-1.5 transition ${tab===k?"gradient-brand text-white shadow-brand":"text-ink/70"}`}>{l}</button>
              ))}
            </div>

            {tab === "cert" && (
              <form onSubmit={onCert} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
                  <Search className="h-4 w-4 text-brand"/>
                  <input required value={certNo} onChange={(e)=>setCertNo(e.target.value)} placeholder="e.g. KCC-CERT-2026-000001" className="w-full bg-transparent text-sm focus:outline-none"/>
                </div>
                <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4"/>} Verify
                </button>
              </form>
            )}

            {tab === "sid" && (
              <form onSubmit={onSid} className="mt-5 grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
                <input required value={sid} onChange={(e)=>setSid(e.target.value)} placeholder="Student ID (e.g. KCC26XXXXX)" className="rounded-xl border px-3 py-2.5 text-sm"/>
                <input value={sidCert} onChange={(e)=>setSidCert(e.target.value)} placeholder="Certificate No (optional)" className="rounded-xl border px-3 py-2.5 text-sm"/>
                <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4"/>} Verify
                </button>
              </form>
            )}

            {tab === "qr" && (
              <div className="mt-5 rounded-2xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
                <QrCode className="mx-auto h-10 w-10 text-brand"/>
                <p className="mt-2">Scan the QR code printed on the certificate using your phone camera. It opens the verification page directly.</p>
              </div>
            )}

            <p className="mt-6 rounded-xl bg-cyan-soft/50 p-3 text-[11px] text-brand-dark">
              Every KCC certificate is signed with a unique <b>KCC-CERT-YYYY-000000</b> number and a QR verification link. If a certificate is not found or appears revoked, please contact us.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}