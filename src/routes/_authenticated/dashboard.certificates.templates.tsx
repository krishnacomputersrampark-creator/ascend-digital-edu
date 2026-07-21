import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LayoutTemplate, Plus, Trash2, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { listTemplates, saveTemplate, deleteTemplate, type CertificateTemplate } from "@/lib/certificates.repo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/certificates/templates")({
  head: () => ({ meta: [{ title: "Certificate Templates · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      listTemplates(),
      supabase.from("courses").select("id,name,code").order("name"),
    ])
      .then(([tpls, cs]) => { setTemplates(tpls); setCourses((cs.data ?? []) as any); })
      .catch((e) => toast.error(e.message ?? "Failed"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onCreate = async () => {
    if (!name.trim()) return toast.error("Template name required");
    setSaving(true);
    try {
      await saveTemplate({ template_name: name.trim(), course_id: courseId || null, status: "active" });
      toast.success("Template created");
      setName(""); setCourseId(""); load();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try { await deleteTemplate(id); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <DashboardShell
      title="Certificate templates"
      subtitle="Reusable templates linked to courses"
      actions={<Link to="/dashboard/certificates" className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Back</Link>}
    >
      <div className="mb-6 rounded-2xl border bg-white p-4 shadow-soft">
        <div className="mb-3 text-xs font-semibold uppercase text-brand">New template</div>
        <div className="grid gap-3 sm:grid-cols-[1fr,220px,auto]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name (e.g. ADCA Advanced Diploma)" className="rounded-xl border px-3 py-2 text-sm" />
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="">— Any course —</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={onCreate} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>} Add
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-soft">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground"/></div>
        ) : templates.length === 0 ? (
          <div className="p-10 text-center">
            <LayoutTemplate className="mx-auto mb-2 h-10 w-10 text-brand/40"/>
            <div className="text-sm font-semibold text-ink">No templates yet</div>
            <div className="text-xs text-muted-foreground">Certificates use the default premium layout until you add one.</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Course</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-2 font-semibold text-ink">{t.template_name}</td>
                  <td className="px-4 py-2">{t.course?.name ?? "Any"}</td>
                  <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status==="active"?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{t.status}</span></td>
                  <td className="px-4 py-2 text-xs">{new Date(t.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => onDelete(t.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardShell>
  );
}