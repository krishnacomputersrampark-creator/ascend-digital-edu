import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Download, Eye, Search, IdCard, BookOpen, Award, GraduationCap, Mail, ReceiptText,
  FileText, FilePlus2, StickyNote, ClipboardList, CalendarDays, FileBadge,
} from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Download Center — Krishna Computer Center" },
      { name: "description", content: "Download syllabus, admission forms, admit cards, ID cards, timetables, study notes, receipts and more." },
      { property: "og:title", content: "Download Center — Krishna Computer Center" },
      { property: "og:description", content: "One-stop download hub for students and applicants." },
    ],
  }),
  component: DownloadsPage,
});

const ITEMS = [
  { icon: IdCard, title: "Student ID Card", desc: "Digital & print ready ID.", cat: "Identity" },
  { icon: BookOpen, title: "Course Syllabus", desc: "Detailed subject-wise plan.", cat: "Academics", popular: true },
  { icon: Award, title: "Certificate", desc: "Course completion certificate.", cat: "Credentials" },
  { icon: GraduationCap, title: "Diploma", desc: "Advanced diploma document.", cat: "Credentials" },
  { icon: Mail, title: "Welcome Letter", desc: "Institute welcome pack.", cat: "Admission" },
  { icon: ReceiptText, title: "Fee Receipt", desc: "Payment history & receipts.", cat: "Finance", popular: true },
  { icon: FilePlus2, title: "Admission Form", desc: "Print & fill offline.", cat: "Admission" },
  { icon: FileText, title: "Prospectus", desc: "Full institute prospectus.", cat: "Academics" },
  { icon: StickyNote, title: "Study Notes", desc: "Unit-wise reference notes.", cat: "Academics", popular: true },
  { icon: ClipboardList, title: "Assignments", desc: "Current & past assignments.", cat: "Academics" },
  { icon: CalendarDays, title: "Time Table", desc: "Weekly class schedule.", cat: "Academics" },
  { icon: FileBadge, title: "Admit Card", desc: "Download exam admit card.", cat: "Examination" },
];

const CATS = ["All", "Identity", "Academics", "Credentials", "Admission", "Finance", "Examination"];

function DownloadsPage() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const filtered = ITEMS.filter(i => (cat==="All" || i.cat===cat) && (!q || i.title.toLowerCase().includes(q.toLowerCase())));
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Resource Hub"
        title={<>Download <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Center</span></>}
        subtitle="Every form, receipt and study document you need — one clean grid."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-full bg-white/95 px-4 py-3 text-ink shadow-brand">
            <Search className="h-4 w-4 text-brand" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search downloads (syllabus, receipt, admit card...)" className="w-full bg-transparent text-sm focus:outline-none" />
          </label>
        </div>
      </PageHero>
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={()=>setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${cat===c?"gradient-brand text-white shadow-brand":"border bg-white text-ink/70 hover:border-brand"}`}>{c}</button>
            ))}
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((it) => (
              <div key={it.title} className="group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                {it.popular && <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Popular</span>}
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-soft text-brand transition group-hover:gradient-brand group-hover:text-white"><it.icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-base font-bold text-ink">{it.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">{it.desc}</p>
                <div className="mt-4 flex gap-2">
                  <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-full gradient-brand px-3 py-2 text-xs font-semibold text-white shadow-brand"><Download className="h-3.5 w-3.5" /> Download</button>
                  <button className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-brand px-3 py-2 text-xs font-semibold text-brand"><Eye className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length===0 && <p className="col-span-full text-center text-sm text-muted-foreground">No downloads match your search.</p>}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}