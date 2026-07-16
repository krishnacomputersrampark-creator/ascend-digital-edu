import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { X, ZoomIn, Share2, Maximize2 } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Photo Gallery — Krishna Computer Center" },
      { name: "description", content: "Photos from classrooms, events, workshops, seminars and celebrations at Krishna Computer Center." },
      { property: "og:title", content: "Photo Gallery — Krishna Computer Center" },
      { property: "og:description", content: "Life at Krishna Computer Center — classrooms, events, workshops and more." },
    ],
  }),
  component: GalleryPage,
});

const CATS = ["All","Computer Lab","Classroom","Annual Function","Republic Day","Independence Day","Certificate Distribution","Workshop","Seminars","Industrial Visit","Festival"];

const PHOTOS = Array.from({ length: 24 }, (_, i) => {
  const cat = CATS[(i % (CATS.length - 1)) + 1];
  const seed = i + 10;
  const h = 400 + (i % 4) * 120;
  return { id: i, cat, url: `https://picsum.photos/seed/kcc-gallery-${seed}/800/${h}`, h };
});

function GalleryPage() {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const list = useMemo(() => PHOTOS.filter(p => cat==="All" || p.cat===cat), [cat]);
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Moments"
        title={<>Life at <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Krishna Computer Center</span></>}
        subtitle="Classrooms, labs, celebrations and student milestones."
      />
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={()=>setCat(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${cat===c?"gradient-brand text-white shadow-brand":"border bg-white text-ink/70 hover:border-brand"}`}>{c}</button>
            ))}
          </div>
          <div className="mt-8 columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
            {list.map((p, i) => (
              <button key={p.id} onClick={()=>setOpen(i)} className="mb-4 block w-full overflow-hidden rounded-2xl bg-cyan-soft shadow-soft transition hover:-translate-y-0.5 hover:shadow-brand focus:outline-none">
                <img loading="lazy" src={p.url} alt={`${p.cat} — Krishna Computer Center`} className="w-full transition duration-500 hover:scale-105" />
              </button>
            ))}
          </div>
        </div>
      </section>
      {open !== null && list[open] && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4">
          <button onClick={()=>setOpen(null)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur" aria-label="Close"><X className="h-5 w-5" /></button>
          <img src={list[open].url} alt="Preview" className="max-h-[85vh] max-w-[95vw] rounded-2xl shadow-brand" />
          <div className="absolute bottom-6 flex gap-3 rounded-full bg-white/10 px-2 py-1 backdrop-blur">
            <button className="grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Zoom"><ZoomIn className="h-5 w-5" /></button>
            <button className="grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Share"><Share2 className="h-5 w-5" /></button>
            <button className="grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10" aria-label="Fullscreen"><Maximize2 className="h-5 w-5" /></button>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}