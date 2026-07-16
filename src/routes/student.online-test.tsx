import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MonitorPlay, Timer, Trophy, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/student/online-test")({
  head: () => ({ meta: [{ title: "Online Test — Krishna Computer Center" }, { name: "description", content: "Practice upcoming tests, review past results, take MCQ exams with timer." }, { name: "robots", content: "noindex" }] }),
  component: OnlineTestPage,
});

const QUESTIONS = [
  { q: "Which of these is not an OS?", opts: ["Windows","Linux","Oracle","macOS"], a: 2 },
  { q: "HTML stands for?", opts: ["Hyper Trainer Marking Language","HyperText Markup Language","HighText Machine Language","None"], a: 1 },
  { q: "1 KB equals?", opts: ["1000 bits","1024 bytes","1024 bits","100 bytes"], a: 1 },
  { q: "Python is a?", opts: ["Compiled","Interpreted","Assembly","Markup"], a: 1 },
  { q: "Full form of GST?", opts: ["General Sales Tax","Goods & Services Tax","Global Sales Tax","Government Standard Tax"], a: 1 },
];

function OnlineTestPage() {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [time, setTime] = useState(600);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setTime((s) => (s <= 1 ? (setDone(true), 0) : s - 1)), 1000);
    return () => clearInterval(t);
  }, [started, done]);
  const mm = String(Math.floor(time/60)).padStart(2,"0");
  const ss = String(time%60).padStart(2,"0");
  const score = Object.entries(ans).filter(([k,v]) => QUESTIONS[Number(k)].a === v).length;
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Examination"
        title={<>Online <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Test Center</span></>}
        subtitle="Attempt upcoming MCQs, review past scores, and see how you rank."
      />
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {!started && !done && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 rounded-3xl border bg-white p-6 shadow-soft">
                <h2 className="text-lg font-bold text-ink flex items-center gap-2"><MonitorPlay className="h-5 w-5 text-brand" /> Upcoming Tests</h2>
                <ul className="mt-4 divide-y">
                  {[
                    { name: "ADCA Mid-Term MCQ", date: "24 Mar · 10:00 AM", q: 30, t: "45m" },
                    { name: "Python Basics Quiz", date: "26 Mar · 3:00 PM", q: 20, t: "30m" },
                    { name: "Tally GST Test", date: "30 Mar · 11:00 AM", q: 25, t: "40m" },
                  ].map((r, k) => (
                    <li key={r.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <div className="text-sm font-bold text-ink">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.date} · {r.q} Qs · {r.t}</div>
                      </div>
                      <button onClick={()=>k===0&&setStarted(true)} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-brand">Start Test <ArrowRight className="h-3.5 w-3.5" /></button>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-8 text-sm font-bold text-ink">Previous Attempts</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {[["ADCA Unit 1", 78],["Python Intro", 84],["Fundamentals", 92]].map(([n,s]) => (
                    <li key={n as string} className="flex items-center justify-between rounded-xl bg-cyan-soft/60 px-4 py-2">
                      <span className="font-semibold">{n as string}</span><span className="font-bold text-brand">{s as number}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border bg-white p-6 shadow-soft">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" /> Leaderboard</h3>
                <ol className="mt-4 space-y-2 text-sm">
                  {[["Aditi K.",96],["Rahul V.",93],["Priya S.",91],["Manoj T.",88],["Aisha K.",85]].map(([n,s],idx) => (
                    <li key={n as string} className="flex items-center justify-between rounded-xl border p-2.5">
                      <span className="flex items-center gap-2"><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${idx<3?"gradient-brand text-white":"bg-cyan-soft text-brand"}`}>{idx+1}</span>{n as string}</span>
                      <span className="font-bold gradient-text">{s as number}%</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {started && !done && (
            <div className="rounded-3xl border bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink">Question {i+1} / {QUESTIONS.length}</div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600"><Timer className="h-4 w-4" /> {mm}:{ss}</div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cyan-soft"><div className="h-full gradient-brand" style={{width:`${((i+1)/QUESTIONS.length)*100}%`}} /></div>
              <h2 className="mt-6 text-lg font-bold text-ink">{QUESTIONS[i].q}</h2>
              <div className="mt-4 grid gap-2">
                {QUESTIONS[i].opts.map((o, k) => (
                  <button key={o} onClick={()=>setAns({...ans,[i]:k})} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${ans[i]===k?"border-brand bg-cyan-soft":"hover:bg-cyan-soft/50"}`}>
                    <span className="mr-3 inline-grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-brand ring-1 ring-border">{String.fromCharCode(65+k)}</span>{o}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <button disabled={i===0} onClick={()=>setI(i-1)} className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand px-4 py-2 text-sm font-semibold text-brand disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Previous</button>
                <div className="flex gap-1.5">
                  {QUESTIONS.map((_,k) => <button key={k} onClick={()=>setI(k)} className={`h-7 w-7 rounded-md text-xs font-bold ${k===i?"gradient-brand text-white":ans[k]!==undefined?"bg-emerald-100 text-emerald-700":"bg-cyan-soft text-brand"}`}>{k+1}</button>)}
                </div>
                {i<QUESTIONS.length-1 ? (
                  <button onClick={()=>setI(i+1)} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand">Next <ArrowRight className="h-4 w-4" /></button>
                ) : (
                  <button onClick={()=>setDone(true)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Submit <CheckCircle2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          )}

          {done && (
            <div className="rounded-3xl border bg-white p-8 text-center shadow-soft">
              <span className="inline-grid h-16 w-16 place-items-center rounded-full gradient-brand text-white shadow-brand"><Trophy className="h-8 w-8" /></span>
              <h2 className="mt-4 text-2xl font-extrabold text-ink">Test Submitted</h2>
              <p className="mt-1 text-muted-foreground">You scored</p>
              <div className="mt-2 text-5xl font-extrabold gradient-text">{score} / {QUESTIONS.length}</div>
              <p className="mt-3 text-sm text-muted-foreground">Performance analytics will be available on your dashboard shortly.</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}