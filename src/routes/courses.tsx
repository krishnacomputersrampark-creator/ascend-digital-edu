import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { GraduationCap, BookOpen, Award, ShieldCheck, Cpu, Code2, Brain, Calculator, Palette, Globe2, LineChart, Sparkles, ChevronRight } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — Krishna Computer Center" },
      { name: "description", content: "20+ job-oriented computer courses including ADCA, DCA, PGDCA, CCC, O Level, Python, Java, Tally, Web & Digital Marketing." },
      { property: "og:title", content: "Courses — Krishna Computer Center" },
      { property: "og:description", content: "Government-certified, career-focused computer courses across two Delhi NCR branches." },
    ],
  }),
  component: CoursesPage,
});

const COURSES = [
  { icon: GraduationCap, name: "ADCA", desc: "Advanced Diploma in Computer Applications", duration: "12 Months", tag: "Popular" },
  { icon: BookOpen, name: "DCA", desc: "Diploma in Computer Applications", duration: "6 Months" },
  { icon: Award, name: "PGDCA", desc: "Post Graduate Diploma in Computer Applications", duration: "12 Months" },
  { icon: ShieldCheck, name: "CCC", desc: "Course on Computer Concepts — NIELIT", duration: "3 Months", tag: "Govt." },
  { icon: Cpu, name: "O Level", desc: "NIELIT O Level Foundation Course", duration: "1 Year", tag: "Govt." },
  { icon: Code2, name: "Python", desc: "Programming, Data & Automation", duration: "3 Months" },
  { icon: Brain, name: "Java", desc: "Core & Advanced Java Development", duration: "4 Months" },
  { icon: Cpu, name: "C++", desc: "Object Oriented Programming", duration: "3 Months" },
  { icon: Calculator, name: "Tally Prime", desc: "Accounting, GST & Payroll", duration: "2 Months" },
  { icon: Palette, name: "Graphic Designing", desc: "Photoshop · Illustrator · CorelDRAW", duration: "3 Months" },
  { icon: Globe2, name: "Web Designing", desc: "HTML · CSS · JavaScript · Responsive", duration: "3 Months" },
  { icon: LineChart, name: "Digital Marketing", desc: "SEO · Ads · Social · Analytics", duration: "3 Months", tag: "Hot" },
];

function CoursesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="20+ Programs"
        title={<>Job-ready <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">courses</span> for every learner</>}
        subtitle="From foundational certifications to advanced developer tracks — practical, affordable and government-recognized."
        actions={<Link to="/admission" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow-brand hover:-translate-y-0.5 transition"><Sparkles className="h-4 w-4" /> Apply for Admission</Link>}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {COURSES.map((c, i) => (
              <motion.article
                key={c.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: (i % 4) * 0.05 }}
                className="group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand text-white shadow-brand"><c.icon className="h-7 w-7" /></span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-cyan-soft px-3 py-1 text-xs font-semibold text-brand-dark">{c.duration}</span>
                    {c.tag && <span className="rounded-full bg-gradient-to-r from-brand to-cyan px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">{c.tag}</span>}
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink">{c.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.desc}</p>
                <Link to="/admission" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand transition group-hover:gap-2">Enroll <ChevronRight className="h-4 w-4" /></Link>
                <span className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-cyan/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}