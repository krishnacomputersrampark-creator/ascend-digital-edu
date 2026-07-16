import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "motion/react";
import {
  GraduationCap,
  Award,
  Monitor,
  Users,
  Wallet,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Rocket,
  BookOpen,
  Building2,
  Star,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Navigation,
  Play,
  ArrowRight,
  Code2,
  Palette,
  Globe2,
  Database,
  Calculator,
  LineChart,
  Brain,
  Cpu,
  Facebook,
  Instagram,
  Youtube,
  Send,
  Linkedin,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  Target,
  Eye,
} from "lucide-react";
import heroLab from "@/assets/hero-lab.jpg";
import aboutStudents from "@/assets/about-students.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

/* ---------------- Reusable primitives ---------------- */

function Counter({ to, suffix = "", duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration, mv]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-cyan-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-dark">
          <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
        </span>
      )}
      <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-muted-foreground sm:text-lg">{subtitle}</p>}
    </div>
  );
}

/* ---------------- Header ---------------- */

const NAV = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Courses", href: "#courses" },
  { label: "Student Zone", href: "#student-zone" },
  { label: "Downloads", href: "#downloads" },
  { label: "Gallery", href: "#gallery" },
  { label: "Notice Board", href: "#notice" },
  { label: "Contact", href: "#contact" },
];

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 shadow-soft backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-brand">
            <GraduationCap className="h-6 w-6" />
          </span>
          <span className="flex flex-col leading-tight">
            <span
              className={`text-sm font-bold sm:text-base ${
                scrolled ? "text-ink" : "text-white"
              }`}
            >
              KRISHNA COMPUTER CENTER
            </span>
            <span
              className={`text-[10px] sm:text-xs ${
                scrolled ? "text-muted-foreground" : "text-white/80"
              }`}
            >
              Empowering Students Through Digital Education
            </span>
          </span>
        </a>
        <nav className="hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-ink/80 hover:bg-cyan-soft hover:text-brand"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href="#login"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              scrolled ? "text-ink hover:text-brand" : "text-white hover:text-cyan-soft"
            }`}
          >
            Login
          </a>
          <a
            href="#admission"
            className="rounded-full border-2 border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            Admission
          </a>
          <a
            href="#apply"
            className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:opacity-95"
          >
            Apply Now <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`grid h-11 w-11 place-items-center rounded-xl xl:hidden ${
            scrolled ? "bg-cyan-soft text-brand" : "bg-white/10 text-white"
          }`}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-white shadow-soft xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-1 px-4 py-4">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-cyan-soft hover:text-brand"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t pt-3">
              <a href="#login" className="rounded-full border border-border px-4 py-2 text-center text-sm font-semibold">
                Login
              </a>
              <a href="#apply" className="rounded-full gradient-brand px-4 py-2 text-center text-sm font-semibold text-white">
                Apply Now
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Hero ---------------- */

const HERO_STATS = [
  { value: 250, suffix: "+", label: "Students" },
  { value: 20, suffix: "+", label: "Courses" },
  { value: 20, suffix: "+", label: "Years Experience" },
  { value: 2, suffix: "", label: "Branches" },
  { value: 100, suffix: "%", label: "Career Support" },
];

const SLIDES = [
  { title: "Admission Open — 2026 Batch", tag: "New Batches Starting Soon", cta: "Enroll Today" },
  { title: "Government Certified Courses", tag: "NIELIT · CCC · O Level", cta: "View Certifications" },
  { title: "Job Oriented Programs", tag: "Industry Aligned Curriculum", cta: "Explore Careers" },
  { title: "Digital Skills for Everyone", tag: "From Basics to Advanced", cta: "Start Learning" },
  { title: "Future Ready Education", tag: "Practical · Modern · Trusted", cta: "Meet Our Mentors" },
];

function Hero() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <section id="home" className="relative isolate overflow-hidden pt-24 pb-24 sm:pt-28 md:pb-32">
      {/* background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroLab}
          alt="Krishna Computer Center — modern computer lab with students learning to code"
          width={1600}
          height={1008}
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,66,152,0.92)_0%,rgba(13,110,253,0.82)_45%,rgba(0,200,255,0.55)_100%)]" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan/30 blur-3xl animate-blob" />
        <div className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-brand-dark/50 blur-3xl animate-blob" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-7">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" /> Trusted Since 2014
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-5 text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Learn Today.
            <br />
            <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">
              Lead Tomorrow.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-2xl text-base text-white/85 sm:text-lg"
          >
            Empowering Students Through Digital Education with industry-focused computer
            training, government-certified programs, practical labs, and career-oriented
            learning.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#apply"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-dark shadow-brand transition hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Apply Online <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Explore Courses
            </a>
            <a
              href="#video"
              className="inline-flex items-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-white transition hover:text-cyan-soft"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 backdrop-blur">
                <Play className="h-4 w-4 fill-white" />
              </span>
              Watch Video
            </a>
          </motion.div>

          {/* Slider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 max-w-xl overflow-hidden rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-lg"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan text-brand-dark">
                <Rocket className="h-5 w-5" />
              </span>
              <div key={slide} className="min-w-0 flex-1 animate-[fade-in_.5s_ease]">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-soft">
                  {SLIDES[slide].tag}
                </p>
                <p className="truncate text-base font-semibold text-white sm:text-lg">
                  {SLIDES[slide].title}
                </p>
              </div>
              <a
                href="#apply"
                className="hidden shrink-0 rounded-full bg-cyan px-4 py-2 text-xs font-semibold text-brand-dark sm:inline-flex"
              >
                {SLIDES[slide].cta}
              </a>
            </div>
            <div className="mt-3 flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all ${
                    i === slide ? "w-8 bg-white" : "w-3 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Floating stats */}
        <div className="lg:col-span-5">
          <div className="relative mx-auto grid max-w-md grid-cols-2 gap-4">
            {HERO_STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`glass-card rounded-2xl p-5 ${
                  i === 2 ? "col-span-2" : ""
                } ${i % 2 === 0 ? "animate-float-slow" : ""}`}
                style={{ animationDelay: `${i * 0.6}s` }}
              >
                <div className="text-3xl font-extrabold gradient-text sm:text-4xl">
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-sm font-medium text-ink/70">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trust strip ---------------- */

const TRUST = [
  { icon: Award, label: "Since 2014" },
  { icon: ShieldCheck, label: "Govt. Certified" },
  { icon: BookOpen, label: "Quality Education" },
  { icon: Monitor, label: "Modern Labs" },
  { icon: Users, label: "Expert Faculty" },
  { icon: Wallet, label: "Affordable Fees" },
  { icon: Briefcase, label: "Placement Guidance" },
];

function TrustStrip() {
  return (
    <section className="border-y bg-white/60 py-10 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Trusted by Students Since 2014
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {TRUST.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition hover:bg-cyan-soft"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-soft text-brand transition group-hover:gradient-brand group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-ink/80">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- About ---------------- */

function About() {
  return (
    <section id="about" className="relative py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="relative">
          <div className="absolute -left-4 -top-4 h-24 w-24 rounded-3xl gradient-brand opacity-20 blur-2xl" />
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-3xl bg-cyan/40 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white shadow-brand">
            <img
              src={aboutStudents}
              alt="Students at Krishna Computer Center learning digital skills"
              width={1200}
              height={900}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="glass-card absolute -bottom-8 left-6 flex items-center gap-3 rounded-2xl px-4 py-3 sm:left-10">
            <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs text-muted-foreground">Government</div>
              <div className="text-sm font-bold text-ink">Recognized Certificates</div>
            </div>
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow="About the Institute"
            center={false}
            title={
              <>
                About <span className="gradient-text">Krishna Computer Center</span>
              </>
            }
            subtitle="Established in 2014, Krishna Computer Center is committed to quality computer education with practical training and career-oriented programs. Under the leadership of Mr. Kukku Sharma, we've empowered hundreds of students with digital skills for today's technology-driven world."
          />
          <p className="mt-4 text-muted-foreground">
            Our focus is on practical learning, industry-recognized certifications,
            government-affiliated courses, affordable education, and personalized guidance.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "Established", v: "2014" },
              { k: "Students", v: "250+" },
              { k: "Courses", v: "20+" },
              { k: "Experience", v: "20+" },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border bg-white/70 p-4 shadow-soft">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.k}
                </dt>
                <dd className="mt-1 text-2xl font-extrabold text-ink">{s.v}</dd>
              </div>
            ))}
          </dl>

          {/* Vision / Mission */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="glass-card rounded-2xl p-5">
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white">
                <Eye className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-lg font-bold text-ink">Our Vision</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Empowering every student with digital skills for a brighter future.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <span className="inline-grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white">
                <Target className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-lg font-bold text-ink">Our Mission</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Quality computer education that empowers students with practical skills,
                career opportunities, and lifelong learning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why Choose Us ---------------- */

const WHY = [
  { icon: BookOpen, title: "Quality Education", desc: "Structured curriculum with proven outcomes." },
  { icon: Users, title: "Experienced Faculty", desc: "Mentors with real industry experience." },
  { icon: ShieldCheck, title: "Government Certified", desc: "NIELIT, CCC, O Level programs." },
  { icon: Cpu, title: "Industry Curriculum", desc: "Skills matched to today's jobs." },
  { icon: Monitor, title: "Modern Labs", desc: "Latest hardware and software stack." },
  { icon: Wallet, title: "Affordable Fees", desc: "Flexible plans and scholarships." },
  { icon: Briefcase, title: "Career Guidance", desc: "Resume, interview & aptitude prep." },
  { icon: Rocket, title: "Placement Support", desc: "Employer network and referrals." },
  { icon: Code2, title: "Practical Training", desc: "Hands-on projects each module." },
  { icon: Award, title: "Recognized Certificates", desc: "Credentials that employers value." },
  { icon: Sparkles, title: "Friendly Environment", desc: "Small batches, personal attention." },
  { icon: Building2, title: "Multi-Branch Institute", desc: "Two convenient Delhi NCR campuses." },
];

function WhyChoose() {
  return (
    <section className="relative py-24 sm:py-28" style={{ background: "var(--gradient-soft)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why Choose Us"
          title={<>Everything you need to <span className="gradient-text">succeed</span></>}
          subtitle="From certified faculty to modern labs, our institute is engineered to make your learning practical, credible and career-ready."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {WHY.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 4) * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-soft text-brand transition group-hover:gradient-brand group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Partners marquee & Achievements ---------------- */

const PARTNERS = [
  "IBM",
  "Microsoft",
  "NIELIT",
  "Skill India",
  "Digital India",
  "CSC Academy",
  "Infosys",
  "P2E",
];

function Partners() {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Achievements & Partners"
          title={<>Trained with <span className="gradient-text">industry leaders</span></>}
          subtitle="Programs affiliated with globally recognized brands and government initiatives."
        />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {PARTNERS.map((p) => (
            <div
              key={p}
              className="group flex h-24 items-center justify-center rounded-2xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-brand"
            >
              <span className="text-base font-extrabold text-muted-foreground grayscale transition group-hover:gradient-text group-hover:grayscale-0">
                {p}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-14 overflow-hidden border-y bg-cyan-soft/60 py-6">
        <div className="flex w-max animate-marquee gap-14 whitespace-nowrap px-8">
          {[...PARTNERS, ...PARTNERS].map((p, i) => (
            <span key={i} className="text-2xl font-extrabold text-brand-dark/70">
              {p} <span className="mx-6 text-cyan">•</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Branches ---------------- */

const BRANCHES = [
  {
    name: "Karawal Nagar Branch",
    line1: "H-3, Gali No.35, West Karawal Nagar",
    line2: "North East Delhi — 110094",
    phones: ["9289400281", "9911193913"],
    whatsapp: "9911193913",
    email: "krishnacomputercenter.nielit@gmail.com",
    maps: "https://www.google.com/maps/search/?api=1&query=Krishna+Computer+Center+Karawal+Nagar",
  },
  {
    name: "Rampark Loni Branch",
    line1: "G-2851, Rana Chowk, Rampark Extension",
    line2: "Loni, Ghaziabad, UP — 201102",
    phones: ["9289400286", "9911193913"],
    whatsapp: "9289400286",
    email: "krishnacomputercenter.nielit@gmail.com",
    maps: "https://www.google.com/maps/search/?api=1&query=Krishna+Computer+Center+Rampark+Loni",
  },
];

function Branches() {
  return (
    <section id="contact" className="py-24 sm:py-28" style={{ background: "var(--gradient-soft)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Branches"
          title={<>Visit us across <span className="gradient-text">Delhi NCR</span></>}
          subtitle="Two well-equipped campuses ready to welcome students and parents for a walk-in counselling session."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {BRANCHES.map((b) => (
            <div
              key={b.name}
              className="group relative overflow-hidden rounded-3xl border bg-white p-8 shadow-soft transition hover:shadow-brand"
            >
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan/20 blur-3xl transition group-hover:bg-cyan/30" />
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl gradient-brand text-white shadow-brand">
                  <Building2 className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-ink">{b.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <MapPin className="mr-1 inline h-4 w-4 text-brand" />
                    {b.line1}
                    <br />
                    <span className="ml-5">{b.line2}</span>
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-cyan-soft/70 p-3">
                  <dt className="text-xs font-semibold uppercase text-brand-dark">Phone</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{b.phones.join(" · ")}</dd>
                </div>
                <div className="rounded-xl bg-cyan-soft/70 p-3">
                  <dt className="text-xs font-semibold uppercase text-brand-dark">WhatsApp</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{b.whatsapp}</dd>
                </div>
                <div className="rounded-xl bg-cyan-soft/70 p-3 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-brand-dark">Email</dt>
                  <dd className="mt-0.5 break-all font-semibold text-ink">{b.email}</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href={b.maps}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-brand"
                >
                  <MapPin className="h-3.5 w-3.5" /> Google Map
                </a>
                <a
                  href={`tel:${b.phones[0]}`}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand px-4 py-2 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
                <a
                  href={`https://wa.me/91${b.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500 hover:text-white"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <a
                  href={b.maps}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-ink hover:text-white"
                >
                  <Navigation className="h-3.5 w-3.5" /> Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Counters band ---------------- */

const BAND_STATS = [
  { v: 250, s: "+", l: "Students Trained" },
  { v: 20, s: "+", l: "Professional Courses" },
  { v: 2, s: "", l: "Branches" },
  { v: 20, s: "+", l: "Years Experience" },
  { v: 100, s: "%", l: "Student Satisfaction" },
];

function CounterBand() {
  return (
    <section className="relative overflow-hidden py-20 gradient-brand-dark">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-cyan/30 blur-3xl animate-blob" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl animate-blob" />
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 text-white sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-8">
        {BAND_STATS.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-4xl font-extrabold sm:text-5xl">
              <Counter to={s.v} suffix={s.s} />
            </div>
            <div className="mt-2 text-sm font-medium text-white/80">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Courses ---------------- */

const COURSES = [
  { icon: GraduationCap, name: "ADCA", desc: "Advanced Diploma in Computer Applications", duration: "12 Months" },
  { icon: BookOpen, name: "DCA", desc: "Diploma in Computer Applications", duration: "6 Months" },
  { icon: Award, name: "PGDCA", desc: "Post Graduate Diploma in Computer Applications", duration: "12 Months" },
  { icon: ShieldCheck, name: "CCC", desc: "Course on Computer Concepts — NIELIT", duration: "3 Months" },
  { icon: Cpu, name: "O Level", desc: "NIELIT O Level Foundation Course", duration: "1 Year" },
  { icon: Code2, name: "Python", desc: "Programming, Data & Automation", duration: "3 Months" },
  { icon: Brain, name: "Java", desc: "Core & Advanced Java Development", duration: "4 Months" },
  { icon: Cpu, name: "C++", desc: "Object Oriented Programming", duration: "3 Months" },
  { icon: Calculator, name: "Tally Prime", desc: "Accounting, GST & Payroll", duration: "2 Months" },
  { icon: Palette, name: "Graphic Designing", desc: "Photoshop · Illustrator · CorelDRAW", duration: "3 Months" },
  { icon: Globe2, name: "Web Designing", desc: "HTML · CSS · JavaScript · Responsive", duration: "3 Months" },
  { icon: LineChart, name: "Digital Marketing", desc: "SEO · Ads · Social · Analytics", duration: "3 Months" },
];

function Courses() {
  return (
    <section id="courses" className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Courses"
          title={<>Job-ready programs for <span className="gradient-text">every learner</span></>}
          subtitle="From foundational certifications to advanced developer tracks, choose a program aligned with your career goals."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COURSES.map(({ icon: Icon, name, desc, duration }, i) => (
            <motion.article
              key={name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 4) * 0.05 }}
              className="group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-2xl gradient-brand text-white shadow-brand">
                  <Icon className="h-7 w-7" />
                </span>
                <span className="rounded-full bg-cyan-soft px-3 py-1 text-xs font-semibold text-brand-dark">
                  {duration}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink">{name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              <a
                href={`#course-${name}`}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand transition group-hover:gap-2"
              >
                Learn More <ChevronRight className="h-4 w-4" />
              </a>
              <span className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-cyan/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */

function CTASection() {
  return (
    <section id="apply" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] gradient-brand-dark p-10 shadow-brand sm:p-14">
        <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-cyan/30 blur-3xl animate-blob" />
        <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-blob" />
        <div className="relative grid gap-8 lg:grid-cols-5 lg:items-center">
          <div className="lg:col-span-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Admissions Open
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
              Start Your Digital Career Today
            </h2>
            <p className="mt-4 max-w-2xl text-white/85">
              Admissions are now open for professional computer courses. Join Krishna
              Computer Center and build your future with practical skills and recognized
              certifications.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-2 lg:justify-end">
            <a
              href="#apply-form"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-dark shadow-brand transition hover:-translate-y-0.5"
            >
              Apply Now <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    course: "ADCA Graduate",
    quote:
      "The faculty here made programming feel simple. Within months I was writing real projects and cracked my first IT support role.",
    initial: "P",
  },
  {
    name: "Rahul Verma",
    course: "O Level, NIELIT",
    quote:
      "Practical lab sessions and mock tests helped me clear O Level in first attempt. Highly recommended in Delhi NCR.",
    initial: "R",
  },
  {
    name: "Aisha Khan",
    course: "Digital Marketing",
    quote:
      "Learnt SEO, Ads and Analytics with real campaigns. Now handling social media for a local D2C brand full-time.",
    initial: "A",
  },
  {
    name: "Manoj Kumar",
    course: "Tally Prime",
    quote:
      "Very affordable fees and personal attention. GST and payroll modules were exactly what my family business needed.",
    initial: "M",
  },
];

function Testimonials() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="py-24 sm:py-28" style={{ background: "var(--gradient-soft)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Student Stories"
          title={<>Loved by <span className="gradient-text">our students</span></>}
          subtitle="Real stories from learners who started at Krishna Computer Center and moved forward in their careers."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`relative rounded-3xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand ${
                i === idx % 3 ? "ring-2 ring-brand/20" : ""
              }`}
            >
              <div className="flex items-center gap-1 text-yellow-500">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-ink/85">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
                <span className="grid h-11 w-11 place-items-center rounded-full gradient-brand text-base font-bold text-white">
                  {t.initial}
                </span>
                <div>
                  <div className="text-sm font-bold text-ink">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.course}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink pt-20 pb-8 text-white/85">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-brand/40 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-cyan/30 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-brand">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div>
                <div className="text-sm font-bold text-white">KRISHNA COMPUTER CENTER</div>
                <div className="text-[11px] text-white/60">Empowering Students Through Digital Education</div>
              </div>
            </div>
            <p className="mt-5 text-sm text-white/70">
              Government-certified computer education institute serving Delhi NCR since 2014.
              Practical, career-ready programs across two branches.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: Facebook, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Youtube, href: "#" },
                { icon: Send, href: "#" },
                { icon: Linkedin, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label="Social"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-brand hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {["About", "Courses", "Student Zone", "Downloads", "Gallery", "Notice Board", "Contact"].map((l) => (
                <li key={l}>
                  <a href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-cyan">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Popular Courses</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {["ADCA", "DCA", "PGDCA", "CCC", "NIELIT O Level", "Python", "Tally Prime", "Digital Marketing"].map((l) => (
                <li key={l}>
                  <a href="#courses" className="hover:text-cyan">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Reach Us</h4>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                Karawal Nagar: H-3, Gali 35, West Karawal Nagar, Delhi 110094
              </li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                Loni: G-2851, Rana Chowk, Rampark Ext., Ghaziabad 201102
              </li>
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> +91 9289400281 · 9911193913
              </li>
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                krishnacomputercenter.nielit@gmail.com
              </li>
            </ul>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 flex items-center gap-2 rounded-full border border-white/20 bg-white/5 p-1.5 pl-4"
            >
              <input
                type="email"
                required
                placeholder="Newsletter email"
                aria-label="Email for newsletter"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
              />
              <button className="rounded-full gradient-brand px-4 py-2 text-xs font-semibold text-white">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Krishna Computer Center. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-white">Privacy Policy</a>
            <a href="#terms" className="hover:text-white">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Page ---------------- */

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <About />
        <WhyChoose />
        <Partners />
        <Branches />
        <CounterBand />
        <Courses />
        <CTASection />
        <Testimonials />
      </main>
      <Footer />
      {/* Structural hint for search: mark checked items */}
      <span className="sr-only">
        <CheckCircle2 /> Krishna Computer Center — Government certified computer training since 2014.
      </span>
    </div>
  );
}
