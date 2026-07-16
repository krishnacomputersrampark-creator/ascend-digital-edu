import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Pin, Download, ArrowRight } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/notice")({
  head: () => ({ meta: [{ title: "Notice Board — Krishna Computer Center" }, { name: "description", content: "Latest notices — admissions, exams, holidays, results, events, scholarships and jobs." }] }),
  component: NoticePage,
});

const CATS = ["All","Admissions","Exam","Holiday","Results","Events","Scholarships","Jobs","Urgent"];
const NOTICES = [
  { d: "18 Mar 2026", cat: "Urgent", title: "Semester 2 Practical Exam Rescheduled to 25 Mar", pinned: true, important: true },
  { d: "15 Mar 2026", cat: "Admissions", title: "2026 Batch Admissions Open — Limited Seats" },
  { d: "12 Mar 2026", cat: "Results", title: "Semester 1 Results Published — Download Marksheet" },
  { d: "10 Mar 2026", cat: "Holiday", title: "Holi Holiday: 14–15 March 2026" },
  { d: "05 Mar 2026", cat: "Events", title: "Annual Function Registration Open" },
  { d: "02 Mar 2026", cat: "Scholarships", title: "Merit Scholarship for Top 5 ADCA Students" },
  { d: "28 Feb 2026", cat: "Jobs", title: "Data Entry Openings for CCC/DCA Passouts" },
  { d: "25 Feb 2026", cat: "Exam", title: "Internal Test Series Begins 3rd Mar" },
];

function NoticePage() {
  const [cat, setCat] = useState("All");
  const list = NOTICES.filter(n => cat==="All" || n.cat===cat);
  const pinned = NOTICES.filter(n => n.pinned);
  return (
    <SiteLayout>
      <PageHero eyebrow="Stay Updated" title={<>Notice <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Board</span></>} subtitle="Announcements, exam schedules, results and important circulars.">
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/25 bg-white/10 py-2 backdrop-blur">
          <div className="flex animate-marquee gap-12 whitespace-nowrap px-4 text-sm font-semibold text-white">
            {[...NOTICES, ...NOTICES].map((n,i)=>(<span key={i}>📌 {n.title}</span>))}
          </div>
        </div>
      </PageHero>
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {pinned.length>0 && (
            <div className="mb-8 rounded-3xl border-2 border-brand/30 bg-cyan-soft/50 p-5 shadow-soft">
              <div className="flex items-center gap-2 text-brand-dark"><Pin className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider">Pinned</span></div>
              {pinned.map(p => <p key={p.title} className="mt-2 text-base font-bold text-ink">{p.title}</p>)}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => <button key={c} onClick={()=>setCat(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${cat===c?"gradient-brand text-white shadow-brand":"border bg-white text-ink/70 hover:border-brand"}`}>{c}</button>)}
          </div>
          <ul className="mt-6 divide-y overflow-hidden rounded-3xl border bg-white shadow-soft">
            {list.map((n,i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-cyan-soft/30">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-soft text-brand"><Bell className="h-5 w-5" /></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-cyan-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-dark">{n.cat}</span>
                      {n.important && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-700">Important</span>}
                      <span className="text-xs text-muted-foreground">{n.d}</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-ink">{n.title}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"><Download className="h-3 w-3" /> PDF</button>
                  <button className="inline-flex items-center gap-1 rounded-full gradient-brand px-3 py-1.5 text-xs font-semibold text-white">Details <ArrowRight className="h-3 w-3" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}