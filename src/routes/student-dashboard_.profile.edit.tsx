import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Upload, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/student/PortalShell";
import {
  getPhotoSignedUrl, getStudentByUserId, updateMyStudentProfile, uploadStudentPhoto,
  type StudentRecord,
} from "@/lib/students.repo";

export const Route = createFileRoute("/student-dashboard/profile/edit")({
  head: () => ({ meta: [{ title: "Edit Profile · Krishna Computer Center" }, { name: "robots", content: "noindex" }] }),
  component: EditProfilePage,
});

const schema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile"),
  alternate_mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid mobile").or(z.literal("")).nullable(),
  email: z.string().trim().email("Invalid email").max(255).or(z.literal("")).nullable(),
  address: z.string().trim().max(500).or(z.literal("")).nullable(),
  city: z.string().trim().max(80).or(z.literal("")).nullable(),
  state: z.string().trim().max(80).or(z.literal("")).nullable(),
  pincode: z.string().trim().regex(/^\d{6}$/, "6-digit pincode").or(z.literal("")).nullable(),
  emergency_contact: z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid mobile").or(z.literal("")).nullable(),
  guardian_name: z.string().trim().max(120).or(z.literal("")).nullable(),
  guardian_phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid mobile").or(z.literal("")).nullable(),
  blood_group: z.string().trim().max(5).or(z.literal("")).nullable(),
  occupation: z.string().trim().max(120).or(z.literal("")).nullable(),
});
type FormValues = z.infer<typeof schema>;

function ro(label: string, value: string | null | undefined) {
  return (
    <div className="rounded-xl border bg-cyan-soft/30 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value ?? "—"}</div>
    </div>
  );
}

function Input({ label, error, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink/80">{label}</span>
      <input {...rest} className="mt-1 w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
      {error && <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>}
    </label>
  );
}

async function cropToSquare(file: File, size = 512): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = URL.createObjectURL(file);
  });
  const s = Math.min(img.width, img.height);
  const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  canvas.getContext("2d")!.drawImage(img, sx, sy, s, s, 0, 0, size, size);
  return await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
}

function EditProfilePage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate({ to: "/login", search: { redirect: "/student-dashboard/profile/edit" } }); return; }
      const s = await getStudentByUserId(data.session.user.id);
      setStudent(s);
      setPhotoPath(s?.photo_url ?? null);
      setPhotoUrl(await getPhotoSignedUrl(s?.photo_url ?? null));
      if (s) reset({
        phone: s.phone ?? "", alternate_mobile: s.alternate_mobile ?? "",
        email: s.email ?? "", address: s.address ?? "", city: s.city ?? "",
        state: s.state ?? "", pincode: s.pincode ?? "",
        emergency_contact: s.emergency_contact ?? "", guardian_name: s.guardian_name ?? "",
        guardian_phone: s.guardian_phone ?? "", blood_group: s.blood_group ?? "",
        occupation: s.occupation ?? "",
      });
      setLoading(false);
    })();
  }, [navigate, reset]);

  const onPhoto = async (file: File) => {
    if (!/image\/(jpeg|jpg|png)/i.test(file.type)) { toast.error("Only JPG or PNG"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    setUploading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Not signed in");
      const cropped = await cropToSquare(file);
      const path = await uploadStudentPhoto(data.user.id, cropped, "jpg");
      setPhotoPath(path);
      setPhotoUrl(await getPhotoSignedUrl(path));
      toast.success("Photo ready — save profile to apply");
    } catch (e: any) { toast.error(e?.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      if (values.email && values.email !== student?.email) {
        const { data: dup } = await supabase.from("students").select("id").eq("email", values.email).maybeSingle();
        if (dup && dup.id !== student?.id) { toast.error("Email already in use"); setSaving(false); return; }
      }
      await updateMyStudentProfile({
        phone: values.phone,
        alternate_mobile: values.alternate_mobile || null,
        email: values.email || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        pincode: values.pincode || null,
        emergency_contact: values.emergency_contact || null,
        guardian_name: values.guardian_name || null,
        guardian_phone: values.guardian_phone || null,
        blood_group: values.blood_group || null,
        occupation: values.occupation || null,
        photo_url: photoPath,
      });
      toast.success("Profile updated");
      navigate({ to: "/student-dashboard/profile" });
    } catch (e: any) { toast.error(e?.message ?? "Update failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-cyan-soft/30"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;

  const name = student?.full_name ?? "Student";
  const initials = name.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();

  return (
    <PortalShell name={name} initials={initials} subline={student?.student_code ?? undefined}>
      <section className="px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Edit Profile</h1>
            <p className="text-sm text-muted-foreground">Update your contact details and profile photo.</p>
          </div>
          <Link to="/student-dashboard/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </div>

        {!student && (
          <div className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">No student record linked to this account yet — please contact administration.</div>
        )}

        {student && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo */}
          <div className="glass-card rounded-3xl p-6 shadow-soft">
            <h2 className="mb-4 text-base font-bold text-ink">Profile Photo</h2>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              {photoUrl
                ? <img src={photoUrl} alt="" className="h-24 w-24 rounded-2xl object-cover ring-2 ring-brand/20" />
                : <div className="grid h-24 w-24 place-items-center rounded-2xl gradient-brand text-2xl font-black text-white">{initials}</div>}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">JPG / PNG, max 2MB. Auto-cropped to a square.</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-50" disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? "Uploading..." : "Upload New"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }} />
                </div>
              </div>
            </div>
          </div>

          {/* Read-only */}
          <div className="glass-card rounded-3xl p-6 shadow-soft">
            <h2 className="mb-4 text-base font-bold text-ink">Academic Details (Read-only)</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ro("Student ID", student.student_code)}
              {ro("Enrollment No.", student.enrollment_no)}
              {ro("Admission No.", student.admission_no)}
              {ro("Roll No.", student.roll_no)}
              {ro("Course", student.course?.name ?? "—")}
              {ro("Branch", student.branch?.name ?? "—")}
              {ro("Batch", student.batch?.name ?? "—")}
              {ro("Admission Date", student.joined_at ? new Date(student.joined_at).toLocaleDateString() : "—")}
              {ro("Aadhaar", student.aadhaar_number ? "•••• •••• " + student.aadhaar_number.slice(-4) : "—")}
            </div>
          </div>

          {/* Editable */}
          <div className="glass-card rounded-3xl p-6 shadow-soft">
            <h2 className="mb-4 text-base font-bold text-ink">Contact & Personal</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Mobile *" {...register("phone")} error={errors.phone?.message} />
              <Input label="Alternate Mobile" {...register("alternate_mobile")} error={errors.alternate_mobile?.message} />
              <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
              <Input label="Address" {...register("address")} error={errors.address?.message} />
              <Input label="City" {...register("city")} error={errors.city?.message} />
              <Input label="State" {...register("state")} error={errors.state?.message} />
              <Input label="Pincode" {...register("pincode")} error={errors.pincode?.message} />
              <Input label="Emergency Contact" {...register("emergency_contact")} error={errors.emergency_contact?.message} />
              <Input label="Guardian Name" {...register("guardian_name")} error={errors.guardian_name?.message} />
              <Input label="Guardian Mobile" {...register("guardian_phone")} error={errors.guardian_phone?.message} />
              <Input label="Blood Group" placeholder="e.g. B+" {...register("blood_group")} error={errors.blood_group?.message} />
              <Input label="Occupation" {...register("occupation")} error={errors.occupation?.message} />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full gradient-brand px-6 py-3 text-sm font-bold text-white shadow-brand disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
            </button>
          </div>
        </form>
        )}
      </section>
    </PortalShell>
  );
}