import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Linkedin, Instagram, Youtube, GraduationCap } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/faculty")({
  head: () => ({ meta: [{ title: "Faculty — Krishna Computer Center" }, { name: "description", content: "Meet the experienced mentors at Krishna Computer Center — programming, accounting, design and government-exam specialists." }] }),
  component: FacultyPage,
});

const F = [
  { n:"Kukku Sharma", q:"MCA, PGDCA", exp:"15+ yrs", sp:"Founder · NIELIT & Career Programs" },
  { n:"Anita Rao", q:"M.Sc. Computer Science", exp:"10 yrs", sp:"Python · Java · Data Structures" },
  { n:"Rajeev Mehra", q:"MBA Finance", exp:"12 yrs", sp:"Tally Prime · GST · Payroll" },
  { n:"Neha Gupta", q:"B.Des. Visual Communication", exp:"8 yrs", sp:"Photoshop · Illustrator · UI Design" },
  { n:"Sameer Khan", q:"MCA, NIELIT Trainer", exp:"9 yrs", sp:"CCC · O Level · MS Office" },
  { n:"Priti Verma", q:"M.Sc. IT", exp:"7 yrs", sp:"Web · HTML · CSS · JavaScript" },
  { n:"Amit Chauhan", q:"PG Digital Marketing", exp:"6 yrs", sp:"SEO · Google Ads · Analytics" },
  { n:"Sunita Yadav", q:"M.A. Education", exp:"11 yrs", sp:"Soft Skills · Career Counselling" },
];

function FacultyPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Our Mentors" title={<>Meet the <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">faculty</span></>} subtitle="Experienced educators who blend theory with hands-on industry practice." />
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {F.map((f) => (
              <article key={f.n} className="group overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                <div className="relative aspect-square gradient-brand-dark p-6 text-white">
                  <div className="absolute inset-0 opacity-40"><div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-cyan/30 blur-3xl" /></div>
                  <div className="relative grid h-full place-items-center text-5xl font-extrabold">{f.n.split(" ").map(x=>x[0]).slice(0,2).join("")}</div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-ink">{f.n}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-brand"><GraduationCap className="h-3.5 w-3.5" /> {f.q}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><b>Experience:</b> {f.exp}</p>
                  <p className="text-xs text-muted-foreground"><b>Specialization:</b> {f.sp}</p>
                  <div className="mt-4 flex gap-1.5">
                    {[Facebook,Linkedin,Instagram,Youtube].map((Ic,i)=>(<a key={i} href="#" className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-soft text-brand transition hover:gradient-brand hover:text-white"><Ic className="h-3.5 w-3.5" /></a>))}
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