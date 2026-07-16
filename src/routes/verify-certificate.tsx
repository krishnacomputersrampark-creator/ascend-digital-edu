import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, QrCode, Search, Download, Printer, ShieldCheck } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/verify-certificate")({
  head: () => ({
    meta: [
      { title: "Verify Certificate — Krishna Computer Center" },
      { name: "description", content: "Verify authenticity of Krishna Computer Center certificates using certificate number, student ID, mobile or QR code." },
      { property: "og:title", content: "Certificate Verification — Krishna Computer Center" },
      { property: "og:description", content: "Instant online verification of course completion certificates." },
    ],
  }),
  component: VerifyCertificatePage,
});

function VerifyCertificatePage() {
  const [tab, setTab] = useState<"cert" | "sid" | "mob" | "qr">("cert");
  const [q, setQ] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Trust & Verification"
        title={<>Verify a <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Certificate</span></>}
        subtitle="Confirm authenticity of any Krishna Computer Center certificate in seconds."
      />
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-white p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap gap-1 rounded-full bg-cyan-soft p-1 text-xs font-semibold">
              {([["cert","Certificate No"],["sid","Student ID"],["mob","Mobile"],["qr","QR Code"]] as const).map(([k,l]) => (
                <button key={k} onClick={()=>setTab(k)} className={`flex-1 rounded-full px-3 py-1.5 transition ${tab===k?"gradient-brand text-white shadow-brand":"text-ink/70"}`}>{l}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setOk(true); }} className="mt-5 flex flex-col gap-3 sm:flex-row">
              {tab === "qr" ? (
                <div className="flex-1 rounded-2xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
                  <QrCode className="mx-auto h-10 w-10 text-brand" />
                  <p className="mt-2">Scan the QR code on your certificate using your camera.</p>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-brand/30">
                  <Search className="h-4 w-4 text-brand" />
                  <input required value={q} onChange={(e)=>setQ(e.target.value)} placeholder={tab==="cert"?"e.g. KCC/ADCA/2024/00123":tab==="sid"?"e.g. KCC2024/00123":"10-digit mobile"} className="w-full bg-transparent text-sm focus:outline-none" />
                </div>
              )}
              <button className="inline-flex items-center justify-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5">
                <ShieldCheck className="h-4 w-4" /> Verify
              </button>
            </form>
            {ok && (
              <div className="mt-6 overflow-hidden rounded-2xl border bg-cyan-soft/60">
                <div className="flex items-center gap-2 gradient-brand px-5 py-3 text-white">
                  <BadgeCheck className="h-5 w-5" /><span className="text-sm font-bold">Verified · Authentic Certificate</span>
                </div>
                <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2">
                  {[["Student Name","Priya Sharma"],["Course","ADCA — Advanced Diploma"],["Certificate No","KCC/ADCA/2024/00123"],["Issue Date","12 Feb 2024"],["Grade","A · 87%"],["Status","Active"]].map(([k,v])=>(
                    <div key={k} className="rounded-xl bg-white p-3">
                      <dt className="text-[10px] font-semibold uppercase text-brand-dark">{k}</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex gap-2 border-t bg-white p-4">
                  <button className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> Download PDF</button>
                  <button onClick={()=>typeof window!=="undefined"&&window.print()} className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand px-4 py-2 text-xs font-semibold text-brand"><Printer className="h-3.5 w-3.5" /> Print</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}