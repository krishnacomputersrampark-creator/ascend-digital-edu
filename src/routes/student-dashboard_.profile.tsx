import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, Pencil, User as UserIcon, Phone, Mail, MapPin, Shield, IdCard, GraduationCap, Users as UsersIcon, HeartPulse, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/student/PortalShell";
import { calcProfileCompletion, getPhotoSignedUrl, getStudentByUserId, type StudentRecord } from "@/lib/students.repo";

export const Route = createFileRoute("/student-dashboard/profile")({
  head: () => ({ meta: [{ title: "My Profile · Krishna Computer Center" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function mask(v: string | null | undefined) {
  if (!v) return "—";
  const s = v.replace(/\s+/g, "");
  if (s.length <= 4) return s;
  return "•••• •••• " + s.slice(-4);
}

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="rounded-xl border bg-white/70 p-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink break-words">{value ?? "—"}</dd>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6 shadow-soft">
      <header className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-brand"><Icon className="h-4 w-4" /></span>
        <h2 className="text-base font-bold text-ink">{title}</h2>
      </header>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </motion.section>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate({ to: "/login", search: { redirect: "/student-dashboard/profile" } }); return; }
      try {
        const s = await getStudentByUserId(data.session.user.id);
        setStudent(s);
        setPhoto(await getPhotoSignedUrl(s?.photo_url ?? null));
      } catch (e: any) { setError(e?.message ?? "Failed to load profile"); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-cyan-soft/30"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;

  const name = student?.full_name ?? "Student";
  const initials = name.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
  const pct = calcProfileCompletion(student);

  return (
    <PortalShell name={name} initials={initials} subline={student?.student_code ?? undefined}>
      <section className="px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-3xl gradient-brand-dark p-6 text-white shadow-brand sm:p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan/30 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {photo ? (
                <img src={photo} alt={name} className="h-24 w-24 rounded-2xl object-cover ring-2 ring-white/30" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/15 text-3xl font-black backdrop-blur ring-2 ring-white/25">{initials}</div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-soft">Student Profile</p>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{name}</h1>
                <p className="mt-1 text-sm text-white/80">{student?.email ?? "—"}</p>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <Link to="/student-dashboard/profile/edit" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-dark shadow-soft hover:shadow-brand transition">
                <Pencil className="h-4 w-4" /> Edit Profile
              </Link>
              <div className="w-full sm:w-56 rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                  <span>Profile Completion</span><span>{pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-cyan" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>
          {error && <div className="relative mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-[12px] text-white">{error}</div>}
          {!student && !error && (
            <p className="relative mt-4 text-[11px] uppercase tracking-wider text-white/60">No student record linked to this account yet.</p>
          )}
        </div>

        <Card title="Basic Information" icon={UserIcon}>
          <Field label="Student ID" value={student?.student_code} icon={IdCard} />
          <Field label="Enrollment No." value={student?.enrollment_no} />
          <Field label="Admission No." value={student?.admission_no} />
          <Field label="Roll No." value={student?.roll_no} />
          <Field label="Full Name" value={student?.full_name} />
          <Field label="Gender" value={student?.gender} />
          <Field label="Date of Birth" value={student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "—"} />
          <Field label="Blood Group" value={student?.blood_group} icon={HeartPulse} />
          <Field label="Occupation" value={student?.occupation} />
        </Card>

        <Card title="Course Information" icon={GraduationCap}>
          <Field label="Course" value={student?.course ? `${student.course.name} (${student.course.code})` : "—"} />
          <Field label="Branch" value={student?.branch?.name} />
          <Field label="Batch" value={student?.batch?.name} />
          <Field label="Admission Date" value={student?.joined_at ? new Date(student.joined_at).toLocaleDateString() : "—"} />
          <Field label="Current Status" value={student?.status} />
        </Card>

        <Card title="Contact Information" icon={Phone}>
          <Field label="Mobile" value={student?.phone} icon={Phone} />
          <Field label="Alternate Mobile" value={student?.alternate_mobile} />
          <Field label="Email" value={student?.email} icon={Mail} />
          <Field label="Address" value={student?.address} icon={MapPin} />
          <Field label="City" value={student?.city} />
          <Field label="State" value={student?.state} />
          <Field label="Pincode" value={student?.pincode} />
          <Field label="Emergency Contact" value={student?.emergency_contact} />
          <Field label="Guardian Name" value={student?.guardian_name} icon={UsersIcon} />
          <Field label="Guardian Mobile" value={student?.guardian_phone} />
        </Card>

        <Card title="Identity" icon={Shield}>
          <Field label="Aadhaar (masked)" value={mask(student?.aadhaar_number)} />
        </Card>

        <section className="glass-card rounded-3xl p-6 shadow-soft">
          <header className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white shadow-brand"><FileText className="h-4 w-4" /></span>
            <h2 className="text-base font-bold text-ink">My Documents</h2>
          </header>
          <p className="text-sm text-muted-foreground">Uploaded documents (Photo, Signature, Aadhaar, Qualification) will appear here once verified by administration.</p>
        </section>
      </section>
    </PortalShell>
  );
}