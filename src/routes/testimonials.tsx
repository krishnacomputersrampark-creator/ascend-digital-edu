import { createFileRoute } from "@tanstack/react-router";
import { Star, Play } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/testimonials")({
  head: () => ({ meta: [{ title: "Testimonials — Krishna Computer Center" }, { name: "description", content: "Real stories from Krishna Computer Center students who transformed their careers." }] }),
  component: TestimonialsPage,
});

const T = [
  { n:"Priya Sharma", c:"ADCA Graduate", b:"Karawal Nagar", q:"The faculty made programming feel simple. Within months I was writing real projects.", r:5 },
  { n:"Rahul Verma", c:"NIELIT O Level", b:"Loni", q:"Practical lab sessions and mock tests helped me clear O Level in first attempt.", r:5 },
  { n:"Aisha Khan", c:"Digital Marketing", b:"Karawal Nagar", q:"Learnt SEO, Ads and Analytics with real campaigns. Now handling social for a D2C brand.", r:5 },
  { n:"Manoj Kumar", c:"Tally Prime", b:"Loni", q:"Affordable fees, personal attention. GST modules were exactly what my family business needed.", r:5 },
  { n:"Sneha Patel", c:"Python Developer", b:"Karawal Nagar", q:"Hands-on approach gave me the confidence to build my own projects and start freelancing.", r:5 },
  { n:"Arjun Singh", c:"CCC · Bank Job", b:"Loni", q:"Cracked my bank clerk exam with the CCC certification. Big thanks to the mentors.", r:5 },
];

function TestimonialsPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Loved by students" title={<>Student <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">stories</span></>} subtitle="Real reviews from learners who moved forward in their careers." />
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {T.map((t) => (
              <figure key={t.n} className="relative rounded-3xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                <div className="flex items-center gap-1 text-yellow-500">{Array.from({length:t.r}).map((_,k)=><Star key={k} className="h-4 w-4 fill-current" />)}</div>
                <blockquote className="mt-4 text-sm leading-relaxed text-ink/85">"{t.q}"</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
                  <span className="grid h-11 w-11 place-items-center rounded-full gradient-brand text-base font-bold text-white">{t.n[0]}</span>
                  <div><div className="text-sm font-bold text-ink">{t.n}</div><div className="text-xs text-muted-foreground">{t.c} · {t.b}</div></div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0,1,2].map(i => (
              <a key={i} href="#video" className="group relative overflow-hidden rounded-3xl border shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                <img src={`https://picsum.photos/seed/kcc-test-${i}/600/340`} alt="Video testimonial" loading="lazy" className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 grid place-items-center bg-black/30"><span className="grid h-14 w-14 place-items-center rounded-full bg-white text-brand shadow-brand"><Play className="h-6 w-6 fill-current" /></span></span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}