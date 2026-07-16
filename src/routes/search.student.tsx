import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, User } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/search/student")({
  head: () => ({ meta: [{ title: "Search Student — Krishna Computer Center" }, { name: "description", content: "Search a student by name, ID, mobile or enrollment number." }] }),
  component: () => {
    const [q, setQ] = useState("");
    const [found, setFound] = useState(false);
    return (
      <SiteLayout>
        <PageHero eyebrow="Directory" title={<>Search a <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Student</span></>} subtitle="Find a student by name, ID, mobile or enrollment number." />
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <form onSubmit={(e)=>{e.preventDefault();setFound(true);}} className="flex gap-2 rounded-3xl border bg-white p-3 shadow-soft">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-cyan-soft/40 px-4">
                <Search className="h-4 w-4 text-brand" />
                <input required value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Name / Student ID / Mobile / Enrollment No" className="w-full bg-transparent py-3 text-sm focus:outline-none" />
              </div>
              <button className="rounded-2xl gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-brand">Search</button>
            </form>
            {found && (
              <div className="mt-8 overflow-hidden rounded-3xl border bg-white shadow-soft">
                <div className="flex items-center gap-4 gradient-brand-dark p-6 text-white">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-lg font-extrabold backdrop-blur"><User className="h-6 w-6" /></span>
                  <div>
                    <div className="text-lg font-bold">Priya Sharma</div>
                    <div className="text-xs text-white/70">KCC2024/00123 · Active</div>
                  </div>
                </div>
                <dl className="grid gap-3 p-5 text-sm sm:grid-cols-2">
                  {[["Course","ADCA"],["Branch","Karawal Nagar"],["Batch","Morning · 2024"],["Status","Active"]].map(([k,v]) => (
                    <div key={k} className="rounded-xl bg-cyan-soft/60 p-3">
                      <dt className="text-[10px] font-semibold uppercase text-brand-dark">{k}</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      </SiteLayout>
    );
  },
});