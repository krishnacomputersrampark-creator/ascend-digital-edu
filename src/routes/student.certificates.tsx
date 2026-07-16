import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Download, Eye } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/student/certificates")({
  head: () => ({ meta: [{ title: "My Certificates — Krishna Computer Center" }, { name: "description", content: "Download and verify your course completion certificates." }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <SiteLayout>
      <PageHero eyebrow="My Credentials" title={<>My <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Certificates</span></>} subtitle="Course, diploma and completion certificates issued to you." />
      <section className="py-14">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {[
            { name: "ADCA — Advanced Diploma", no: "KCC/ADCA/2024/00123", date: "12 Feb 2024" },
            { name: "CCC — NIELIT", no: "KCC/CCC/2023/01187", date: "05 Sep 2023" },
            { name: "Tally Prime with GST", no: "KCC/TP/2023/00811", date: "22 Jun 2023" },
          ].map((c) => (
            <div key={c.no} className="group overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
              <div className="relative gradient-brand-dark p-6 text-white">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur"><Award className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-bold">{c.name}</h3>
                <p className="mt-1 text-xs text-white/70">{c.no}</p>
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan/30 blur-2xl" />
              </div>
              <div className="flex items-center justify-between p-5 text-sm">
                <span className="text-muted-foreground">Issued {c.date}</span>
                <div className="flex gap-2">
                  <Link to="/verify-certificate" className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"><Eye className="h-3 w-3" /> View</Link>
                  <button className="inline-flex items-center gap-1 rounded-full gradient-brand px-3 py-1.5 text-xs font-semibold text-white"><Download className="h-3 w-3" /> PDF</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  ),
});