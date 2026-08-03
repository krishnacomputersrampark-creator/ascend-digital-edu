import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, Pencil, Printer, IdCard, KeyRound, ArrowLeft, BookOpen, CalendarCheck, History, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { createTeacherLogin, getTeacher } from "@/lib/teachers.functions";
import { printTeacherIdCard, printTeacherProfile } from "@/lib/teachers.export";
import { teacherFileUrl } from "@/lib/teachers.storage";
import { T_STATUS_CLASS, T_STATUS_LABEL, fmtDate, inr } from "@/lib/teachers.shared";

export const Route = createFileRoute("/_authenticated/dashboard/teachers/$id/")({
  head: () => ({
    meta: [
      { title: "Teacher Profile · KCC ERP" },
      { name: "description", content: "Complete faculty profile with assignments, documents and change history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherProfile,
});

const DOCS: Array<[string, string]> = [
  ["photo_url", "Passport Photo"],
  ["aadhaar_url", "Aadhaar Card"],
  ["pan_url", "PAN Card"],
  ["qualification_url", "Qualification Certificate"],
  ["experience_url", "Experience Certificate"],
  ["signature_url", "Signature"],
];

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-semibold text-ink">{v ? String(v) : "—"}</span>
    </div>
  );
}

function TeacherProfile() {
  const { id } = useParams({ from: "/_authenticated/dashboard/teachers/$id/" });
  const navigate = useNavigate();
  const load = useServerFn(getTeacher);
  const makeLogin = useServerFn(createTeacherLogin);
  const [data, setData] = useState<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load({ data: { id } })
      .then(async (d: any) => {
        setData(d);
        setPhoto(await teacherFileUrl(d.teacher.photo_url));
      })
      .catch((e: any) => toast.error(e?.message ?? "Teacher not found"));
  }, [id, load]);

  if (!data) {
    return (
      <DashboardShell title="Teacher Profile" subtitle="Loading record…">
        <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      </DashboardShell>
    );
  }

  const t = data.teacher;

  const openDoc = async (path: string | null) => {
    const url = await teacherFileUrl(path);
    if (url) window.open(url, "_blank");
    else toast.error("No file uploaded");
  };

  const provisionLogin = async () => {
    const pwd = window.prompt("Set a password for this teacher's faculty login (min 8 characters)");
    if (!pwd || pwd.length < 8) return;
    setBusy(true);
    try {
      const res: any = await makeLogin({ data: { teacherId: id, password: pwd } });
      toast.success(`Faculty login ready for ${res.email}`);
      setData((d: any) => ({ ...d, teacher: { ...d.teacher, user_id: res.uid } }));
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create login");
    } finally {
      setBusy(false);
    }
  };

  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-ink";

  return (
    <DashboardShell
      title={t.full_name}
      subtitle={`${t.teacher_id} · ${t.employee_code} · ${t.designation ?? "Faculty"}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/teachers" className={btn}><ArrowLeft className="h-4 w-4" /> Back</Link>
          <button className={btn} onClick={() => printTeacherProfile(t)}><Printer className="h-4 w-4" /> Print</button>
          <button className={btn} onClick={() => printTeacherIdCard(t, photo)}><IdCard className="h-4 w-4" /> ID Card</button>
          <button disabled={busy} className={btn} onClick={provisionLogin}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {t.user_id ? "Reset Password" : "Create Login"}
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-brand"
            onClick={() => navigate({ to: "/dashboard/teachers/$id/edit", params: { id } })}>
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-4">
            {photo ? (
              <img src={photo} alt={t.full_name} className="h-20 w-20 rounded-2xl object-cover ring-1 ring-border" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-2xl bg-cyan-soft text-2xl font-bold text-brand">
                {(t.full_name ?? "?").slice(0, 1)}
              </span>
            )}
            <div>
              <div className="text-lg font-extrabold text-ink">{t.full_name}</div>
              <div className="text-xs text-muted-foreground">{t.department ?? "—"}</div>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${T_STATUS_CLASS[t.status] ?? ""}`}>
                {T_STATUS_LABEL[t.status] ?? t.status}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Row k="Mobile" v={t.mobile} />
            <Row k="Alternate" v={t.alternate_mobile} />
            <Row k="Email" v={t.email} />
            <Row k="Branch" v={t.branch?.name} />
            <Row k="Joined" v={fmtDate(t.joining_date)} />
            <Row k="Salary" v={inr(t.salary)} />
            <Row k="Login" v={t.user_id ? "Faculty account active" : "Not created"} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h3 className="mb-2 text-sm font-bold text-ink">Personal & Contact</h3>
          <Row k="Father" v={t.father_name} />
          <Row k="Mother" v={t.mother_name} />
          <Row k="Gender" v={t.gender} />
          <Row k="Date of Birth" v={fmtDate(t.dob)} />
          <Row k="Blood Group" v={t.blood_group} />
          <Row k="Aadhaar" v={t.aadhaar_number} />
          <Row k="PAN" v={t.pan_number} />
          <Row k="Address" v={t.address} />
          <Row k="District" v={t.district} />
          <Row k="State" v={t.state} />
          <Row k="PIN" v={t.pin_code} />
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h3 className="mb-2 text-sm font-bold text-ink">Employment</h3>
          <Row k="Designation" v={t.designation} />
          <Row k="Department" v={t.department} />
          <Row k="Qualification" v={t.qualification} />
          <Row k="Experience" v={t.experience} />
          <Row k="Subjects" v={t.subjects} />
          <Row k="Working Days" v={t.working_days} />
          <Row k="Timings" v={t.preferred_timings} />
          <Row k="Remarks" v={t.remarks} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><BookOpen className="h-4 w-4 text-brand" /> Assigned Courses</h3>
          {data.courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses assigned yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.courses.map((c: any) => (
                <li key={c.course_id} className="rounded-lg bg-cyan-soft px-2.5 py-1 text-xs font-semibold text-brand">{c.course?.name}</li>
              ))}
            </ul>
          )}
          <h3 className="mb-3 mt-5 flex items-center gap-2 text-sm font-bold text-ink"><CalendarCheck className="h-4 w-4 text-brand" /> Assigned Batches</h3>
          {data.batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batches assigned yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.batches.map((b: any) => (
                <li key={b.batch_id} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink">
                  {b.batch?.name}{b.batch?.timing ? ` · ${b.batch.timing}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><FileText className="h-4 w-4 text-brand" /> Documents</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {DOCS.map(([key, title]) => (
              <button key={key} onClick={() => openDoc(t[key])}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold ${t[key] ? "border-brand/40 bg-cyan-soft text-brand" : "border-border bg-white text-muted-foreground"}`}>
                {title}
                <span className="block text-[11px] font-normal">{t[key] ? "View file" : "Not uploaded"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-soft">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink"><History className="h-4 w-4 text-brand" /> Change History</h3>
        {data.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.history.map((h: any) => (
              <li key={h.id} className="rounded-xl border border-border/70 px-3 py-2 text-xs">
                <span className="font-bold uppercase text-brand">{h.action}</span>{" "}
                by {h.changed_by_email ?? "system"} · {new Date(h.created_at).toLocaleString("en-IN")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}