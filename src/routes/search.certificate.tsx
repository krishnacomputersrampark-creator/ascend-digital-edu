import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, BadgeCheck, Download, Printer, QrCode } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/search/certificate")({
  head: () => ({ meta: [{ title: "Search Certificate — Krishna Computer Center" }, { name: "description", content: "Search and verify a certificate by number, student ID or QR code." }] }),
  component: () => {
    const [ok,setOk]=useState(false);
    return (
      <SiteLayout>
        <PageHero eyebrow="Credentials" title={<>Search <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Certificate</span></>} subtitle="Search using certificate number, student ID or scan QR code." />
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <form onSubmit={(e)=>{e.preventDefault();setOk(true);}} className="rounded-3xl border bg-white p-5 shadow-soft">
              <div className="grid gap-3 sm:grid-cols-3">
                <input required placeholder="Certificate No" className="rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                <input placeholder="Student ID" className="rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                <button className="inline-flex items-center justify-center gap-1.5 rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand"><Search className="h-4 w-4" /> Search</button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-xs text-muted-foreground">
                <QrCode className="h-5 w-5 text-brand" /> or scan the QR code on the certificate
              </div>
            </form>
            {ok && (
              <div className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-brand">
                <div className="flex items-center gap-2 gradient-brand px-5 py-3 text-white"><BadgeCheck className="h-5 w-5" /><span className="font-bold">Verified · Authentic</span></div>
                <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2">
                  {[["Student","Priya Sharma"],["Course","ADCA"],["Cert No","KCC/ADCA/2024/00123"],["Issued","12 Feb 2024"]].map(([k,v]) => (
                    <div key={k} className="rounded-xl bg-cyan-soft/60 p-3"><dt className="text-[10px] font-semibold uppercase text-brand-dark">{k}</dt><dd className="mt-0.5 font-semibold text-ink">{v}</dd></div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2 border-t p-4">
                  <Link to="/verify-certificate" className="rounded-full border-2 border-brand px-4 py-2 text-xs font-semibold text-brand">Detailed Verify</Link>
                  <button className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> Download</button>
                  <button onClick={()=>typeof window!=="undefined"&&window.print()} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold"><Printer className="h-3.5 w-3.5" /> Print</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </SiteLayout>
    );
  },
});