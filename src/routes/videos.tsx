import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/videos")({
  head: () => ({ meta: [{ title: "Video Gallery — Krishna Computer Center" }, { name: "description", content: "Watch event coverage, student success stories, institute tour, workshops and more." }] }),
  component: VideosPage,
});

const CATS = ["All","Events","Student Success","Institute Tour","Computer Classes","Workshops","Seminars"];
const VIDEOS = Array.from({length: 9}, (_,i) => ({ id: i, cat: CATS[(i%(CATS.length-1))+1], title: `KCC ${["Annual Day","Student Story","Tour","Class in Session","Workshop","Seminar"][i%6]}`, thumb: `https://picsum.photos/seed/kcc-video-${i+20}/600/340` }));

function VideosPage() {
  const [cat, setCat] = useState("All");
  const list = VIDEOS.filter(v => cat==="All" || v.cat===cat);
  return (
    <SiteLayout>
      <PageHero eyebrow="Watch & Learn" title={<>Video <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Gallery</span></>} subtitle="Institute walkthroughs, student stories, workshops and events." />
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={()=>setCat(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${cat===c?"gradient-brand text-white shadow-brand":"border bg-white text-ink/70 hover:border-brand"}`}>{c}</button>
            ))}
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((v) => (
              <a key={v.id} href="#video" className="group relative overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                <img loading="lazy" src={v.thumb} alt={v.title} className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-brand shadow-brand transition group-hover:scale-110"><Play className="h-7 w-7 fill-current" /></span>
                </span>
                <div className="absolute bottom-0 p-4 text-white">
                  <div className="text-[10px] uppercase tracking-widest text-white/70">{v.cat}</div>
                  <div className="text-sm font-bold">{v.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}