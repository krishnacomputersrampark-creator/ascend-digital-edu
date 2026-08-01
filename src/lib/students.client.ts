import { supabase } from "@/integrations/supabase/client";

const rand = () => (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));

/** Uploads a student photo and returns its storage path. */
export async function uploadStudentPhotoFile(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `staff/${rand()}.${ext}`;
  const { error } = await supabase.storage.from("student-photos").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

/** Uploads a student document (aadhaar / marksheet / certificate / signature). */
export async function uploadStudentDocFile(kind: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  const path = `students/${kind}/${rand()}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedUrlFor(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const bucket = path.startsWith("students/") ? "documents" : "student-photos";
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}