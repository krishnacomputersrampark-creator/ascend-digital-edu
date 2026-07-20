import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, X, Loader2, FileText, ExternalLink, UserPlus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import {
  getAdmissionById,
  rejectAdmission,
  updateAdmissionRemarks,
  convertAdmissionToStudent,
  listBranchesPublic,
} from "@/lib/admissions.functions";
import { emailService, smsService } from "@/lib/notifications.stub";

export const Route = createFileRoute("/_authenticated/dashboard/admissions/$id")({
  head: () => ({ meta: [{ title: "Admission Detail · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: AdmissionDetail,
});

function AdmissionDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchOne = useServerFn(getAdmissionById);
  const doReject = useServerFn(rejectAdmission);
  const doApprove = useServerFn(convertAdmissionToStudent);
  const doRemarks = useServerFn(updateAdmissionRemarks);
  const fetchBranches = useServerFn(listBranchesPublic);

  const [row, setRow] = useState<any | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [branchOverride, setBranchOverride] = useState("");

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetchOne({ data: { id } });
      setRow(r);
      setRemarks(r?.remarks ?? "");
      setBranchOverride(r?.branch_id ?? "");
    } catch (e: any) { setErr(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); fetchBranches().then(setBranches).catch(() => {}); /* eslint-disable-next-line */ }, [id]);

  const approve = async () => {
    const branch_id = branchOverride || row?.branch_id || branches[0]?.id;
    if (!branch_id) { toast.error("Select a branch first"); return; }
    setBusy("approve");
    try {
      const s = await doApprove({ data: { id, branch_id } });
      emailService.admissionApproved({ to: row?.email ?? "", applicationNo: row?.application_no ?? row?.admission_no, fullName: row?.full_name, courseName: row?.course?.name, branchName: row?.branch?.name });
      if (row?.phone) smsService.admissionApproved({ to: row.phone, applicationNo: row?.application_no ?? row?.admission_no });
      toast.success(`Approved. Student ${(s as any).student_code} created.`);
      await load();
    } catch (e: any) { toast.error(e?.message ?? "Approval failed"); }
    finally { setBusy(null); }
  };

  const reject = async () => {
    if (!remarks.trim() || remarks.trim().length < 3) { toast.error("Add a reason (min 3 chars) in Remarks"); return; }
    setBusy("reject");
    try {
      await doReject({ data: { id, remarks } });
      emailService.admissionRejected({ to: row?.email ?? "", applicationNo: row?.application_no ?? row?.admission_no, fullName: row?.full_name, remarks });
      if (row?.phone) smsService.admissionRejected({ to: row.phone, applicationNo: row?.application_no ?? row?.admission_no });
      toast.success("Application rejected");
      await load();
    } catch (e: any) { toast.error(e?.message ?? "Reject failed"); }
    finally { setBusy(null); }
  };

  const saveRemarks = async () => {
    setBusy("remarks");
    try { await doRemarks({ data: { id, remarks } }); toast.success("Remarks saved"); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <DashboardShell
      title="Admission Detail"
      subtitle={row ? `${row.application_no ?? row.admission_no} · ${row.full_name}` : "Loading…"}
      actions={
        <Link to="/dashboard/admissions" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      }
    >
      {loading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">{err}</div>
      ) : !row ? (
        <div className="rounded-2xl border bg-white p-6 text-sm">Not found.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card title="Student Information">
              <Grid>
                <Item k="Full Name" v={row.full_name} />
                <Item k="Gender" v={row.gender} />
                <Item k="Date of Birth" v={row.date_of_birth} />
                <Item k="Mobile" v={row.phone} />
                <Item k="Alternate Mobile" v={row.alternate_mobile} />
                <Item k="Email" v={row.email} />
                <Item k="Aadhaar" v={row.aadhaar_number} />
                <Item k="Father" v={row.guardian_name} />
                <Item k="Mother" v={row.mother_name} />
                <Item k="Qualification" v={row.qualification} />
              </Grid>
            </Card>

            <Card title="Address">
              <Grid>
                <Item k="Address" v={row.address} span />
                <Item k="City" v={row.city} />
                <Item k="State" v={row.state} />
                <Item k="Pincode" v={row.pincode} />
              </Grid>
            </Card>

            <Card title="Course & Batch">
              <Grid>
                <Item k="Branch" v={row.branch?.name} />
                <Item k="Course" v={row.course?.name} />
                <Item k="Batch" v={row.batch?.name} />
                <Item k="Preferred Timing" v={row.preferred_timing} />
              </Grid>
            </Card>

            <Card title="Uploaded Documents">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Photo", row.photo_url],
                  ["Signature", row.signature_url],
                  ["Aadhaar Front", row.aadhaar_front_url],
                  ["Aadhaar Back", row.aadhaar_back_url],
                  ["Qualification", row.qualification_url],
                  ["Passport Photo", row.passport_photo_url],
                ].map(([label, url]) => (
                  <DocTile key={label as string} label={label as string} url={url as string | null} />
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Status">
              <div className="flex items-center gap-2">
                <StatusPill status={row.status} />
                {row.reviewed_at && <span className="text-xs text-muted-foreground">on {new Date(row.reviewed_at).toLocaleString("en-IN")}</span>}
              </div>
              {row.student_id && (
                <p className="mt-3 text-xs text-emerald-700">Converted to student. <Link to="/dashboard/students" className="font-semibold underline">Open students →</Link></p>
              )}
            </Card>

            <Card title="Actions">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink/60">Assign Branch</label>
              <select value={branchOverride} onChange={e => setBranchOverride(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm">
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}{b.city ? ` · ${b.city}` : ""}</option>)}
              </select>
              <div className="mt-4 flex flex-col gap-2">
                <button disabled={busy !== null || row.status === "approved"} onClick={approve} className="inline-flex items-center justify-center gap-1.5 rounded-lg gradient-brand px-3 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-50">
                  {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Approve & Enroll
                </button>
                <button disabled={busy !== null || row.status === "rejected"} onClick={reject} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                  {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject
                </button>
              </div>
            </Card>

            <Card title="Remarks">
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={5} placeholder="Internal notes or rejection reason…" className="w-full rounded-xl border bg-white px-3 py-2 text-sm" />
              <button onClick={saveRemarks} disabled={busy !== null} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink">
                {busy === "remarks" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />} Save Remarks
              </button>
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 gap-y-2 gap-x-6 sm:grid-cols-2">{children}</dl>;
}
function Item({ k, v, span }: { k: string; v?: string | null; span?: boolean }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] uppercase tracking-wider text-ink/60">{k}</dt>
      <dd className="text-sm font-semibold text-ink">{v || "—"}</dd>
    </div>
  );
}
function DocTile({ label, url }: { label: string; url: string | null }) {
  const [signed, setSigned] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    // Value is a storage path in the private `documents` bucket.
    supabase.storage.from("documents").createSignedUrl(url, 3600).then(({ data }) => setSigned(data?.signedUrl ?? null));
  }, [url]);
  if (!url) return (
    <div className="rounded-xl border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground">
      <FileText className="mx-auto h-5 w-5" /> <span className="mt-1 block font-semibold">{label}</span> Not uploaded
    </div>
  );
  const isImg = /\.(jpe?g|png|webp|gif)($|\?)/i.test(url);
  return (
    <a href={signed ?? "#"} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border bg-white text-xs">
      <div className="aspect-video bg-cyan-soft/60">
        {isImg && signed ? <img src={signed} alt={label} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center">{signed ? <FileText className="h-8 w-8 text-brand" /> : <Loader2 className="h-5 w-5 animate-spin text-brand" />}</div>}
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-semibold text-ink">{label}</span>
        <ExternalLink className="h-3.5 w-3.5 text-brand" />
      </div>
    </a>
  );
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    cancelled: "bg-slate-200 text-slate-700",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${map[status] ?? "bg-slate-100 text-slate-700"}`}>{status === "approved" && <Check className="h-3 w-3" />}{status}</span>;
}