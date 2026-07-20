import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, ArrowLeft, Sparkles } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/student/assignments")({
  head: () => ({ meta: [{ title: "Assignments · Krishna Computer Center" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <SiteLayout>
      <PageHero eyebrow="Student Portal" title="Assignments" subtitle="This module will be available soon." />
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="glass-card mx-auto rounded-3xl p-10 shadow-brand">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-brand text-white shadow-brand"><ClipboardList className="h-8 w-8" /></span>
            <h2 className="mt-5 text-2xl font-extrabold text-ink">Module Coming Soon</h2>
            <p className="mt-2 text-sm text-muted-foreground">Assignment submissions & pending tasks will appear here.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-soft px-4 py-1.5 text-xs font-semibold text-brand-dark">
              <Sparkles className="h-3.5 w-3.5" /> Rolling out shortly
            </div>
            <div className="mt-8">
              <Link to="/student-dashboard" className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  ),
});