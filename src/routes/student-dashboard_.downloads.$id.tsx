import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Youtube, Heart, Star, ExternalLink } from "lucide-react";
import { PortalShell } from "@/components/student/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import {
  getMaterial, signedUrl, signedDownloadUrl, logDownload,
  listMyFavoriteIds, toggleFavorite, type Material,
} from "@/lib/downloads.repo";
import { fileIcon, humanSize, extOf, isPreviewable, youTubeId } from "@/lib/downloads.utils";
import { toast } from "sonner";

export const Route = createFileRoute("/student-dashboard_/downloads/$id")({
  head: () => ({ meta: [{ title: "Material · KCC Student Portal" }, { name: "robots", content: "noindex" }] }),
  component: MaterialDetailPage,
  errorComponent: () => <div className="p-10 text-center text-sm text-muted-foreground">Unable to load material.</div>,
  notFoundComponent: () => <div className="p-10 text-center text-sm text-muted-foreground">Material not found.</div>,
});

function MaterialDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [m, setM] = useState<Material | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [me, setMe] = useState<{ name: string; initials: string; sub: string } | null>(null);
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: st } = await supabase.from("students").select("full_name, student_code").eq("user_id", u.user.id).maybeSingle();
        if (st) setMe({ name: st.full_name, initials: st.full_name.split(" ").map((x)=>x[0]).slice(0,2).join("").toUpperCase(), sub: st.student_code });
      }
      try {
        const mat = await getMaterial(id);
        setM(mat);
        if (mat) {
          const ext = extOf(mat.file_type ?? mat.file_name ?? "");
          if (isPreviewable(ext) && mat.bucket && mat.file_url) setPreview(await signedUrl(mat.bucket, mat.file_url, 60 * 30));
          if (mat.thumbnail_url) setThumb(await signedUrl("thumbnails", mat.thumbnail_url, 60 * 60));
          const favs = await listMyFavoriteIds();
          setFav(favs.has(mat.id));
        }
      } catch (e: any) { toast.error(e.message ?? "Failed"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const onDownload = async () => {
    if (!m) return;
    try {
      if (m.external_link) { window.open(m.external_link, "_blank"); logDownload(m.id).catch(() => {}); return; }
      if (m.youtube_url) { window.open(m.youtube_url, "_blank"); logDownload(m.id).catch(() => {}); return; }
      const url = await signedDownloadUrl(m.bucket, m.file_url, m.file_name ?? undefined);
      if (!url) throw new Error("Download unavailable");
      window.open(url, "_blank");
      logDownload(m.id).catch(() => {});
      toast.success("Download started");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const onFav = async () => {
    if (!m) return;
    const next = !fav; setFav(next);
    try { await toggleFavorite(m.id, next); } catch (e: any) { toast.error(e.message ?? "Failed"); setFav(!next); }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand"/></div>;
  if (!m) return <div className="p-10 text-center text-sm text-muted-foreground">Material not found.</div>;

  const yt = youTubeId(m.youtube_url);
  const ext = extOf(m.file_type ?? m.file_name ?? "");
  const kind = isPreviewable(ext);
  const Icon = m.youtube_url ? Youtube : fileIcon(ext);

  return (
    <PortalShell name={me?.name ?? "Student"} initials={me?.initials ?? "S"} subline={me?.sub}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => router.history.back()} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Back</button>
          <div className="flex gap-2">
            <button onClick={onFav} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><Heart className={`h-4 w-4 ${fav?"fill-rose-500 text-rose-500":""}`}/>{fav?"Favorited":"Favorite"}</button>
            <button onClick={onDownload} className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-brand"><Download className="h-4 w-4"/>{m.youtube_url?"Watch":"Download"}</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          <div className="rounded-3xl border bg-white p-4 shadow-soft">
            {yt ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${yt}`} title={m.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : kind === "pdf" && preview ? (
              <iframe title={m.title} src={preview} className="h-[75vh] w-full rounded-2xl border" />
            ) : kind === "image" && preview ? (
              <img src={preview} alt={m.title} className="mx-auto max-h-[75vh] rounded-2xl border object-contain"/>
            ) : kind === "video" && preview ? (
              <video src={preview} controls className="w-full rounded-2xl"/>
            ) : kind === "audio" && preview ? (
              <audio src={preview} controls className="w-full"/>
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-cyan-soft/60 to-white p-14 text-center">
                {thumb ? <img src={thumb} alt="" className="mx-auto mb-4 h-40 rounded-xl object-cover"/> : <span className="mx-auto mb-4 grid h-24 w-24 place-items-center rounded-3xl bg-white text-brand shadow-brand"><Icon className="h-12 w-12"/></span>}
                <div className="text-lg font-bold text-ink">Preview not available</div>
                <p className="mt-1 text-sm text-muted-foreground">Use the Download button to view this file.</p>
                {m.external_link && <a href={m.external_link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand"><ExternalLink className="h-4 w-4"/>Open external link</a>}
              </div>
            )}
          </div>
          <aside className="space-y-3">
            <div className="rounded-3xl border bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-soft text-brand"><Icon className="h-6 w-6"/></span>
                <div><h2 className="text-lg font-black text-ink">{m.title}</h2>{m.is_featured && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700"><Star className="h-3 w-3"/>Featured</span>}</div>
              </div>
              {m.description && <p className="mt-3 text-sm text-slate-700">{m.description}</p>}
              <dl className="mt-4 divide-y text-sm">
                <Row k="Category" v={m.category?.category_name ?? "—"} />
                <Row k="Course" v={m.course?.name ?? "—"} />
                <Row k="Branch" v={m.branch?.name ?? "—"} />
                <Row k="Batch" v={m.batch?.name ?? "—"} />
                <Row k="File type" v={m.file_type ?? "—"} />
                <Row k="File size" v={humanSize(m.file_size)} />
                <Row k="Downloads" v={m.download_count} />
                <Row k="Uploaded" v={new Date(m.created_at).toLocaleString("en-IN")} />
              </dl>
            </div>
            <Link to="/student-dashboard/downloads" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Back to library</Link>
          </aside>
        </div>
      </div>
    </PortalShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2">
      <dt className="text-muted-foreground">{k}</dt><dd className="font-semibold text-ink text-right">{v}</dd>
    </div>
  );
}