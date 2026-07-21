import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Search, Youtube, Star, Loader2 } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/SiteLayout";
import { listMaterials, listCategories, signedDownloadUrl, logDownload, type Material, type Category } from "@/lib/downloads.repo";
import { fileIcon, humanSize, extOf, youTubeId } from "@/lib/downloads.utils";
import { toast } from "sonner";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Download Center — Krishna Computer Center" },
      { name: "description", content: "Access study notes, syllabus, question papers, e-books, projects and other learning resources shared by Krishna Computer Center." },
      { property: "og:title", content: "Download Center — Krishna Computer Center" },
      { property: "og:description", content: "One-stop learning resource & download hub." },
    ],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [rows, setRows] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "oldest" | "downloads">("newest");

  useEffect(() => { listCategories(true).then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    setLoading(true);
    // Public route: RLS returns only status=published, visibility=public
    listMaterials({ q, categoryId: catId || undefined, sort, status: "published", visibility: "public" })
      .then(setRows)
      .catch((e) => toast.error(e.message ?? "Failed"))
      .finally(() => setLoading(false));
  }, [q, catId, sort]);

  const onDownload = async (m: Material) => {
    try {
      if (m.external_link) { window.open(m.external_link, "_blank"); return; }
      if (m.youtube_url) { window.open(m.youtube_url, "_blank"); return; }
      const url = await signedDownloadUrl(m.bucket, m.file_url, m.file_name ?? undefined);
      if (!url) throw new Error("Download unavailable");
      window.open(url, "_blank");
      logDownload(m.id).catch(() => {});
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Resource Hub"
        title={<>Download <span className="bg-gradient-to-r from-white via-cyan-soft to-cyan bg-clip-text text-transparent">Center</span></>}
        subtitle="Notes, syllabus, question papers, e-books, video lectures and more."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-full bg-white/95 px-4 py-3 text-ink shadow-brand">
            <Search className="h-4 w-4 text-brand" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search materials by title or keyword…" className="w-full bg-transparent text-sm focus:outline-none" />
          </label>
        </div>
      </PageHero>
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCatId("")} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${!catId?"gradient-brand text-white shadow-brand":"border bg-white text-ink/70 hover:border-brand"}`}>All</button>
              {cats.map((c) => (
                <button key={c.id} onClick={()=>setCatId(c.id)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${catId===c.id?"gradient-brand text-white shadow-brand":"border bg-white text-ink/70 hover:border-brand"}`}>{c.category_name}</button>
              ))}
            </div>
            <select value={sort} onChange={(e)=>setSort(e.target.value as any)} className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-ink">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="downloads">Most downloaded</option>
            </select>
          </div>

          {loading ? (
            <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand"/></div>
          ) : rows.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">No public downloads available yet. Sign in to view materials assigned to your course.</p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((m) => {
                const Icon = m.youtube_url ? Youtube : fileIcon(m.file_type ?? m.file_name);
                return (
                  <div key={m.id} className="group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
                    {m.is_featured && <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700"><Star className="h-3 w-3"/>Featured</span>}
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-soft text-brand transition group-hover:gradient-brand group-hover:text-white"><Icon className="h-6 w-6" /></span>
                    <h3 className="mt-4 text-base font-bold text-ink line-clamp-1">{m.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{m.description ?? m.category?.category_name ?? ""}</p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-cyan-soft/70 px-2 py-0.5 font-semibold text-brand">{m.category?.category_name ?? "Resource"}</span>
                      <span>{humanSize(m.file_size)}</span>
                      <span>· {m.download_count} downloads</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => onDownload(m)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full gradient-brand px-3 py-2 text-xs font-semibold text-white shadow-brand"><Download className="h-3.5 w-3.5" /> {m.youtube_url ? "Watch" : "Download"}</button>
                      <Link to="/student-dashboard/downloads/$id" params={{ id: m.id }} className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-brand px-3 py-2 text-xs font-semibold text-brand"><Eye className="h-3.5 w-3.5" /></Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}