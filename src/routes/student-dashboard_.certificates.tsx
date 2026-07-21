import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, Download, Eye, Loader2, ShieldCheck, Ban } from "lucide-react";
import { PortalShell } from "@/components/student/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { listMyCertificates, CERT_TYPE_LABEL, CERT_STATUS_LABEL, type CertificateRow } from "@/lib/certificates.repo";
import { downloadCertificatePdf } from "@/lib/certificates.pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/student-dashboard_/certificates")({
  head: () => ({ meta: [{ title: "My Certificates · KCC Student Portal" }, { name: "robots", content: "noindex" }] }),
  component: MyCertificatesPage,
});

function MyCertificatesPage() {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ full_name: string; initials: string; sub: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: st } = await supabase.from("students").select("full_name, student_code").eq("user_id", auth.user.id).maybeSingle();
        if (st) setMe({
          full_name: st.full_name,
          initials: st.full_name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase(),
          sub: st.student_code,
        });
      }
      try { setRows(await listMyCertificates()); }
      catch (e: any) { toast.error(e.message ?? "Failed"); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <PortalShell name={me?.full_name ?? "Student"} initials={me?.initials ?? "S"} subline={me?.sub}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-ink">My Certificates</h1>
            <p className="text-sm text-muted-foreground">Download, view and verify credentials issued to you.</p>
          </div>
          <Link to="/certificate-verification" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"><ShieldCheck className="h-4 w-4 text-brand"/>Verify a certificate</Link>
        </div>

        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand"/></div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed p-12 text-center">
            <Award className="mx-auto mb-3 h-12 w-12 text-brand/40"/>
            <div className="text-lg font-semibold text-ink">No certificates yet</div>
            <div className="mt-1 text-sm text-muted-foreground">Your course completion certificates will appear here.</div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((c) => (
              <div key={c.id} className="group overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                <div className="relative gradient-brand-dark p-5 text-white">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                    {c.status === "revoked" ? <Ban className="h-5 w-5"/> : <Award className="h-5 w-5"/>}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{c.course?.name ?? CERT_TYPE_LABEL[c.certificate_type]}</h3>
                  <p className="mt-1 text-xs text-white/70">{c.certificate_number}</p>
                  <span className={`absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold ${c.status==="revoked"?"bg-rose-500/90":"bg-emerald-500/90"} text-white`}>
                    {CERT_STATUS_LABEL[c.status]}
                  </span>
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan/30 blur-2xl"/>
                </div>
                <div className="space-y-2 p-5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-semibold">{CERT_TYPE_LABEL[c.certificate_type]}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Issue date</span><span className="font-semibold">{new Date(c.issue_date).toLocaleDateString("en-IN")}</span></div>
                  {c.grade && <div className="flex justify-between"><span className="text-muted-foreground">Grade</span><span className="font-semibold">{c.grade} {c.percentage!=null?`· ${c.percentage}%`:""}</span></div>}
                  <div className="flex gap-2 pt-2">
                    <Link to="/student-dashboard/certificates/view/$id" params={{ id: c.id }} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"><Eye className="h-3 w-3"/>View</Link>
                    <button
                      onClick={() => downloadCertificatePdf(c).catch((e) => toast.error(e.message))}
                      disabled={c.status === "revoked"}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-full gradient-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    ><Download className="h-3 w-3"/>PDF</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}