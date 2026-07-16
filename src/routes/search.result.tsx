import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Download, Printer } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/search/result")({
  head: () => ({ meta: [{ title: "Search Result — Krishna Computer Center" }, { name: "description", content: "Search student results by roll number, student ID or course." }] }),
  component: () => {
    const [ok,setOk]=useState(false);
    return (
      <SiteLayout>
        <PageHero eyebrow="Examinations" title={<>Search <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Result</span></>} subtitle="Look up results by roll number, student ID or course." />
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <form onSubmit={(e)=>{e.preventDefault();setOk(true);}} className="grid gap-3 rounded-3xl border bg-white p-5 shadow-soft sm:grid-cols-4">
              <input required placeholder="Roll No" className="rounded-xl border px-3 py-2.5 text-sm sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-brand/30" />
              <input placeholder="Student ID" className="rounded-xl border px-3 py-2.5 text-sm sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-brand/30" />
              <select className="rounded-xl border bg-white px-3 py-2.5 text-sm sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-brand/30"><option>ADCA</option><option>DCA</option><option>CCC</option><option>Python</option></select>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand"><Search className="h-4 w-4" /> Search</button>
            </form>
            {ok && (
              <div className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-soft">
                <div className="gradient-brand-dark p-6 text-white">
                  <div className="text-xs uppercase tracking-widest text-white/70">Result Card</div>
                  <div className="mt-1 text-lg font-extrabold">Priya Sharma · ADCA · Semester 2</div>
                </div>
                <div className="grid gap-3 p-5 text-sm sm:grid-cols-3">
                  {[["Total","518 / 600"],["Percentage","86.3%"],["Grade","A"]].map(([k,v]) => (
                    <div key={k} className="rounded-xl bg-cyan-soft/60 p-4 text-center">
                      <div className="text-[10px] font-semibold uppercase text-brand-dark">{k}</div>
                      <div className="mt-1 text-xl font-extrabold gradient-text">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 border-t p-4">
                  <Link to="/student/results" className="rounded-full border-2 border-brand px-4 py-2 text-xs font-semibold text-brand">Full Marksheet</Link>
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