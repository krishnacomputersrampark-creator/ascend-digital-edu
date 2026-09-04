import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImageUp, Loader2, RotateCcw, Save } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSettings, saveSettings } from "@/lib/settings.functions";
import { uploadLogoFile } from "@/lib/branding.storage";
import { clearLogoCache, DEFAULT_LOGO_URL, fetchLogoUrl } from "@/lib/branding";

export const Route = createFileRoute("/_authenticated/dashboard/settings/logo")({
  head: () => ({
    meta: [
      { title: "Logo Manager · Krishna Computer Center ERP" },
      { name: "description", content: "Upload a new institute logo and update the website header and footer instantly." },
      { property: "og:title", content: "Logo Manager · Krishna Computer Center ERP" },
      { property: "og:description", content: "Upload a new institute logo and update the website header and footer instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LogoManagerPage,
});

function LogoManagerPage() {
  const load = useServerFn(getSettings);
  const save = useServerFn(saveSettings);
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Record<string, any>>({});
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const value = (await load({ data: { group: "institute", key: "profile" } })) as Record<string, any>;
        setProfile(value ?? {});
        setUrl(((value?.logo_url as string) ?? "").trim());
      } catch (e: any) {
        toast.error(e?.message ?? "Could not load the current logo");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const persist = async (nextUrl: string) => {
    setBusy(true);
    try {
      await save({
        data: {
          group: "institute",
          key: "profile",
          value: { ...profile, logo_url: nextUrl },
          label: "Institute logo",
        },
      });
      setProfile((p) => ({ ...p, logo_url: nextUrl }));
      setUrl(nextUrl);
      clearLogoCache();
      await fetchLogoUrl(true);
      toast.success(nextUrl ? "Logo updated across the site" : "Reverted to the default logo");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the logo");
    } finally {
      setBusy(false);
    }
  };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be smaller than 5 MB");
    setBusy(true);
    try {
      const uploaded = await uploadLogoFile(file);
      await persist(uploaded);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
      setBusy(false);
    }
  };

  const preview = url || DEFAULT_LOGO_URL;

  return (
    <DashboardShell title="Logo Manager" subtitle="Upload a logo and update the website header and footer instantly">
      {loading ? (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="glass-card rounded-2xl p-5 shadow-soft">
            <h2 className="text-sm font-bold text-ink">Current logo</h2>
            <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-border bg-white p-6">
              <img src={preview} alt="Current institute logo" className="h-28 w-28 rounded-xl object-contain" />
            </div>
            <p className="mt-3 break-all text-[11px] text-muted-foreground">{url || "Using the built-in default logo"}</p>
          </div>

          <div className="glass-card rounded-2xl p-5 shadow-soft">
            <h2 className="text-sm font-bold text-ink">Upload a new logo</h2>
            <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, SVG or WebP up to 5 MB. Square images look best.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPick(e.target.files?.[0])}
            />
            <Button className="mt-4" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
              Upload logo
            </Button>

            <div className="mt-6 border-t pt-5">
              <h3 className="text-sm font-bold text-ink">Or use an image URL</h3>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={busy} onClick={() => void persist(url.trim())}>
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => void persist("")}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Changes appear on the website header, footer and dashboard immediately — no redeploy needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
