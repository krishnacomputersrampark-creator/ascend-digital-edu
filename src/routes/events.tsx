import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Events — Krishna Computer Center" }, { name: "description", content: "Workshops, competitions, seminars, guest lectures and annual functions at Krishna Computer Center." }] }),
  component: EventsPage,
});

const UPCOMING = [
  { d: new Date(Date.now()+1000*60*60*24*7).toISOString(), title: "Python Coding Bootcamp", type: "Workshop", venue: "Karawal Nagar Lab", img: "https://picsum.photos/seed/kcc-ev-1/600/360" },
  { d: new Date(Date.now()+1000*60*60*24*14).toISOString(), title: "MS Excel Championship", type: "Competition", venue: "Loni Campus", img: "https://picsum.photos/seed/kcc-ev-2/600/360" },
  { d: new Date(Date.now()+1000*60*60*24*21).toISOString(), title: "Digital Marketing Seminar", type: "Seminar", venue: "Karawal Nagar Hall", img: "https://picsum.photos/seed/kcc-ev-3/600/360" },
];
const PAST = [
  { d: "20 Dec 2025", title: "Annual Function 2025", type: "Function", img: "https://picsum.photos/seed/kcc-past-1/600/360" },
  { d: "26 Jan 2025", title: "Republic Day Celebration", type: "Event", img: "https://picsum.photos/seed/kcc-past-2/600/360" },
  { d: "05 Nov 2024", title: "Guest Lecture — Career in IT", type: "Guest Lecture", img: "https://picsum.photos/seed/kcc-past-3/600/360" },
];

function Countdown({ iso }: { iso: string }) {
  const [t,setT]=useState(0);
  useEffect(()=>{ const id=setInterval(()=>setT(Math.max(0, new Date(iso).getTime()-Date.now())),1000); return ()=>clearInterval(id);},[iso]);
  const d=Math.floor(t/86400000), h=Math.floor(t/3600000)%24, m=Math.floor(t/60000)%60;
  return <div className="flex gap-2 text-xs font-bold">{[[d,"D"],[h,"H"],[m,"M"]].map(([v,l])=>(<span key={l as string} className="rounded-lg bg-cyan-soft px-2 py-1 text-brand-dark">{v}<span className="ml-0.5 text-[10px] opacity-70">{l}</span></span>))}</div>;
}

function EventsPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Learn Beyond Class" title={<>Events & <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Workshops</span></>} subtitle="Hands-on bootcamps, guest lectures and cultural celebrations." />
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-ink">Upcoming Events</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {UPCOMING.map((e) => (
              <article key={e.title} className="group overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                <div className="relative aspect-video overflow-hidden">
                  <img src={e.img} alt={e.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase text-brand-dark">{e.type}</span>
                </div>
                <div className="space-y-3 p-5">
                  <h3 className="text-base font-bold text-ink">{e.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-brand" /> {new Date(e.d).toDateString()}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand" /> {e.venue}</span>
                  </div>
                  <Countdown iso={e.d} />
                  <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-brand">Register <ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
              </article>
            ))}
          </div>
          <h2 className="mt-16 text-xl font-bold text-ink">Past Events</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PAST.map((e) => (
              <div key={e.title} className="overflow-hidden rounded-3xl border bg-white shadow-soft">
                <img src={e.img} alt={e.title} loading="lazy" className="aspect-video w-full object-cover" />
                <div className="p-5">
                  <div className="text-xs text-muted-foreground">{e.d} · {e.type}</div>
                  <div className="mt-1 text-base font-bold text-ink">{e.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}