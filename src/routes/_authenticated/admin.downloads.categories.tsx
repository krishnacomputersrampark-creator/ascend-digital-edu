import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Plus, Save, Trash2, Pencil } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { listCategories, upsertCategory, deleteCategory, type Category } from "@/lib/downloads.repo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/downloads/categories")({
  head: () => ({ meta: [{ title: "Download Categories · KCC Admin" }, { name: "robots", content: "noindex" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listCategories().then(setRows).catch((e) => toast.error(e.message ?? "Failed")).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onSave = async () => {
    if (!editing?.category_name?.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      await upsertCategory({
        id: editing.id,
        category_name: editing.category_name!.trim(),
        description: editing.description ?? null,
        icon: editing.icon ?? null,
        display_order: Number(editing.display_order ?? 0),
        status: (editing.status as any) ?? "active",
      });
      toast.success("Saved"); setEditing(null); load();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this category? Materials will lose the assignment.")) return;
    try { await deleteCategory(id); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <DashboardShell
      title="Download categories"
      subtitle="Organize study materials by category"
      actions={
        <>
          <button onClick={() => setEditing({ category_name: "", display_order: (rows.at(-1)?.display_order ?? 0) + 10, status: "active" })} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow"><Plus className="h-4 w-4"/>Add</button>
          <Link to="/admin/downloads" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Back</Link>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr,340px]">
        <div className="rounded-2xl border bg-white shadow-soft">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No categories yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
                <tr><th className="px-4 py-2">#</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Icon</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2 text-xs">{c.display_order}</td>
                    <td className="px-4 py-2 font-semibold text-ink">{c.category_name}<div className="text-[11px] text-muted-foreground">{c.description}</div></td>
                    <td className="px-4 py-2 text-xs">{c.icon ?? "—"}</td>
                    <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.status==="active"?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{c.status}</span></td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => setEditing(c)} className="rounded-lg border px-2 py-1 text-xs"><Pencil className="h-3.5 w-3.5"/></button>
                      <button onClick={() => onDelete(c.id)} className="ml-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {editing && (
          <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-soft">
            <div className="text-xs font-semibold uppercase text-brand">{editing.id ? "Edit category" : "New category"}</div>
            <label className="block"><div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Name</div>
              <input value={editing.category_name ?? ""} onChange={(e) => setEditing((f) => ({ ...(f ?? {}), category_name: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm"/>
            </label>
            <label className="block"><div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Description</div>
              <textarea value={editing.description ?? ""} onChange={(e) => setEditing((f) => ({ ...(f ?? {}), description: e.target.value }))} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm"/>
            </label>
            <label className="block"><div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Icon (lucide name)</div>
              <input value={editing.icon ?? ""} onChange={(e) => setEditing((f) => ({ ...(f ?? {}), icon: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm"/>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Order</div>
                <input type="number" value={editing.display_order ?? 0} onChange={(e) => setEditing((f) => ({ ...(f ?? {}), display_order: Number(e.target.value) }))} className="w-full rounded-xl border px-3 py-2 text-sm"/>
              </label>
              <label className="block"><div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Status</div>
                <select value={editing.status ?? "active"} onChange={(e) => setEditing((f) => ({ ...(f ?? {}), status: e.target.value as any }))} className="w-full rounded-xl border px-3 py-2 text-sm">
                  <option value="active">active</option><option value="inactive">inactive</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={onSave} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl gradient-brand px-3 py-2 text-sm font-semibold text-white shadow-brand disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Save
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}