import { supabase } from "@/integrations/supabase/client";

const rand = () => (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));

export const BRANDING_BUCKET = "branding";

/**
 * Uploads a logo image to the private branding bucket and returns the
 * stable public URL served by /api/public/branding/*.
 */
export async function uploadLogoFile(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `logo/${rand()}.${ext || "png"}`;
  const { error } = await supabase.storage
    .from(BRANDING_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/png", cacheControl: "3600" });
  if (error) throw new Error(error.message);
  return `/api/public/branding/${path}`;
}
