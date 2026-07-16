import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog — Krishna Computer Center" }, { name: "description", content: "Tips on computer skills, career guidance, government schemes, programming, digital marketing and typing." }] }),
  component: BlogPage,
});

const CATS = ["All","Computer Tips","Career Guidance","Government Schemes","Technology","Programming","Digital Marketing","Typing Tips"];
const POSTS = [
  { t:"5 Government Certifications That Actually Get You Hired", c:"Government Schemes", d:"18 Mar 2026", img:0 },
  { t:"How to Master Touch Typing in 30 Days", c:"Typing Tips", d:"14 Mar 2026", img:1 },
  { t:"Python vs Java: Which to Learn First in 2026", c:"Programming", d:"10 Mar 2026", img:2 },
  { t:"SEO Basics for Small Business Owners", c:"Digital Marketing", d:"05 Mar 2026", img:3 },
  { t:"Career Roadmap After 12th for Non-Engineers", c:"Career Guidance", d:"28 Feb 2026", img:4 },
  { t:"10 MS Excel Shortcuts You'll Use Daily", c:"Computer Tips", d:"20 Feb 2026", img:5 },
];

function BlogPage() {
  const [cat,setCat]=useState("All");
  const list = POSTS.filter(p => cat==="All"||p.c===cat);
  return (
    <SiteLayout>
      <PageHero eyebrow="Learn everyday" title={<>Our <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Blog</span></>} subtitle="Tips, guides and career advice from our mentors." />
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATS.map(c=>(<button key={c} onClick={()=>setCat(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${cat===c?"gradient-brand text-white shadow-brand":"border bg-white text-ink/70 hover:border-brand"}`}>{c}</button>))}
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(p=>(
              <article key={p.t} className="group overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                <img loading="lazy" src={`https://picsum.photos/seed/kcc-blog-${p.img}/600/360`} alt={p.t} className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-5">
                  <span className="rounded-full bg-cyan-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-dark">{p.c}</span>
                  <h3 className="mt-3 text-base font-bold text-ink">{p.t}</h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {p.d}</span>
                    <a href="#post" className="inline-flex items-center gap-1 font-semibold text-brand">Read <ArrowRight className="h-3.5 w-3.5" /></a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}