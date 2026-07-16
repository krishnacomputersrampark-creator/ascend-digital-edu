import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Phone, MessageCircle, Mail, Navigation, MapPin, Building2, CheckCircle2, Send, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Krishna Computer Center" },
      { name: "description", content: "Reach Krishna Computer Center in Karawal Nagar (Delhi) and Rampark Loni (Ghaziabad). Phone, WhatsApp, email and directions." },
      { property: "og:title", content: "Contact Krishna Computer Center" },
      { property: "og:description", content: "Two Delhi NCR branches — visit, call or message." },
    ],
  }),
  component: ContactPage,
});

const BRANCHES = [
  { name: "Karawal Nagar Branch", line1: "H-3, Gali No.35, West Karawal Nagar", line2: "North East Delhi — 110094", phones: ["9289400281","9911193913"], whatsapp: "9911193913", email: "krishnacomputercenter.nielit@gmail.com", map: "https://maps.google.com/maps?q=Karawal+Nagar+Delhi&output=embed" },
  { name: "Rampark Loni Branch", line1: "G-2851, Rana Chowk, Rampark Extension", line2: "Loni, Ghaziabad, UP — 201102", phones: ["9289400286","9911193913"], whatsapp: "9289400286", email: "krishnacomputercenter.nielit@gmail.com", map: "https://maps.google.com/maps?q=Rampark+Loni+Ghaziabad&output=embed" },
];

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <SiteLayout>
      <PageHero eyebrow="Two branches across Delhi NCR" title={<>Get in <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Touch</span></>} subtitle="Call, WhatsApp, email or visit — we're here to help." />
      <section className="py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          {BRANCHES.map((b) => (
            <div key={b.name} className="overflow-hidden rounded-3xl border bg-white shadow-soft">
              <iframe title={b.name} src={b.map} loading="lazy" className="aspect-[16/9] w-full border-0" allowFullScreen />
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-brand"><Building2 className="h-5 w-5" /></span>
                  <div>
                    <h3 className="text-lg font-bold text-ink">{b.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground"><MapPin className="mr-1 inline h-4 w-4 text-brand" />{b.line1}<br /><span className="ml-5">{b.line2}</span></p>
                  </div>
                </div>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-cyan-soft/70 p-3"><dt className="text-[10px] font-semibold uppercase text-brand-dark">Phone</dt><dd className="mt-0.5 font-semibold text-ink">{b.phones.join(" · ")}</dd></div>
                  <div className="rounded-xl bg-cyan-soft/70 p-3"><dt className="text-[10px] font-semibold uppercase text-brand-dark">WhatsApp</dt><dd className="mt-0.5 font-semibold text-ink">{b.whatsapp}</dd></div>
                  <div className="rounded-xl bg-cyan-soft/70 p-3 sm:col-span-2"><dt className="text-[10px] font-semibold uppercase text-brand-dark">Email</dt><dd className="mt-0.5 break-all font-semibold text-ink">{b.email}</dd></div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={`tel:${b.phones[0]}`} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-brand"><Phone className="h-3.5 w-3.5" /> Call</a>
                  <a href={`https://wa.me/91${b.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                  <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand px-4 py-2 text-xs font-semibold text-brand"><Mail className="h-3.5 w-3.5" /> Email</a>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.line1+" "+b.line2)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/20 px-4 py-2 text-xs font-semibold"><Navigation className="h-3.5 w-3.5" /> Directions</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-5 lg:px-8">
          <div className="md:col-span-3">
            <form onSubmit={(e)=>{e.preventDefault();setSent(true);}} className="rounded-3xl border bg-white p-6 shadow-soft sm:p-8">
              <h2 className="text-xl font-bold text-ink">Send us a message</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll respond within one working day.</p>
              {sent ? (
                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
                  <CheckCircle2 className="h-6 w-6" /> Thanks! Your message has been received.
                </motion.div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Fld label="Name" name="name" required />
                  <Fld label="Phone" name="phone" type="tel" required />
                  <Fld label="Email" name="email" type="email" required className="sm:col-span-2" />
                  <Fld label="Subject" name="subject" required className="sm:col-span-2" />
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">Message</span>
                    <textarea required rows={5} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                  </label>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-brand sm:col-span-2"><Send className="h-4 w-4" /> Send Message</button>
                </div>
              )}
            </form>
          </div>
          <div className="md:col-span-2 rounded-3xl border bg-white p-6 shadow-soft">
            <h3 className="text-base font-bold text-ink">Follow us</h3>
            <p className="mt-1 text-sm text-muted-foreground">Stay updated with events, tips and student stories.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[{i:Facebook,l:"Facebook"},{i:Instagram,l:"Instagram"},{i:Youtube,l:"YouTube"},{i:Linkedin,l:"LinkedIn"}].map(({i:Icon,l}) => (
                <a key={l} href="#" className="group flex items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-brand">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-soft text-brand transition group-hover:gradient-brand group-hover:text-white"><Icon className="h-4 w-4" /></span>
                  <span className="text-sm font-semibold">{l}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Fld({ label, name, type="text", required, className }: any) {
  return (
    <label className={`block ${className||""}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</span>
      <input name={name} type={type} required={required} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
    </label>
  );
}