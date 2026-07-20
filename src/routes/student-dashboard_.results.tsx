import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, Eye, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/student/PortalShell";
import { myPublishedResults, EXAM_TYPE_LABEL } from "@/lib/results.functions";

export const Route = createFileRoute("/student-dashboard_/results")({
  head: () => ({ meta: [{ title: "My Results · KCC" }, { name: "robots", content: "noindex" }] }),
  component: MyResultsPage,
});

function MyResultsPage() {
  const fn = useServerFn(myPublishedResults);
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fn().then(setD).finally(() => setLoading(false)); }, [fn]);

  const name = d?.student?.full_name || "Student";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0,2).join("").toUpperCase();
  const subline = d?.student ? `${d.student.student_code || ""} · ${d.student.course?.name ?? ""}` : "";

  return (
    <PortalShell name={name} initials={initials} subline={subline}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-brand text-white"><GraduationCap className="h-5 w-5"/></div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">My Results</h1>
            <p className="text-sm text-muted-foreground">All exams published by the institute.</p>
          </div>
        </header>

        {loading && <div className="rounded-2xl border bg-white p-10 text-center text-sm text-muted-foreground shadow-soft"><Loader2 className="mx-auto h-5 w-5 animate-spin"/></div>}

        {!loading && !d?.student && <div className="rounded-2xl border bg-white p-10 text-center text-sm text-muted-foreground">No student record linked to your account.</div>}

        {!loading && d?.student && !d.results.length && (
          <div className="rounded-2xl border bg-white p-10 text-center text-sm text-muted-foreground shadow-soft">
            No results have been published yet. You'll be notified when they are.
          </div>
        )}

        {!!d?.results?.length && (
          <div className="grid gap-3">
            {d.results.map((r: any) => (
              <div key={r.id} className="rounded-2xl border bg-white p-4 shadow-soft flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-ink">{r.exam?.exam_name}</div>
                  <div className="text-xs text-muted-foreground">{EXAM_TYPE_LABEL[r.exam?.exam_type as keyof typeof EXAM_TYPE_LABEL] ?? ""} · {r.exam?.exam_date ?? "—"}</div>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs uppercase text-slate-500">Marks</div>
                    <div className="font-mono font-bold">{r.obtained_marks}/{r.total_marks}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase text-slate-500">%</div>
                    <div className="font-mono font-bold">{r.percentage}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase text-slate-500">Grade</div>
                    <div className="font-black text-brand">{r.grade}</div>
                  </div>
                  <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (r.pass_fail === "Pass" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{r.pass_fail}</span>
                  <Link to="/student-dashboard/results/view/$id" params={{ id: r.id }} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white">
                    <Eye className="h-4 w-4"/>View Marksheet
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
