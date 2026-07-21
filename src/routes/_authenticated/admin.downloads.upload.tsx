import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Loader2, Upload, X, Youtube, ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import {
  listCategories, createMaterial, updateMaterial, getMaterial, uploadStudyFile, uploadThumbnail,
  ALLOWED_EXT, MAX_UPLOAD_MB, VISIBILITY, STATUS,
  type Category, type Visibility, type Status,
} from "@/lib/downloads.repo";
import { humanSize, extOf } from "@/lib/downloads.utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/downloads/upload")({
  head: () => ({ meta: [{ title: "Upload Material · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string | undefined) ?? undefined }),
  component: () => <UploadPage mode="admin"/>,
});

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional().nullable(),
  category_id: z.string().uuid().nullable(),
  course_id: z.string().uuid().nullable(),
  branch_id: z.string().uuid().nullable(),
  batch_id: z.string().uuid().nullable(),
  visibility: z.enum(VISIBILITY),
  status: z.enum(STATUS),
  is_featured: z.boolean(),
  youtube_url: z.string().url().optional().nullable().or(z.literal("")),
  external_link: z.string().url().optional().nullable().or(z.literal("")),
});

export function UploadPage({ mode }: { mode: "admin" | "faculty" }) {
  const { id } = useSearch({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const isEdit = !!id;

  const [cats, setCats] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string; course_id?: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "", description: "" as string | null,
    category_id: null as string | null, course_id: null as string | null,
    branch_id: null as string | null, batch_id: null as string | null,
    visibility: "public" as Visibility, status: "published" as Status,
    is_featured: false, youtube_url: "" as string | null, external_link: "" as string | null,
    file_name: null as string | null, file_type: null as string | null,
    file_size: 0 as number | null, bucket: null as string | null, file_url: null as string | null,
    thumbnail_url: null as string | null,
  });

  useEffect(() => {
    (async () => {
      const [cs, cos, brs, bts] = await Promise.all([
        listCategories(),
        supabase.from("courses").select("id,name").order("name"),
        supabase.from("branches").select("id,name").order("name"),
        supabase.from("batches").select("id,name,course_id").order("name"),
      ]);
      setCats(cs);
      setCourses((cos.data ?? []) as any);
      setBranches((brs.data ?? []) as any);
      setBatches((bts.data ?? []) as any);
      if (isEdit && id) {
        const m = await getMaterial(id);
        if (m) setForm((f) => ({
          ...f,
          title: m.title, description: m.description,
          category_id: m.category_id, course_id: m.course_id, branch_id: m.branch_id, batch_id: m.batch_id,
          visibility: m.visibility, status: m.status, is_featured: m.is_featured,
          youtube_url: m.youtube_url, external_link: m.external_link,
          file_name: m.file_name, file_type: m.file_type, file_size: m.file_size,
          bucket: m.bucket, file_url: m.file_url, thumbnail_url: m.thumbnail_url,
        }));
      }
      setLoading(false);
    })();
  }, [id, isEdit]);

  const filteredBatches = useMemo(() => form.course_id ? batches.filter((b) => !b.course_id || b.course_id === form.course_id) : batches, [batches, form.course_id]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onPickFile = (f: File | null) => {
    if (!f) { setFile(null); return; }
    const ext = extOf(f.name);
    if (!ALLOWED_EXT.includes(ext as any)) { toast.error(`Unsupported .${ext}`); return; }
    if (f.size / (1024*1024) > MAX_UPLOAD_MB) { toast.error(`Max ${MAX_UPLOAD_MB}MB`); return; }
    setFile(f);
    if (!form.title) set("title", f.name.replace(/\.[^.]+$/, ""));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      title: form.title, description: form.description || null,
      category_id: form.category_id, course_id: form.course_id,
      branch_id: form.branch_id, batch_id: form.batch_id,
      visibility: form.visibility, status: form.status, is_featured: form.is_featured,
      youtube_url: form.youtube_url || null, external_link: form.external_link || null,
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    if (!isEdit && !file && !form.youtube_url && !form.external_link) {
      toast.error("Upload a file, provide a YouTube URL, or an external link"); return;
    }

    setSaving(true);
    try {
      let filePatch: Partial<typeof form> = {};
      if (file) {
        const up = await uploadStudyFile(file);
        filePatch = { bucket: up.bucket, file_url: up.path, file_type: up.ext, file_size: up.size, file_name: file.name };
      }
      let thumbPatch: Partial<typeof form> = {};
      if (thumb) {
        const up = await uploadThumbnail(thumb);
        thumbPatch = { thumbnail_url: up.path };
      }
      const payload = {
        title: form.title,
        description: form.description || null,
        category_id: form.category_id,
        course_id: form.course_id,
        branch_id: form.branch_id,
        batch_id: form.batch_id,
        visibility: form.visibility,
        status: form.status,
        is_featured: form.is_featured,
        youtube_url: form.youtube_url || null,
        external_link: form.external_link || null,
        file_name: filePatch.file_name ?? form.file_name,
        file_type: filePatch.file_type ?? form.file_type,
        file_size: filePatch.file_size ?? form.file_size,
        bucket: filePatch.bucket ?? form.bucket,
        file_url: filePatch.file_url ?? form.file_url,
        thumbnail_url: thumbPatch.thumbnail_url ?? form.thumbnail_url,
      };
      if (isEdit && id) {
        await updateMaterial(id, payload as any);
        toast.success("Material updated");
      } else {
        await createMaterial(payload as any);
        toast.success("Material uploaded");
      }
      navigate({ to: mode === "admin" ? "/admin/downloads" : "/faculty/downloads" });
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell
      title={isEdit ? "Edit material" : "Upload material"}
      subtitle={`Allowed: ${ALLOWED_EXT.join(", ").toUpperCase()} · Max ${MAX_UPLOAD_MB}MB`}
      actions={<Link to={mode === "admin" ? "/admin/downloads" : "/faculty/downloads"} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Back</Link>}
    >
      {loading ? (
        <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand"/></div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card title="File source">
              <div className="grid gap-3">
                <FileDrop file={file} onChange={onPickFile} current={form.file_name} size={form.file_size ?? 0}/>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground"><Youtube className="h-3.5 w-3.5 text-rose-500"/>YouTube URL</div>
                    <input value={form.youtube_url ?? ""} onChange={(e) => set("youtube_url", e.target.value)} placeholder="https://youtube.com/watch?v=…" className="w-full rounded-xl border px-3 py-2 text-sm"/>
                  </label>
                  <label className="block">
                    <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground"><ExternalLink className="h-3.5 w-3.5 text-brand"/>External link</div>
                    <input value={form.external_link ?? ""} onChange={(e) => set("external_link", e.target.value)} placeholder="https://…" className="w-full rounded-xl border px-3 py-2 text-sm"/>
                  </label>
                </div>
              </div>
            </Card>

            <Card title="Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" full>
                  <input value={form.title} onChange={(e) => set("title", e.target.value)} required className="w-full rounded-xl border px-3 py-2 text-sm"/>
                </Field>
                <Field label="Description" full>
                  <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm"/>
                </Field>
                <Field label="Category">
                  <select value={form.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)} className="w-full rounded-xl border px-3 py-2 text-sm">
                    <option value="">—</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                </Field>
                <Field label="Course">
                  <select value={form.course_id ?? ""} onChange={(e) => set("course_id", e.target.value || null)} className="w-full rounded-xl border px-3 py-2 text-sm">
                    <option value="">—</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Branch">
                  <select value={form.branch_id ?? ""} onChange={(e) => set("branch_id", e.target.value || null)} className="w-full rounded-xl border px-3 py-2 text-sm">
                    <option value="">—</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
                <Field label="Batch">
                  <select value={form.batch_id ?? ""} onChange={(e) => set("batch_id", e.target.value || null)} className="w-full rounded-xl border px-3 py-2 text-sm">
                    <option value="">—</option>
                    {filteredBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
                <Field label="Thumbnail (optional)" full>
                  <input type="file" accept="image/*" onChange={(e) => setThumb(e.target.files?.[0] ?? null)} className="w-full rounded-xl border px-3 py-2 text-sm"/>
                </Field>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Publish settings">
              <div className="space-y-3">
                <Field label="Visibility">
                  <select value={form.visibility} onChange={(e) => set("visibility", e.target.value as Visibility)} className="w-full rounded-xl border px-3 py-2 text-sm">
                    <option value="public">Public — anyone</option>
                    <option value="course">Course only</option>
                    <option value="branch">Branch only</option>
                    <option value="batch">Batch only</option>
                    <option value="private">Private (admins only)</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => set("status", e.target.value as Status)} className="w-full rounded-xl border px-3 py-2 text-sm">
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                {mode === "admin" && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)}/>
                    Feature this material
                  </label>
                )}
              </div>
              <button type="submit" disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand px-4 py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4"/>}
                {isEdit ? "Save changes" : "Upload material"}
              </button>
            </Card>
          </div>
        </form>
      )}
    </DashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-soft">
      <div className="mb-3 text-xs font-semibold uppercase text-brand">{title}</div>
      {children}
    </div>
  );
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
function FileDrop({ file, onChange, current, size }: { file: File | null; onChange: (f: File | null) => void; current?: string | null; size: number }) {
  return (
    <div className="rounded-2xl border-2 border-dashed p-6 text-center">
      {file ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-left">
            <div className="text-sm font-semibold text-ink">{file.name}</div>
            <div className="text-[11px] text-muted-foreground">{humanSize(file.size)}</div>
          </div>
          <button type="button" onClick={() => onChange(null)} className="rounded-lg border px-2 py-1 text-xs"><X className="h-3.5 w-3.5"/></button>
        </div>
      ) : (
        <>
          <Upload className="mx-auto mb-2 h-8 w-8 text-brand"/>
          <div className="text-sm font-semibold text-ink">Choose a file to upload</div>
          <div className="text-[11px] text-muted-foreground">or drop it here · max {MAX_UPLOAD_MB}MB</div>
          {current && <div className="mt-2 text-[11px] text-emerald-700">Current file: {current} ({humanSize(size)})</div>}
          <input type="file" onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="mt-3 block w-full text-xs"/>
        </>
      )}
    </div>
  );
}