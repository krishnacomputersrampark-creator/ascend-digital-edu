import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, IdCard, FileText, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { getStudent } from "@/lib/students.functions";
import { signedUrlFor } from "@/lib/students.client";
import { printAdmissionForm, printIdCard } from "@/lib/students.export";
import { STATUS_CLASS, STATUS_LABEL, fmtDate, inr, netPayable } from "@/lib/students.shared";

export const Route = createFileRoute("/_authenticated/dashboard/students/$id/")({
  head: () => ({ meta: [{ title: "Student Profile · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: StudentProfilePage,
});

const TABS = ["Overview", "Academic", "Fees", "Attendance", "Results", "Certificates", "Documents", "History"] as const;

function StudentProfilePage() {
  const { id } = useParams({ from: "/_authenticated/dashboard/students/$id/" });
  const fetchStudent = useServerFn(getStudent);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchStudent({ data: { id } })
      .then(async (d: any) => {
        setData(d);
        setPhoto(await signedUrlFor(d.student.photo_url));
      })
      .catch((e) => toast.error(e?.message ?? "Could not load student"))
      .finally(() => setLoading(false));
  }, [fetchStudent, id]);

  if (loading) {
    return (
      <DashboardShell title="Student Profile">
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      </DashboardShell>
    );
  }
  if (!data) {
    return (
      <DashboardShell title="Student Profile">
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Student not found.</div>
      </DashboardShell>
    );
  }

  const s = data.student;

  return (
    <DashboardShell
      title={s.full_name}
      subtitle={`${s.admission_number ?? s.student_code} · ${s.course?.name ?? "No course"}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/students" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <button onClick={() => printAdmissionForm(s)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft">
            <FileText className="h-4 w-4" /> Admission form
          </button>
          <button onClick={() => printIdCard(s, window.location.origin)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft">
            <IdCard className="h-4 w-4" /> ID card
          </button>
          <Link to="/dashboard/students/$id/edit" params={{ id }} className="inline-flex items-center gap-1.5 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand">
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </div>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-cyan-soft text-xl font-extrabold text-brand-dark">
          {photo ? <img src={photo} alt={`${s.full_name} photo`} className="h-full w-full object-cover" /> : s.full_name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="text-lg font-extrabold text-ink">{s.full_name}</div>
          <div className="text-sm text-muted-foreground">{s.phone} · {s.email || "No email"}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className={`rounded-full px-2.5 py-0.5 ${STATUS_CLASS[s.status] ?? "bg-slate-100 text-slate-700"}`}>{STATUS_LABEL[s.status] ?? s.status}</span>
            <span className="rounded-full bg-cyan-soft px-2.5 py-0.5 text-brand-dark">{s.branch?.name ?? "No branch"}</span>
            <span className="rounded-full bg-cyan-soft px-2.5 py-0.5 text-brand-dark">{s.batch?.name ?? "No batch"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Attendance" value={`${data.attendance.percent}%`} />
          <Mini label="Fees paid" value={inr(data.fees.paid)} />
          <Mini label="Fees due" value={inr(data.fees.due)} />
          <Mini label="Certificates" value={data.certificates.length} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${tab === t ? "gradient-brand text-white shadow-brand" : "border border-border bg-white text-ink"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
        {tab === "Overview" && (
          <Grid
            items={[
              ["Admission number", s.admission_number],
              ["Student ID", s.student_code],
              ["Enrollment number", s.enrollment_no],
              ["Roll number", s.roll_no],
              ["Father's name", s.father_name],
              ["Mother's name", s.mother_name],
              ["Date of birth", fmtDate(s.date_of_birth)],
              ["Gender", s.gender],
              ["Category", s.category],
              ["Blood group", s.blood_group],
              ["Aadhaar", s.aadhaar_number],
              ["Mobile", s.phone],
              ["Alternate mobile", s.alternate_mobile],
              ["Email", s.email],
              ["Address", [s.address, s.city, s.district, s.state, s.pincode].filter(Boolean).join(", ")],
              ["Guardian", s.guardian_name],
              ["Guardian phone", s.guardian_phone],
              ["Emergency contact", s.emergency_contact],
            ]}
          />
        )}
        {tab === "Academic" && (
          <Grid
            items={[
              ["Course", s.course?.name],
              ["Course code", s.course?.code],
              ["Duration", s.course?.duration],
              ["Branch", s.branch?.name],
              ["Batch", s.batch?.name],
              ["Timing", s.batch?.timing],
              ["Joining date", fmtDate(s.joined_at)],
              ["Status", STATUS_LABEL[s.status] ?? s.status],
            ]}
          />
        )}
        {tab === "Fees" && (
          <Grid
            items={[
              ["Course fee", inr(s.course_fee)],
              ["Admission fee", inr(s.admission_fee)],
              ["Registration fee", inr(s.registration_fee)],
              ["Discount", inr(s.discount)],
              ["Net payable", inr(netPayable(s))],
              ["Billed", inr(data.fees.total)],
              ["Collected", inr(data.fees.paid)],
              ["Outstanding", inr(data.fees.due)],
            ]}
          />
        )}
        {tab === "Attendance" && (
          <Grid
            items={[
              ["Total classes", data.attendance.total],
              ["Present", data.attendance.present],
              ["Percentage", `${data.attendance.percent}%`],
            ]}
          />
        )}
        {tab === "Results" && (
          <SimpleTable
            head={["Exam", "Percentage", "Grade", "Result"]}
            rows={data.results.map((r: any) => [r.exam?.name ?? "—", r.percentage != null ? `${r.percentage}%` : "—", r.grade ?? "—", r.result_status ?? "—"])}
            empty="No results published yet."
          />
        )}
        {tab === "Certificates" && (
          <SimpleTable
            head={["Certificate no", "Type", "Issued"]}
            rows={data.certificates.map((c: any) => [c.certificate_number, c.certificate_type, fmtDate(c.issue_date)])}
            empty="No certificates issued yet."
          />
        )}
        {tab === "Documents" && <DocumentList docs={data.documents} />}
        {tab === "History" && (
          <SimpleTable
            head={["When", "Action", "By", "Changes"]}
            rows={data.history.map((h: any) => [
              new Date(h.created_at).toLocaleString("en-IN"),
              h.action,
              h.changed_by_email ?? "—",
              Object.keys(h.changes ?? {}).join(", ") || "—",
            ])}
            empty="No edits recorded yet."
          />
        )}
      </div>
    </DashboardShell>
  );
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-cyan-soft/50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-extrabold text-ink">{value}</div>
    </div>
  );
}

function Grid({ items }: { items: Array<[string, any]> }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{k}</dt>
          <dd className="text-sm font-semibold text-ink">{v || v === 0 ? String(v) : "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function SimpleTable({ head, rows, empty }: { head: string[]; rows: any[][]; empty: string }) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2 text-ink">{c ?? "—"}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentList({ docs }: { docs: any[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const next: Record<string, string> = {};
      for (const d of docs) {
        const u = await signedUrlFor(d.file_path);
        if (u) next[d.id] = u;
      }
      setUrls(next);
    })();
  }, [docs]);

  if (!docs.length) return <p className="py-8 text-center text-sm text-muted-foreground">No documents uploaded.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((d) => (
        <li key={d.id} className="rounded-xl border border-border p-4">
          <div className="text-sm font-bold capitalize text-ink">{d.kind}</div>
          <div className="text-xs text-muted-foreground">{fmtDate(d.created_at)}</div>
          {urls[d.id] ? (
            <a href={urls[d.id]} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-brand">Open document</a>
          ) : (
            <span className="mt-2 inline-block text-xs text-muted-foreground">Preparing link…</span>
          )}
        </li>
      ))}
    </ul>
  );
}