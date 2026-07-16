import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Download, Printer, Search } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/student/results")({
  head: () => ({ meta: [{ title: "My Results — Krishna Computer Center" }, { name: "description", content: "View, download and print semester, internal and final results." }, { name: "robots", content: "noindex" }] }),
  component: ResultsPage,
});

const MARKS = [
  { subject: "Fundamentals of Computer", max: 100, obt: 88 },
  { subject: "Operating Systems", max: 100, obt: 82 },
  { subject: "MS Office & Internet", max: 100, obt: 91 },
  { subject: "Programming with Python", max: 100, obt: 79 },
  { subject: "Tally Prime with GST", max: 100, obt: 85 },
  { subject: "Practical & Viva", max: 100, obt: 93 },
];

function ResultsPage() {
  const [tab, setTab] = useState<"sem" | "int" | "final">("sem");
  const total = MARKS.reduce((s,m)=>s+m.obt,0);
  const max = MARKS.reduce((s,m)=>s+m.max,0);
  const pct = Math.round((total/max)*100);
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Examinations"
        title={<>Result <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Card</span></>}
        subtitle="Semester, internal and final results with printable marksheet."
      />
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-cyan-soft p-1 text-xs font-semibold">
              {([["sem","Semester"],["int","Internal"],["final","Final"]] as const).map(([k,l]) => (
                <button key={k} onClick={()=>setTab(k)} className={`rounded-full px-4 py-1.5 transition ${tab===k?"gradient-brand text-white shadow-brand":"text-ink/70"}`}>{l}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs">
                <Search className="h-3.5 w-3.5 text-brand" />
                <input placeholder="Roll No / Student ID" className="w-40 bg-transparent text-sm focus:outline-none" />
              </label>
              <button className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-1.5 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> Download</button>
              <button onClick={()=>typeof window!=="undefined"&&window.print()} className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand px-4 py-1.5 text-xs font-semibold text-brand"><Printer className="h-3.5 w-3.5" /> Print</button>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-soft">
            <div className="relative gradient-brand-dark p-6 text-white">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan/40 blur-3xl" />
              </div>
              <div className="relative flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/15 backdrop-blur"><GraduationCap className="h-6 w-6" /></span>
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/70">Krishna Computer Center</div>
                  <div className="text-lg font-extrabold">Official {tab==="sem"?"Semester":tab==="int"?"Internal":"Final"} Marksheet</div>
                </div>
              </div>
              <dl className="relative mt-5 grid gap-3 text-sm sm:grid-cols-4">
                {[["Name","Priya Sharma"],["Student ID","KCC2024/00123"],["Course","ADCA"],["Roll No","024-A-11"]].map(([k,v]) => (
                  <div key={k} className="rounded-xl bg-white/10 p-3 backdrop-blur">
                    <dt className="text-[10px] uppercase text-white/70">{k}</dt>
                    <dd className="font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="overflow-x-auto p-2 sm:p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-3">Subject</th><th className="p-3">Max</th><th className="p-3">Obtained</th><th className="p-3">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {MARKS.map((m) => (
                    <tr key={m.subject}>
                      <td className="p-3 font-semibold text-ink">{m.subject}</td>
                      <td className="p-3">{m.max}</td>
                      <td className="p-3 font-bold text-brand">{m.obt}</td>
                      <td className="p-3">{m.obt>=85?"A+":m.obt>=75?"A":m.obt>=60?"B":"C"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-cyan-soft/60">
                    <td className="p-3 font-bold">Total</td>
                    <td className="p-3 font-bold">{max}</td>
                    <td className="p-3 font-bold gradient-text">{total}</td>
                    <td className="p-3 font-bold">{pct}% · {pct>=75?"Distinction":"Pass"}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}