import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Search, Youtube, Star, Loader2, Filter, LayoutGrid, List, Heart, History } from "lucide-react";
import { PortalShell } from "@/components/student/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import {
  listMaterials, listCategories, signedDownloadUrl, logDownload,
  listMyFavoriteIds, toggleFavorite, listMyHistory,
  type Material, type Category, type HistoryRow,
} from "@/lib/downloads.repo";
import { fileIcon, humanSize, extOf } from "@/lib/downloads.utils";
import { toast } from "sonner";

export const Route = createFileRoute("/student-dashboard_/downloads")({
  head: () => ({ meta: [{ title: "My Downloads · KCC Student Portal" }, { name: "robots", content: "noindex" }] }),
  component: StudentDownloadsPage,
});

function StudentDownloadsPage() {
  const [me, setMe] = useState<{ name: string; initials: string; sub: string } | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [rows, setRows] = useState<Material[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState<string>("");
  const [ftype, setFtype] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "oldest" | "downloads">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [tab, setTab] = useState<"all" | "favorites" | "history">("all");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: st } = await supabase.from("students").select("full_name, student_code").eq("user_id", u.user.id).maybeSingle();
        if (st) setMe({ name: st.full_name, initials: st.full_name.split(" ").map((x) => x[0]).slice(0,2).join("").toUpperCase(), sub: st.student_code });
      }
    })();
    listCategories(true).then(setCats).catch(() => {});
    listMyFavoriteIds().then(setFavs).catch(() => {});
    listMyHistory(20).then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    listMaterials({ q, categoryId: catId || undefined, fileType: ftype || undefined, sort, status: "published" })
      .then(setRows)
      .catch((e) => toast.error(e.message ?? "Failed"))
      .finally(() => setLoading(false));
  }, [q, catId, ftype, sort]);

  const visible = useMemo(() => tab === "favorites" ? rows.filter((r) => favs.has(r.id)) : rows, [rows, favs, tab]);

  const onDownload = async (m: Material) => {
    try {
      if (m.external_link) { window.open(m.external_link, "_blank"); logDownload(m.id).catch(() => {}); return; }
      if (m.youtube_url) { window.open(m.youtube_url, "_blank"); logDownload(m.id).catch(() => {}); return; }
      const url = await signedDownloadUrl(m.bucket, m.file_url, m.file_name ?? undefined);
      if (!url) throw new Error("Download unavailable");
      window.open(url, "_blank");
      await logDownload(m.id);
      listMyHistory(20).then(setHistory).catch(() => {});
      toast.success("Download started");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const onFav = async (id: string) => {
    const next = !favs.has(id);
    setFavs((prev) => { const n = new Set(prev); next ? n.add(id) : n.delete(id); return n; });
    try { await toggleFavorite(id, next); } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const fileTypes = Array.from(new Set(rows.map((r) => r.file_type).filter(Boolean))) as string[];

  return (
    <PortalShell name={me?.name ?? "Student"} initials={me?.initials ?? "S"} subline={me?.sub}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-ink">Downloads & Study Material</h1>
            <p className="text-sm text-muted-foreground">Materials assigned to your course, branch and batch.</p>
          </div>
          <div className="flex gap-1 rounded-full border bg-white p-1 text-xs font-semibold">
            {(["all","favorites","history"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${tab===t?"gradient-brand text-white":"text-ink/70"}`}>
                {t==="favorites" ? <Heart className="h-3.5 w-3.5"/> : t==="history" ? <History className="h-3.5 w-3.5"/> : null}
                {t==="all" ? "All materials" : t==="favorites" ? "Favorites" : "History"}
              </button>
            ))}
          </div>
        </div>

        {tab === "history" ? (
          <HistoryTable rows={history} />
        ) : (
          <>
            <div className="mb-4 grid gap-3 rounded-2xl border bg-white p-3 shadow-soft sm:grid-cols-2 lg:grid-cols-[1fr,180px,180px,140px,auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or keyword" className="w-full rounded-xl border pl-10 pr-4 py-2 text-sm"/>
              </div>
              <select value={catId} onChange={(e)=>setCatId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
                <option value="">All categories</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
              </select>
              <select value={ftype} onChange={(e)=>setFtype(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
                <option value="">All file types</option>
                {fileTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={sort} onChange={(e)=>setSort(e.target.value as any)} className="rounded-xl border px-3 py-2 text-sm">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="downloads">Most downloaded</option>
              </select>
              <div className="flex gap-1 rounded-full border bg-white p-1">
                <button onClick={()=>setView("grid")} className={`grid h-8 w-8 place-items-center rounded-full ${view==="grid"?"gradient-brand text-white":"text-muted-foreground"}`}><LayoutGrid className="h-4 w-4"/></button>
                <button onClick={()=>setView("list")} className={`grid h-8 w-8 place-items-center rounded-full ${view==="list"?"gradient-brand text-white":"text-muted-foreground"}`}><List className="h-4 w-4"/></button>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand"/></div>
            ) : visible.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed p-12 text-center">
                <div className="text-sm font-semibold text-ink">No materials found</div>
                <div className="text-xs text-muted-foreground">Nothing matches your filters yet.</div>
              </div>
            ) : view === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((m) => (
                  <MaterialCard key={m.id} m={m} fav={favs.has(m.id)} onDownload={onDownload} onFav={onFav} />
                ))}
              </div>
            ) : (
              <MaterialList rows={visible} favs={favs} onDownload={onDownload} onFav={onFav}/>
            )}
          </>
        )}
      </div>
    </PortalShell>
  );
}

function MaterialCard({ m, fav, onDownload, onFav }: { m: Material; fav: boolean; onDownload: (m: Material) => void; onFav: (id: string) => void }) {
  const Icon = m.youtube_url ? Youtube : fileIcon(m.file_type ?? m.file_name);
  return (
    <div className="group relative overflow-hidden rounded-3xl border bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-brand">
      <button onClick={() => onFav(m.id)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border bg-white">
        <Heart className={`h-4 w-4 ${fav?"fill-rose-500 text-rose-500":"text-slate-400"}`}/>
      </button>
      {m.is_featured && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700"><Star className="h-3 w-3"/>Featured</span>}
      <span className="mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-soft text-brand"><Icon className="h-6 w-6" /></span>
      <h3 className="mt-3 text-base font-bold text-ink line-clamp-1">{m.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{m.description ?? m.category?.category_name ?? ""}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-full bg-cyan-soft/70 px-2 py-0.5 font-semibold text-brand">{m.category?.category_name ?? "Resource"}</span>
        <span>{humanSize(m.file_size)}</span>
        <span>· {m.download_count} downloads</span>
        <span>· {new Date(m.created_at).toLocaleDateString("en-IN")}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => onDownload(m)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full gradient-brand px-3 py-2 text-xs font-semibold text-white shadow-brand"><Download className="h-3.5 w-3.5" /> {m.youtube_url?"Watch":"Download"}</button>
        <Link to="/student-dashboard/downloads/$id" params={{ id: m.id }} className="inline-flex items-center justify-center gap-1 rounded-full border-2 border-brand px-3 py-2 text-xs font-semibold text-brand"><Eye className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}

function MaterialList({ rows, favs, onDownload, onFav }: { rows: Material[]; favs: Set<string>; onDownload: (m: Material) => void; onFav: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Size</th>
            <th className="px-4 py-2">Downloads</th>
            <th className="px-4 py-2">Uploaded</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const Icon = m.youtube_url ? Youtube : fileIcon(m.file_type ?? m.file_name);
            return (
              <tr key={m.id} className="border-t hover:bg-cyan-soft/30">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-soft text-brand"><Icon className="h-4 w-4"/></span>
                    <div><div className="font-semibold text-ink">{m.title}</div><div className="text-[11px] text-muted-foreground line-clamp-1">{m.description}</div></div>
                  </div>
                </td>
                <td className="px-4 py-2 text-xs">{m.category?.category_name ?? "—"}</td>
                <td className="px-4 py-2 text-xs">{humanSize(m.file_size)}</td>
                <td className="px-4 py-2 text-xs">{m.download_count}</td>
                <td className="px-4 py-2 text-xs">{new Date(m.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onFav(m.id)} className="rounded-lg border px-2 py-1"><Heart className={`h-3.5 w-3.5 ${favs.has(m.id)?"fill-rose-500 text-rose-500":""}`}/></button>
                    <Link to="/student-dashboard/downloads/$id" params={{ id: m.id }} className="rounded-lg border px-2 py-1 text-xs"><Eye className="h-3.5 w-3.5"/></Link>
                    <button onClick={() => onDownload(m)} className="rounded-lg gradient-brand px-3 py-1 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5"/></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  if (!rows.length) return <div className="rounded-3xl border-2 border-dashed p-12 text-center text-sm text-muted-foreground">You haven't downloaded anything yet.</div>;
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
          <tr><th className="px-4 py-2">Material</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Downloaded</th></tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.id} className="border-t">
              <td className="px-4 py-2 font-semibold text-ink">{h.material?.title ?? "—"}</td>
              <td className="px-4 py-2 text-xs">{h.material?.file_type ?? "—"}</td>
              <td className="px-4 py-2 text-xs">{new Date(h.downloaded_at).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}