import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Users, Megaphone, Cpu, ShieldCheck, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/franchise")({
  head: () => ({ meta: [{ title: "Franchise Opportunity — Krishna Computer Center" }, { name: "description", content: "Partner with Krishna Computer Center — training, brand, marketing, ERP and certification support." }] }),
  component: FranchisePage,
});

const B = [
  { icon: GraduationCap, t: "Training Support", d: "Faculty training, sample lessons and lesson plans." },
  { icon: Award, t: "Brand Support", d: "Signage, prospectus and standard operating procedures." },
  { icon: Megaphone, t: "Marketing Support", d: "Local ad creatives, digital campaigns and lead flow." },
  { icon: Cpu, t: "ERP Support", d: "Cloud ERP for admissions, fees, attendance and reports." },
  { icon: ShieldCheck, t: "Certification", d: "Recognized certificates issued centrally." },
  { icon: Users, t: "Student Support", d: "Dedicated support desk for student queries." },
];

function FranchisePage() {
  const [sent, setSent] = useState(false);
  return (
    <SiteLayout>
      <PageHero eyebrow="Grow with us" title={<>Franchise <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">opportunity</span></>} subtitle="Open a Krishna Computer Center branded center in your city with end-to-end support." />
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {B.map(({icon:Icon,t,d}) => (
              <div key={t} className="group rounded-3xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-white shadow-brand"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-base font-bold text-ink">{t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-cyan-soft/60 p-8">
              <h2 className="text-2xl font-extrabold text-ink">Why partner with us?</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink/80">
                {["Since 2014 with 250+ students trained","Government-recognized programs","Low investment, high margin model","Turn-key setup within 30 days"].map(i => (<li key={i} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{i}</li>))}
              </ul>
            </div>
            <form onSubmit={(e)=>{e.preventDefault();setSent(true);}} className="rounded-3xl border bg-white p-6 shadow-soft">
              <h2 className="text-xl font-bold text-ink">Apply Now</h2>
              {sent ? (
                <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">Thanks! Our franchise team will contact you shortly.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  <input required placeholder="Full Name" className="rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <input required type="tel" placeholder="Mobile Number" className="rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <input required type="email" placeholder="Email" className="rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <input required placeholder="City / Location of Interest" className="rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <textarea rows={3} placeholder="Tell us about yourself" className="rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-semibold text-white shadow-brand">Submit Application <ArrowRight className="h-4 w-4" /></button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}