import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Loader2, Filter, LayoutTemplate, History as HistoryIcon,
  Download, Eye, Star, StarOff, CheckCircle2, XCircle, Trash2, Pencil, FileSpreadsheet,
} from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import {
  listMaterials, listCategories, setStatus, toggleFeatured, deleteMaterial,
  signedDownloadUrl, analytics, type Material, type Category, type Status,
} from "@/lib/downloads.repo";
import { fileIcon, humanSize, downloadExcelCsv } from "@/lib/downloads.utils";
import { toast } from "sonner";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/downloads")({
  head: () => ({ meta: [{ title: "Downloads · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminDownloadsPage,
});

function AdminDownloadsPage() {
  const [rows, setRows] = useState<Material[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState("");
  const [status, setStatusFilter] = useState<Status | "all">("all");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<any | null>(null);
  const [nameById, setNameById] = useState<Record<string, string>>({});
  const perPage = 12;

  const load = () => {
    setLoading(true);
    Promise.all([
      listMaterials({ q, categoryId: catId || undefined, status }),
      listCategories(),
      analytics(),
    ]).then(([mats, cs, an]) => {
      setRows(mats); setCats(cs); setStats(an);
      const m: Record<string, string> = {};
      for (const c of cs) m[c.id] = c.category_name;
      setNameById(m);
    }).catch((e) => toast.error(e.message ?? "Failed"))
      .finally(() => setLoading(false));
  };
  useEffect(load, [q, catId, status]);

  const paged = useMemo(() => rows.slice((page - 1) * perPage, page * perPage), [rows, page]);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));

  const onDelete = async (id: string) => {
    if (!confirm("Delete this material and its file?")) return;
    try { await deleteMaterial(id); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const onSetStatus = async (id: string, next: Status) => {
    try { await setStatus(id, next); toast.success(`Status: ${next}`); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const onFeatured = async (id: string, next: boolean) => {
    try { await toggleFeatured(id, next); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const onDownload = async (m: Material) => {
    const url = await signedDownloadUrl(m.bucket, m.file_url, m.file_name ?? undefined);
    if (!url) return toast.error("File unavailable");
    window.open(url, "_blank");
  };
  const onExport = () => {
    downloadExcelCsv("downloads-materials", rows.map((r) => ({
      title: r.title,
      category: r.category?.category_name ?? "",
      course: r.course?.name ?? "",
      branch: r.branch?.name ?? "",
      batch: r.batch?.name ?? "",
      file_name: r.file_name ?? "",
      file_type: r.file_type ?? "",
      file_size: r.file_size ?? 0,
      visibility: r.visibility,
      status: r.status,
      downloads: r.download_count,
      is_featured: r.is_featured,
      uploaded_at: r.created_at,
    })));
  };

  const cards = stats ? [
    { label: "Materials", value: stats.total, sub: `${stats.published} published`, accent: "from-blue-500 to-cyan-500" },
    { label: "Downloads", value: stats.totalDownloads, sub: "all time", accent: "from-emerald-500 to-teal-500" },
    { label: "Categories", value: cats.length, sub: "active taxonomy", accent: "from-violet-500 to-fuchsia-500" },
    { label: "Top file", value: stats.top?.[0]?.download_count ?? 0, sub: stats.top?.[0]?.title ?? "—", accent: "from-amber-500 to-orange-500" },
  ] : [];

  const monthly = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      const k = r.created_at.slice(0, 7);
      m[k] = (m[k] ?? 0) + 1;
    }
    return Object.entries(m).sort(([a],[b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
  }, [rows]);

  const byCatChart = stats ? Object.entries(stats.byCat as Record<string, number>).map(([id, count]) => ({ name: nameById[id] ?? "—", count })) : [];

  return (
    <DashboardShell
      title="Download Center"
      subtitle="Manage all study materials, categories and downloads"
      actions={
        <>
          <Link to="/admin/downloads/upload" className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow"><Plus className="h-4 w-4"/>Upload</Link>
          <Link to="/admin/downloads/categories" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><LayoutTemplate className="h-4 w-4"/>Categories</Link>
          <Link to="/admin/downloads/history" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><HistoryIcon className="h-4 w-4"/>History</Link>
          <button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><FileSpreadsheet className="h-4 w-4"/>Export</button>
        </>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border bg-gradient-to-br ${c.accent} p-4 text-white shadow-soft`}>
            <div className="text-[11px] font-semibold uppercase opacity-90">{c.label}</div>
            <div className="mt-1 text-3xl font-black">{c.value}</div>
            <div className="mt-1 truncate text-xs opacity-80">{c.sub}</div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Uploads (monthly)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month" fontSize={11}/><YAxis fontSize={11}/><Tooltip/>
                <Line dataKey="count" stroke="#0674ae" strokeWidth={2.5}/>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Downloads by category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCatChart}>
                <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={11}/><Tooltip/>
                <Bar dataKey="count" fill="#06b6d4" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-soft">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <input value={q} onChange={(e)=>{setPage(1);setQ(e.target.value);}} placeholder="Search title, description or file name" className="w-full rounded-full border pl-10 pr-4 py-2 text-sm"/>
          </div>
          <select value={catId} onChange={(e)=>setCatId(e.target.value)} className="rounded-full border px-3 py-2 text-sm">
            <option value="">All categories</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
          </select>
          <div className="inline-flex items-center gap-1 rounded-full border bg-white px-1 py-1 text-xs font-semibold">
            <Filter className="ml-2 h-3.5 w-3.5 text-muted-foreground"/>
            {(["all","published","draft","unpublished","archived"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s as any)} className={`rounded-full px-3 py-1.5 ${status===s?"gradient-brand text-white":"text-ink/70"}`}>{s}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No materials match your filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Title</th><th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Visibility</th><th className="px-4 py-2">Size</th>
                    <th className="px-4 py-2">Downloads</th><th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((m) => {
                    const Icon = fileIcon(m.file_type ?? m.file_name);
                    return (
                      <tr key={m.id} className="border-t hover:bg-cyan-soft/30">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-soft text-brand"><Icon className="h-4 w-4"/></span>
                            <div>
                              <div className="font-semibold text-ink">{m.title} {m.is_featured && <Star className="inline h-3 w-3 fill-amber-500 text-amber-500"/>}</div>
                              <div className="text-[11px] text-muted-foreground line-clamp-1">{m.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs">{m.category?.category_name ?? "—"}</td>
                        <td className="px-4 py-2 text-xs uppercase">{m.visibility}</td>
                        <td className="px-4 py-2 text-xs">{humanSize(m.file_size)}</td>
                        <td className="px-4 py-2 text-xs">{m.download_count}</td>
                        <td className="px-4 py-2"><StatusBadge s={m.status}/></td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button title="Download" onClick={() => onDownload(m)} className="rounded-lg border px-2 py-1 text-xs"><Download className="h-3.5 w-3.5"/></button>
                            <button title={m.is_featured?"Unfeature":"Feature"} onClick={() => onFeatured(m.id, !m.is_featured)} className="rounded-lg border px-2 py-1 text-xs">{m.is_featured?<StarOff className="h-3.5 w-3.5"/>:<Star className="h-3.5 w-3.5"/>}</button>
                            {m.status !== "published"
                              ? <button title="Publish" onClick={() => onSetStatus(m.id, "published")} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"><CheckCircle2 className="h-3.5 w-3.5"/></button>
                              : <button title="Unpublish" onClick={() => onSetStatus(m.id, "unpublished")} className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"><XCircle className="h-3.5 w-3.5"/></button>
                            }
                            <Link to="/admin/downloads/upload" search={{ id: m.id } as any} className="rounded-lg border px-2 py-1 text-xs"><Pencil className="h-3.5 w-3.5"/></Link>
                            <button title="Delete" onClick={() => onDelete(m.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
              <div>Showing {(page-1)*perPage+1}–{Math.min(page*perPage,rows.length)} of {rows.length}</div>
              <div className="flex gap-1">
                <button disabled={page<=1} onClick={()=>setPage((p)=>p-1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Prev</button>
                <button disabled={page>=totalPages} onClick={()=>setPage((p)=>p+1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function StatusBadge({ s }: { s: Status }) {
  const cls: Record<Status, string> = {
    published: "bg-emerald-100 text-emerald-700",
    draft: "bg-slate-100 text-slate-600",
    unpublished: "bg-amber-100 text-amber-700",
    archived: "bg-rose-100 text-rose-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls[s]}`}>{s}</span>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-soft">
      <div className="mb-3 text-sm font-bold text-ink">{title}</div>
      <div className="h-56">{children}</div>
    </div>
  );
}