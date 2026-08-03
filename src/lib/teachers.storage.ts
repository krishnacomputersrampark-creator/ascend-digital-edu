import { supabase } from "@/integrations/supabase/client";

const rand = () => (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));

/** Uploads a teacher photo or document into the private `teachers` bucket. */
export async function uploadTeacherFile(kind: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${kind}/${rand()}.${ext}`;
  const { error } = await supabase.storage.from("teachers").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return path;
}

/** Resolves a stored teacher file path into a temporary signed URL. */
export async function teacherFileUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("teachers").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}