import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus, Search, Loader2, Download, Pencil, Trash2, Eye, CheckCircle2, XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import {
  listMaterials, setStatus, deleteMaterial, signedDownloadUrl,
  type Material, type Status,
} from "@/lib/downloads.repo";
import { fileIcon, humanSize } from "@/lib/downloads.utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/faculty/downloads")({
  head: () => ({ meta: [{ title: "My Uploads · KCC Faculty" }, { name: "robots", content: "noindex" }] }),
  component: FacultyDownloadsPage,
});

function FacultyDownloadsPage() {
  const [rows, setRows] = useState<Material[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    listMaterials({ q, onlyMine: true })
      .then(setRows).catch((e) => toast.error(e.message ?? "Failed")).finally(() => setLoading(false));
  };

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)); }, []);
  useEffect(load, [q]);

  const onDelete = async (m: Material) => {
    if (m.uploaded_by !== uid) return toast.error("You can only delete your own uploads");
    if (!confirm("Delete this material?")) return;
    try { await deleteMaterial(m.id); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const onSetStatus = async (m: Material, next: Status) => {
    if (m.uploaded_by !== uid) return toast.error("You can only edit your own uploads");
    try { await setStatus(m.id, next); toast.success(`Status: ${next}`); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };
  const onDownload = async (m: Material) => {
    const url = await signedDownloadUrl(m.bucket, m.file_url, m.file_name ?? undefined);
    if (!url) return toast.error("File unavailable");
    window.open(url, "_blank");
  };

  return (
    <DashboardShell
      title="Study material — my uploads"
      subtitle="Upload and manage materials for your assigned batches"
      actions={<Link to="/faculty/downloads/upload" className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow"><Plus className="h-4 w-4"/>Upload</Link>}
    >
      <div className="mb-4 flex items-center gap-2 rounded-2xl border bg-white p-3 shadow-soft">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search my uploads" className="w-full rounded-full border pl-10 pr-4 py-2 text-sm"/>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-soft">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">You haven't uploaded any materials yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Title</th><th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Assigned to</th><th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Downloads</th><th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const Icon = fileIcon(m.file_type ?? m.file_name);
                  const mine = m.uploaded_by === uid;
                  return (
                    <tr key={m.id} className="border-t hover:bg-cyan-soft/30">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-soft text-brand"><Icon className="h-4 w-4"/></span>
                          <div><div className="font-semibold text-ink">{m.title}</div><div className="text-[11px] text-muted-foreground line-clamp-1">{m.description}</div></div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs">{m.category?.category_name ?? "—"}</td>
                      <td className="px-4 py-2 text-[11px]">{[m.course?.name, m.branch?.name, m.batch?.name].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="px-4 py-2 text-xs">{humanSize(m.file_size)}</td>
                      <td className="px-4 py-2 text-xs">{m.download_count}</td>
                      <td className="px-4 py-2 text-xs uppercase">{m.status}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <button title="Download" onClick={() => onDownload(m)} className="rounded-lg border px-2 py-1 text-xs"><Download className="h-3.5 w-3.5"/></button>
                          {mine && (m.status !== "published"
                            ? <button title="Publish" onClick={() => onSetStatus(m, "published")} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"><CheckCircle2 className="h-3.5 w-3.5"/></button>
                            : <button title="Unpublish" onClick={() => onSetStatus(m, "unpublished")} className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"><XCircle className="h-3.5 w-3.5"/></button>)}
                          {mine && <Link to="/faculty/downloads/upload" search={{ id: m.id } as any} className="rounded-lg border px-2 py-1 text-xs"><Pencil className="h-3.5 w-3.5"/></Link>}
                          {mine && <button title="Delete" onClick={() => onDelete(m)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}