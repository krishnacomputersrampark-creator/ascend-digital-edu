import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — Krishna Computer Center" }, { name: "description", content: "Answers to common questions about admission, certificates, results, fees and online study." }] }),
  component: FaqPage,
});

const QA = [
  ["How to take admission?", "Visit our Admission page, fill the online form, upload documents and submit. You'll get an application number instantly and our counsellor will confirm within one working day."],
  ["How to download my certificate?", "Log in to Student Zone, open Certificates and download the PDF. Verified certificates carry a QR code for authenticity."],
  ["How can I verify a certificate?", "Use the Verify Certificate page and enter certificate number, student ID or scan the QR code."],
  ["How do I check my result?", "Log in and open the Results section, or use Search Result with your roll number."],
  ["How to download a fee receipt?", "Go to Fees inside Student Zone and click Download / Print next to any paid installment."],
  ["Which government courses are available?", "NIELIT CCC, O Level and skill-affiliated diplomas like ADCA, DCA and PGDCA."],
  ["Is placement assistance available?", "Yes — resume prep, interview training and referrals through our employer network."],
  ["Can I study online?", "Selected courses offer hybrid classes with recorded lectures and online tests."],
];

function FaqPage() {
  const [open, setOpen] = useState(0);
  return (
    <SiteLayout>
      <PageHero eyebrow="Help Center" title={<>Frequently asked <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">questions</span></>} subtitle="Quick answers to the most common queries from students and parents." />
      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {QA.map(([q,a],i) => (
              <div key={q} className={`overflow-hidden rounded-2xl border bg-white shadow-soft transition ${open===i?"ring-2 ring-brand/30":""}`}>
                <button onClick={()=>setOpen(open===i?-1:i)} className="flex w-full items-center justify-between gap-3 p-5 text-left">
                  <span className="text-sm font-bold text-ink sm:text-base">{q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-brand transition-transform ${open===i?"rotate-180":""}`} />
                </button>
                {open===i && <p className="px-5 pb-5 text-sm text-muted-foreground">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}