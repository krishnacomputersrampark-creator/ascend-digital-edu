import { supabase } from "@/integrations/supabase/client";

export const ALLOWED_EXT = [
  "pdf","doc","docx","ppt","pptx","xls","xlsx","zip","rar","jpg","jpeg","png","mp4","mp3",
] as const;
export type AllowedExt = (typeof ALLOWED_EXT)[number];

export const MAX_UPLOAD_MB = 100;

export const VISIBILITY = ["public","course","branch","batch","private"] as const;
export type Visibility = (typeof VISIBILITY)[number];

export const STATUS = ["draft","published","unpublished","archived"] as const;
export type Status = (typeof STATUS)[number];

export type Category = {
  id: string;
  category_name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type Material = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  course_id: string | null;
  branch_id: string | null;
  batch_id: string | null;
  uploaded_by: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  bucket: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  youtube_url: string | null;
  external_link: string | null;
  visibility: Visibility;
  is_featured: boolean;
  download_count: number;
  status: Status;
  created_at: string;
  updated_at: string;
  category?: { id: string; category_name: string; icon: string | null } | null;
  course?: { id: string; code: string; name: string } | null;
  branch?: { id: string; code: string; name: string } | null;
  batch?: { id: string; code: string; name: string } | null;
};

const SELECT = `
  id, title, description, category_id, course_id, branch_id, batch_id, uploaded_by,
  file_name, file_type, file_size, bucket, file_url, thumbnail_url, youtube_url, external_link,
  visibility, is_featured, download_count, status, created_at, updated_at,
  category:download_categories(id, category_name, icon),
  course:courses(id, code, name),
  branch:branches(id, code, name),
  batch:batches(id, code, name)
`;

/* ---------- Categories ---------- */

export async function listCategories(activeOnly = false): Promise<Category[]> {
  let q = supabase.from("download_categories").select("*").order("display_order").order("category_name");
  if (activeOnly) q = q.eq("status", "active");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function upsertCategory(input: Partial<Category> & { category_name: string }) {
  const payload = {
    category_name: input.category_name,
    description: input.description ?? null,
    icon: input.icon ?? null,
    display_order: input.display_order ?? 0,
    status: input.status ?? "active",
  };
  if (input.id) {
    const { error } = await supabase.from("download_categories").update(payload).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }
  const { data, error } = await supabase.from("download_categories").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("download_categories").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Materials ---------- */

export type ListFilters = {
  q?: string;
  categoryId?: string;
  courseId?: string;
  branchId?: string;
  batchId?: string;
  fileType?: string;
  status?: Status | "all";
  onlyMine?: boolean;
  onlyFeatured?: boolean;
  visibility?: Visibility | "all";
  sort?: "newest" | "oldest" | "downloads";
  limit?: number;
  offset?: number;
};

export async function listMaterials(f: ListFilters = {}): Promise<Material[]> {
  let q = supabase.from("study_materials").select(SELECT);
  if (f.categoryId) q = q.eq("category_id", f.categoryId);
  if (f.courseId) q = q.eq("course_id", f.courseId);
  if (f.branchId) q = q.eq("branch_id", f.branchId);
  if (f.batchId) q = q.eq("batch_id", f.batchId);
  if (f.fileType) q = q.eq("file_type", f.fileType);
  if (f.visibility && f.visibility !== "all") q = q.eq("visibility", f.visibility);
  if (f.status && f.status !== "all") q = q.eq("status", f.status);
  if (f.onlyFeatured) q = q.eq("is_featured", true);
  if (f.onlyMine) {
    const { data: u } = await supabase.auth.getUser();
    if (u.user) q = q.eq("uploaded_by", u.user.id);
  }
  if (f.q) q = q.or(`title.ilike.%${f.q}%,description.ilike.%${f.q}%,file_name.ilike.%${f.q}%`);
  q = f.sort === "downloads"
    ? q.order("download_count", { ascending: false })
    : f.sort === "oldest"
      ? q.order("created_at", { ascending: true })
      : q.order("created_at", { ascending: false });
  if (f.limit) q = q.range(f.offset ?? 0, (f.offset ?? 0) + f.limit - 1);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Material[];
}

export async function getMaterial(id: string): Promise<Material | null> {
  const { data, error } = await supabase.from("study_materials").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as Material | null;
}

export type MaterialInput = Omit<
  Material,
  "id" | "created_at" | "updated_at" | "download_count" | "category" | "course" | "branch" | "batch" | "uploaded_by" | "is_featured"
> & { is_featured?: boolean };

export async function createMaterial(input: MaterialInput) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sign in required");
  const payload = { ...input, uploaded_by: u.user.id, is_featured: input.is_featured ?? false };
  const { data, error } = await supabase.from("study_materials").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function updateMaterial(id: string, patch: Partial<MaterialInput>) {
  const { error } = await supabase.from("study_materials").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setStatus(id: string, status: Status) {
  const { error } = await supabase.from("study_materials").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function toggleFeatured(id: string, next: boolean) {
  const { error } = await supabase.from("study_materials").update({ is_featured: next }).eq("id", id);
  if (error) throw error;
}

export async function deleteMaterial(id: string) {
  const m = await getMaterial(id);
  if (m?.bucket && m?.file_url) {
    await supabase.storage.from(m.bucket).remove([m.file_url]).catch(() => {});
  }
  const { error } = await supabase.from("study_materials").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Storage & signed URLs ---------- */

export function bucketFor(ext: string): string {
  const e = ext.toLowerCase();
  if (["mp4","mov","webm"].includes(e)) return "videos";
  if (["mp3","wav","m4a","ogg"].includes(e)) return "videos";
  if (["zip","rar","exe","msi","dmg","7z"].includes(e)) return "software";
  if (["pdf"].includes(e) || ["epub"].includes(e)) return "ebooks";
  return "study-materials";
}

export async function uploadStudyFile(file: File, opts?: { bucket?: string }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sign in required");
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  if (!ALLOWED_EXT.includes(ext as AllowedExt)) throw new Error(`Unsupported file type ".${ext}"`);
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_UPLOAD_MB) throw new Error(`File is ${sizeMb.toFixed(1)}MB. Max is ${MAX_UPLOAD_MB}MB.`);
  const bucket = opts?.bucket || bucketFor(ext);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${u.user.id}/${Date.now()}_${safe}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return { bucket, path, ext, size: file.size, type: file.type || `application/${ext}` };
}

export async function uploadThumbnail(file: File) {
  return uploadStudyFile(file, { bucket: "thumbnails" });
}

export async function signedUrl(bucket: string | null, path: string | null, expires = 60 * 60): Promise<string | null> {
  if (!bucket || !path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
  if (error) return null;
  return data.signedUrl;
}

export async function signedDownloadUrl(bucket: string | null, path: string | null, downloadName?: string): Promise<string | null> {
  if (!bucket || !path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60, {
    download: downloadName ?? true,
  });
  if (error) return null;
  return data.signedUrl;
}

/* ---------- Download logging ---------- */

export async function logDownload(materialId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { data: st } = await supabase.from("students").select("id").eq("user_id", u.user.id).maybeSingle();
  await supabase.from("download_history").insert({
    student_id: st?.id ?? null,
    user_id: u.user.id,
    study_material_id: materialId,
    device: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
  });
}

export type HistoryRow = {
  id: string;
  downloaded_at: string;
  device: string | null;
  ip_address: string | null;
  study_material_id: string;
  material?: { id: string; title: string; file_name: string | null; bucket: string | null; file_url: string | null; file_type: string | null } | null;
  student?: { id: string; full_name: string; student_code: string } | null;
};

export async function listMyHistory(limit = 50): Promise<HistoryRow[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await supabase
    .from("download_history")
    .select(`id, downloaded_at, device, ip_address, study_material_id,
             material:study_materials(id, title, file_name, bucket, file_url, file_type)`)
    .eq("user_id", u.user.id)
    .order("downloaded_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as HistoryRow[];
}

export async function listAllHistory(f: { from?: string; to?: string; materialId?: string; studentId?: string; limit?: number } = {}): Promise<HistoryRow[]> {
  let q = supabase
    .from("download_history")
    .select(`id, downloaded_at, device, ip_address, study_material_id,
             material:study_materials(id, title, file_name, bucket, file_url, file_type),
             student:students(id, full_name, student_code)`)
    .order("downloaded_at", { ascending: false });
  if (f.from) q = q.gte("downloaded_at", f.from);
  if (f.to) q = q.lte("downloaded_at", f.to);
  if (f.materialId) q = q.eq("study_material_id", f.materialId);
  if (f.studentId) q = q.eq("student_id", f.studentId);
  q = q.limit(f.limit ?? 200);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as HistoryRow[];
}

/* ---------- Favorites ---------- */

export async function listMyFavoriteIds(): Promise<Set<string>> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return new Set();
  const { data, error } = await supabase
    .from("material_favorites")
    .select("study_material_id")
    .eq("user_id", u.user.id);
  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.study_material_id));
}

export async function toggleFavorite(materialId: string, next: boolean) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Sign in required");
  if (next) {
    const { error } = await supabase.from("material_favorites").insert({ user_id: u.user.id, study_material_id: materialId });
    if (error && !error.message?.includes("duplicate")) throw error;
  } else {
    const { error } = await supabase.from("material_favorites").delete().match({ user_id: u.user.id, study_material_id: materialId });
    if (error) throw error;
  }
}

/* ---------- Analytics ---------- */

export async function analytics() {
  const { data: mats } = await supabase.from("study_materials").select("id, title, download_count, category_id, course_id, branch_id, file_type, status, created_at");
  const rows = mats ?? [];
  const total = rows.length;
  const published = rows.filter((r) => r.status === "published").length;
  const totalDownloads = rows.reduce((s, r) => s + (r.download_count ?? 0), 0);
  const top = [...rows].sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0)).slice(0, 5);
  const byCat: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const r of rows) {
    byCat[r.category_id ?? "—"] = (byCat[r.category_id ?? "—"] ?? 0) + (r.download_count ?? 0);
    byType[r.file_type ?? "—"] = (byType[r.file_type ?? "—"] ?? 0) + 1;
  }
  return { total, published, totalDownloads, top, byCat, byType };
}