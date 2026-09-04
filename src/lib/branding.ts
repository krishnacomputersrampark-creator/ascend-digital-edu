import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo.jpg.asset.json";

/** Bundled fallback used until a custom logo is configured. */
export const DEFAULT_LOGO_URL = logoAsset.url;

let cache: string | null | undefined;
let inflight: Promise<string | null> | null = null;

/** Reads the configured logo URL from the public institute profile settings. */
export async function fetchLogoUrl(force = false): Promise<string | null> {
  if (!force && cache !== undefined) return cache;
  if (!force && inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("group_key", "institute")
      .eq("setting_key", "profile")
      .maybeSingle();
    const url = ((data?.value as Record<string, unknown> | null)?.["logo_url"] as string | undefined)?.trim();
    cache = url ? url : null;
    return cache;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function clearLogoCache() {
  cache = undefined;
}

/** Current site logo URL — falls back to the bundled asset. */
export function useLogoUrl(): string {
  const [url, setUrl] = useState<string>(cache || DEFAULT_LOGO_URL);
  useEffect(() => {
    let alive = true;
    void fetchLogoUrl().then((u) => {
      if (alive) setUrl(u || DEFAULT_LOGO_URL);
    });
    return () => {
      alive = false;
    };
  }, []);
  return url;
}
