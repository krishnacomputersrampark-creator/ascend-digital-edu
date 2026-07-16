import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Download } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/student/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Krishna Computer Center" }, { name: "description", content: "Monthly attendance dashboard with calendar view, percentage and downloadable report." }, { name: "robots", content: "noindex" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const status: Record<number, "P" | "A" | "L"> = {};
  days.forEach((d) => { status[d] = d % 11 === 0 ? "A" : d % 17 === 0 ? "L" : "P"; });
  const p = days.filter((d) => status[d] === "P").length;
  const a = days.filter((d) => status[d] === "A").length;
  const l = days.filter((d) => status[d] === "L").length;
  const pct = Math.round((p / days.length) * 100);
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Academic"
        title={<>My <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Attendance</span></>}
        subtitle="Track your monthly presence and download reports."
        actions={
          <button className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark shadow-brand hover:-translate-y-0.5 transition">
            <Download className="h-4 w-4" /> Download Report
          </button>
        }
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[["Present", p, "emerald"], ["Absent", a, "red"], ["Leave", l, "amber"], ["Percentage", `${pct}%`, "blue"]].map(([k, v]) => (
              <div key={k as string} className="rounded-2xl border bg-white p-6 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k as string}</div>
                <div className="mt-2 text-4xl font-extrabold gradient-text">{v as string | number}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cyan-soft">
                  <div className="h-full gradient-brand" style={{ width: `${((Number((v as any)) || pct) / (typeof v === "number" ? 30 : 100)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-3xl border bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-brand" /> March 2026</h2>
                <span className="text-xs text-muted-foreground">P = Present · A = Absent · L = Leave</span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-1.5 text-xs">
                {["S","M","T","W","T","F","S"].map((d) => <div key={d} className="text-center font-semibold text-muted-foreground">{d}</div>)}
                {Array.from({ length: 5 }).map((_,i) => <div key={`e${i}`}/>)}
                {days.map((d) => (
                  <div key={d} className={`aspect-square rounded-lg p-1.5 text-left ${status[d]==="P"?"bg-emerald-50 text-emerald-700":status[d]==="A"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>
                    <div className="text-[10px] font-semibold">{d}</div>
                    <div className="mt-1 text-[10px] font-bold">{status[d]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border bg-white p-6 shadow-soft">
              <h2 className="text-lg font-bold text-ink">History</h2>
              <ul className="mt-4 divide-y">
                {[
                  { m: "February 2026", p: 24, a: 1, l: 0, pct: 96 },
                  { m: "January 2026", p: 22, a: 2, l: 1, pct: 88 },
                  { m: "December 2025", p: 20, a: 3, l: 2, pct: 80 },
                ].map((r) => (
                  <li key={r.m} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-semibold text-ink">{r.m}</span>
                    <span className="text-muted-foreground">{r.p}P · {r.a}A · {r.l}L</span>
                    <span className="font-bold text-brand">{r.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}