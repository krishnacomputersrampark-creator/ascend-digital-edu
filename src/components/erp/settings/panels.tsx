import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Pencil, History, ShieldCheck, Database } from "lucide-react";
import * as repo from "@/lib/settings.functions";
import type * as repoTypes from "@/lib/settings.repo";
import { SETTINGS_GROUPS, INTEGRATION_DEFS, PERMISSION_KEYS, type SettingsGroupDef } from "@/lib/settings.schema";
import type { AppRole } from "@/lib/auth";
import { SettingInput, FieldRow, PanelCard, EmptyState, Loading } from "./fields";

const btn = "inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2 text-sm font-bold text-white shadow-brand disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-cyan-soft";
const inp = "w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

/* ============ generic settings group ============ */
export function GroupSettingsPanel({ def, search }: { def: SettingsGroupDef; search: string }) {
  const [value, setValue] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    repo.getSettings({ group: def.group, key: def.settingKey })
      .then((v) => { if (alive) setValue(v as any); })
      .catch((e) => toast.error(e.message));
    return () => { alive = false; };
  }, [def.group, def.settingKey]);

  const cards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return def.cards;
    return def.cards
      .map((c) => ({ ...c, fields: c.fields.filter((f) => f.label.toLowerCase().includes(q) || f.key.includes(q) || c.title.toLowerCase().includes(q)) }))
      .filter((c) => c.fields.length > 0);
  }, [def.cards, search]);

  if (!value) return <Loading />;

  const save = async () => {
    setBusy(true);
    try {
      await repo.saveSettings({ group: def.group, key: def.settingKey, value, label: def.title });
      toast.success(`${def.title} saved`);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      {cards.length === 0 ? <EmptyState text="No configuration matches your search in this section." /> : null}
      {cards.map((card) => (
        <PanelCard key={card.title} title={card.title}>
          <div className="grid gap-4 sm:grid-cols-2">
            {card.fields.map((f) => (
              <FieldRow key={f.key} field={f}>
                <SettingInput field={f} value={value[f.key]} onChange={(v) => setValue({ ...value, [f.key]: v })} />
              </FieldRow>
            ))}
          </div>
        </PanelCard>
      ))}
      <div className="flex justify-end">
        <button className={btn} disabled={busy} onClick={save}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save {def.title}
        </button>
      </div>
    </div>
  );
}

/* ============ masters ============ */
export function MastersPanel({ search }: { search: string }) {
  const [cats, setCats] = useState<repoTypes.MasterCategory[]>([]);
  const [active, setActive] = useState<repoTypes.MasterCategory | null>(null);
  const [rows, setRows] = useState<repoTypes.MasterValue[]>([]);
  const [rowSearch, setRowSearch] = useState("");
  const [editing, setEditing] = useState<Partial<repoTypes.MasterValue> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { repo.listMasterCategories().then(setCats).catch((e) => toast.error(e.message)); }, []);

  const load = async (cat: repoTypes.MasterCategory) => {
    setActive(cat);
    setRows(await repo.listMasterValues(cat.id));
  };

  const filteredCats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? cats.filter((c) => c.name.toLowerCase().includes(q) || c.key.includes(q)) : cats;
  }, [cats, search]);

  const visibleRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.code.includes(q)) : rows;
  }, [rows, rowSearch]);

  const submit = async () => {
    if (!active || !editing) return;
    if (!editing.name?.trim()) { toast.error("Display name is required"); return; }
    setBusy(true);
    try {
      if (editing.id) await repo.updateMasterValue({ id: editing.id, patch: editing, prev: rows.find((r) => r.id === editing.id) });
      else await repo.createMasterValue({ categoryId: active.id, input: { ...editing, code: editing.code || editing.name } });
      toast.success("Master saved");
      setEditing(null);
      await load(active);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const remove = async (row: repoTypes.MasterValue) => {
    if (!active) return;
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    try { await repo.deleteMasterValue({ id: row.id, prev: row }); toast.success("Deleted"); await load(active); }
    catch (e) { toast.error((e as Error).message); }
  };

  const toggle = async (row: repoTypes.MasterValue) => {
    if (!active) return;
    try { await repo.updateMasterValue({ id: row.id, patch: { is_active: !row.is_active }, prev: row }); await load(active); }
    catch (e) { toast.error((e as Error).message); }
  };

  if (!active) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCats.length === 0 ? <EmptyState text="No masters match your search." /> : null}
        {filteredCats.map((c) => (
          <button key={c.id} onClick={() => load(c)} className="glass-card rounded-2xl p-4 text-left shadow-soft transition hover:-translate-y-0.5">
            <h3 className="text-sm font-bold text-ink">{c.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
            <span className="mt-3 inline-block text-[11px] font-bold text-brand">Manage →</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => { setActive(null); setEditing(null); }} className={btnGhost}>← All Masters</button>
        <div className="flex flex-1 items-center justify-end gap-2">
          <input value={rowSearch} onChange={(e) => setRowSearch(e.target.value)} placeholder={`Search ${active.name}…`} className={`${inp} max-w-xs`} />
          <button className={btn} onClick={() => setEditing({ name: "", code: "", is_active: true, sort_order: rows.length + 1 })}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {editing ? (
        <PanelCard title={editing.id ? `Edit ${active.name}` : `Add ${active.name}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-ink/80">Display Name</span>
              <input className={`${inp} mt-1`} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Internal Code</span>
              <input className={`${inp} mt-1`} value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-semibold text-ink/80">Description</span>
              <input className={`${inp} mt-1`} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Sort Order</span>
              <input type="number" className={`${inp} mt-1`} value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></label>
            <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-ink/80">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
            <button className={btn} disabled={busy} onClick={submit}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
          </div>
        </PanelCard>
      ) : null}

      <div className="glass-card overflow-x-auto rounded-2xl shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-cyan-soft/60 text-left text-xs font-bold text-ink">
            <tr><th className="p-3">Name</th><th className="p-3">Code</th><th className="p-3">Order</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-semibold text-ink">{r.name}</td>
                <td className="p-3 text-muted-foreground">{r.code}</td>
                <td className="p-3">{r.sort_order}</td>
                <td className="p-3">
                  <button onClick={() => toggle(r)} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${r.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                    {r.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <button className={btnGhost} onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button className={`${btnGhost} ml-2 text-red-600`} onClick={() => remove(r)}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No values yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ branches ============ */
export function BranchesPanel() {
  const [rows, setRows] = useState<repoTypes.BranchRow[]>([]);
  const [draft, setDraft] = useState<Record<string, Partial<repoTypes.BranchRow>>>({});
  const load = () => repo.listBranches().then(setRows).catch((e: Error) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const save = async (row: repoTypes.BranchRow) => {
    const patch = draft[row.id];
    if (!patch) return;
    try { await repo.saveBranch({ id: row.id, patch, prev: row }); toast.success("Branch updated"); setDraft({ ...draft, [row.id]: {} }); load(); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      {rows.map((b) => {
        const d = { ...b, ...(draft[b.id] ?? {}) };
        const set = (k: keyof repo.BranchRow, v: unknown) => setDraft({ ...draft, [b.id]: { ...(draft[b.id] ?? {}), [k]: v } });
        return (
          <PanelCard key={b.id} title={b.name}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-semibold text-ink/80">Branch Name</span><input className={`${inp} mt-1`} value={d.name ?? ""} onChange={(e) => set("name", e.target.value)} /></label>
              <label className="block"><span className="text-xs font-semibold text-ink/80">Branch Code</span><input className={`${inp} mt-1`} value={d.code ?? ""} onChange={(e) => set("code", e.target.value)} /></label>
              <label className="block sm:col-span-2"><span className="text-xs font-semibold text-ink/80">Complete Address</span><textarea rows={2} className={`${inp} mt-1`} value={d.address ?? ""} onChange={(e) => set("address", e.target.value)} /></label>
              <label className="block"><span className="text-xs font-semibold text-ink/80">Phone</span><input className={`${inp} mt-1`} value={d.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></label>
              <label className="block"><span className="text-xs font-semibold text-ink/80">Email</span><input className={`${inp} mt-1`} value={d.email ?? ""} onChange={(e) => set("email", e.target.value)} /></label>
              <label className="block"><span className="text-xs font-semibold text-ink/80">City</span><input className={`${inp} mt-1`} value={d.city ?? ""} onChange={(e) => set("city", e.target.value)} /></label>
              <label className="block"><span className="text-xs font-semibold text-ink/80">Pincode</span><input className={`${inp} mt-1`} value={d.pincode ?? ""} onChange={(e) => set("pincode", e.target.value)} /></label>
              <label className="flex items-center gap-2 text-xs font-semibold text-ink/80">
                <input type="checkbox" checked={d.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} /> Active
              </label>
            </div>
            <div className="mt-4 flex justify-end"><button className={btn} onClick={() => save(b)}><Save className="h-4 w-4" /> Save Branch</button></div>
          </PanelCard>
        );
      })}
      {rows.length === 0 ? <EmptyState text="No branches found." /> : null}
    </div>
  );
}

/* ============ menu ============ */
export function MenuPanel({ search }: { search: string }) {
  const [rows, setRows] = useState<repoTypes.MenuItemConfig[]>([]);
  const load = () => repo.listMenuConfig().then(setRows).catch((e: Error) => toast.error(e.message));
  useEffect(() => { load(); }, []);
  const q = search.trim().toLowerCase();
  const visible = q ? rows.filter((r) => r.label.toLowerCase().includes(q) || r.key.includes(q)) : rows;

  const patch = async (row: repoTypes.MenuItemConfig, p: Partial<repoTypes.MenuItemConfig>) => {
    try { await repo.updateMenuItem({ id: row.id, patch: p, prev: row }); setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...p } : r))); }
    catch (e) { toast.error((e as Error).message); }
  };
  const ROLES: AppRole[] = ["super_admin", "admin", "branch_manager", "faculty", "student"];

  return (
    <div className="space-y-3">
      {visible.map((m) => (
        <PanelCard key={m.id} title={m.label}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-xs font-semibold text-ink/80">Menu Label</span>
              <input className={`${inp} mt-1`} defaultValue={m.label} onBlur={(e) => e.target.value !== m.label && patch(m, { label: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Icon (lucide name)</span>
              <input className={`${inp} mt-1`} defaultValue={m.icon ?? ""} onBlur={(e) => patch(m, { icon: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Order</span>
              <input type="number" className={`${inp} mt-1`} defaultValue={m.sort_order} onBlur={(e) => patch(m, { sort_order: Number(e.target.value) })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Path</span>
              <input className={`${inp} mt-1`} defaultValue={m.path ?? ""} readOnly /></label>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-ink/80">
                <input type="checkbox" checked={m.is_enabled} onChange={(e) => patch(m, { is_enabled: e.target.checked })} /> Enabled
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-ink/80">
                <input type="checkbox" checked={m.is_public} onChange={(e) => patch(m, { is_public: e.target.checked })} /> Public
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink/80">Visible to:</span>
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <input type="checkbox" checked={m.roles.includes(r)}
                      onChange={(e) => patch(m, { roles: e.target.checked ? [...m.roles, r] : m.roles.filter((x) => x !== r) })} /> {r}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </PanelCard>
      ))}
      {visible.length === 0 ? <EmptyState text="No menu items match your search." /> : null}
    </div>
  );
}

/* ============ forms ============ */
export function FormsPanel() {
  const [forms, setForms] = useState<repoTypes.FormConfig[]>([]);
  const [active, setActive] = useState<repoTypes.FormConfig | null>(null);
  const [fields, setFields] = useState<repoTypes.FormField[]>([]);
  const [adding, setAdding] = useState<Partial<repoTypes.FormField> | null>(null);

  useEffect(() => { repo.listFormConfigs().then(setForms).catch((e) => toast.error(e.message)); }, []);
  const load = async (f: repoTypes.FormConfig) => { setActive(f); setFields(await repo.listFormFields(f.id)); };

  const patch = async (f: repoTypes.FormField, p: Partial<repoTypes.FormField>) => {
    try { await repo.updateFormField({ id: f.id, patch: p, prev: f }); setFields((fs) => fs.map((x) => (x.id === f.id ? { ...x, ...p } : x))); }
    catch (e) { toast.error((e as Error).message); }
  };

  if (!active) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((f) => (
          <button key={f.id} onClick={() => load(f)} className="glass-card rounded-2xl p-4 text-left shadow-soft transition hover:-translate-y-0.5">
            <h3 className="text-sm font-bold text-ink">{f.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
            <span className="mt-3 inline-block text-[11px] font-bold text-brand">Configure →</span>
          </button>
        ))}
      </div>
    );
  }

  const TYPES = ["text", "number", "email", "phone", "date", "dropdown", "checkbox", "textarea", "file"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button className={btnGhost} onClick={() => setActive(null)}>← All Forms</button>
        <button className={btn} onClick={() => setAdding({ field_key: "", label: "", field_type: "text", is_visible: true, sort_order: fields.length + 1 })}><Plus className="h-4 w-4" /> Add Field</button>
      </div>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
        Form configuration controls labels, visibility and validation only. It never changes database structure.
      </p>
      {adding ? (
        <PanelCard title="New Field">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={inp} placeholder="Field Key" value={adding.field_key ?? ""} onChange={(e) => setAdding({ ...adding, field_key: e.target.value })} />
            <input className={inp} placeholder="Label" value={adding.label ?? ""} onChange={(e) => setAdding({ ...adding, label: e.target.value })} />
            <select className={inp} value={adding.field_type} onChange={(e) => setAdding({ ...adding, field_type: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button className={btnGhost} onClick={() => setAdding(null)}>Cancel</button>
            <button className={btn} onClick={async () => {
              try { await repo.createFormField({ formConfigId: active.id, patch: adding }); setAdding(null); await load(active); toast.success("Field added"); }
              catch (e) { toast.error((e as Error).message); }
            }}><Save className="h-4 w-4" /> Add</button>
          </div>
        </PanelCard>
      ) : null}

      {fields.map((f) => (
        <PanelCard key={f.id} title={`${f.label} (${f.field_key})`} action={
          <button className={`${btnGhost} text-red-600`} onClick={async () => {
            if (!window.confirm(`Delete field "${f.label}"?`)) return;
            try { await repo.deleteFormField({ id: f.id, prev: f }); await load(active); toast.success("Field deleted"); } catch (e) { toast.error((e as Error).message); }
          }}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        }>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block"><span className="text-xs font-semibold text-ink/80">Label</span>
              <input className={`${inp} mt-1`} defaultValue={f.label} onBlur={(e) => e.target.value !== f.label && patch(f, { label: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Field Type</span>
              <select className={`${inp} mt-1`} value={f.field_type} onChange={(e) => patch(f, { field_type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Sort Order</span>
              <input type="number" className={`${inp} mt-1`} defaultValue={f.sort_order} onBlur={(e) => patch(f, { sort_order: Number(e.target.value) })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Placeholder</span>
              <input className={`${inp} mt-1`} defaultValue={f.placeholder ?? ""} onBlur={(e) => patch(f, { placeholder: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Help Text</span>
              <input className={`${inp} mt-1`} defaultValue={f.help_text ?? ""} onBlur={(e) => patch(f, { help_text: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Default Value</span>
              <input className={`${inp} mt-1`} defaultValue={f.default_value ?? ""} onBlur={(e) => patch(f, { default_value: e.target.value })} /></label>
            <div className="flex items-center gap-4 sm:col-span-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-ink/80"><input type="checkbox" checked={f.is_required} onChange={(e) => patch(f, { is_required: e.target.checked })} /> Required</label>
              <label className="flex items-center gap-2 text-xs font-semibold text-ink/80"><input type="checkbox" checked={f.is_visible} onChange={(e) => patch(f, { is_visible: e.target.checked })} /> Visible</label>
            </div>
          </div>
        </PanelCard>
      ))}
    </div>
  );
}

/* ============ notification + document templates ============ */
export function TemplatesPanel() {
  const [tab, setTab] = useState<"notification" | "document">("notification");
  const [notifs, setNotifs] = useState<repoTypes.NotificationTemplate[]>([]);
  const [docs, setDocs] = useState<repoTypes.DocumentTemplate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<repoTypes.NotificationTemplate>>>({});
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    repo.listNotificationTemplates().then(setNotifs).catch((e) => toast.error(e.message));
    repo.listDocumentTemplates().then(setDocs).catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["notification", "document"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-xs font-bold ${tab === t ? "gradient-brand text-white shadow-brand" : "border text-ink"}`}>
            {t === "notification" ? "Notification Templates" : "Document Templates"}
          </button>
        ))}
      </div>

      {tab === "notification" ? notifs.map((t) => {
        const d = { ...t, ...(drafts[t.id] ?? {}) };
        const set = (p: Partial<repoTypes.NotificationTemplate>) => setDrafts({ ...drafts, [t.id]: { ...(drafts[t.id] ?? {}), ...p } });
        return (
          <PanelCard key={t.id} title={`${t.name} · ${t.channel}`}>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-semibold text-ink/80">Subject</span>
                <input className={`${inp} mt-1`} value={d.subject ?? ""} onChange={(e) => set({ subject: e.target.value })} /></label>
              <label className="block"><span className="text-xs font-semibold text-ink/80">Body</span>
                <textarea rows={3} className={`${inp} mt-1`} value={d.draft_body ?? d.body} onChange={(e) => set({ draft_body: e.target.value })} /></label>
              <p className="text-[11px] text-muted-foreground">Variables: {t.variables.map((v: string) => `{{${v}}}`).join(", ")}</p>
              {preview === t.id ? <pre className="whitespace-pre-wrap rounded-xl border bg-cyan-soft/40 p-3 text-xs">{d.draft_body ?? d.body}</pre> : null}
              <div className="flex flex-wrap justify-end gap-2">
                <button className={btnGhost} onClick={async () => {
                  try { await repo.saveNotificationTemplate({ id: t.id, patch: { draft_body: d.draft_body ?? d.body, draft_subject: d.subject ?? null }, prev: t }); toast.success("Draft saved"); }
                  catch (e) { toast.error((e as Error).message); }
                }}>Save Draft</button>
                <button className={btnGhost} onClick={() => setPreview(preview === t.id ? null : t.id)}>Preview</button>
                <button className={btn} onClick={async () => {
                  try {
                    await repo.saveNotificationTemplate({ id: t.id, patch: { body: d.draft_body ?? d.body, subject: d.subject ?? null, draft_body: null }, prev: t });
                    setNotifs(await repo.listNotificationTemplates());
                    toast.success("Template published");
                  } catch (e) { toast.error((e as Error).message); }
                }}><Save className="h-4 w-4" /> Publish</button>
              </div>
            </div>
          </PanelCard>
        );
      }) : docs.map((doc) => (
        <PanelCard key={doc.id} title={doc.name}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink/80 sm:col-span-2">
              <input type="checkbox" checked={doc.is_enabled} onChange={async (e) => {
                await repo.saveDocumentTemplate({ id: doc.id, patch: { is_enabled: e.target.checked }, prev: doc });
                setDocs(await repo.listDocumentTemplates());
              }} /> Enabled
            </label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Header</span>
              <input className={`${inp} mt-1`} defaultValue={doc.header ?? ""} onBlur={(e) => repo.saveDocumentTemplate({ id: doc.id, patch: { header: e.target.value }, prev: doc })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Footer</span>
              <input className={`${inp} mt-1`} defaultValue={doc.footer ?? ""} onBlur={(e) => repo.saveDocumentTemplate({ id: doc.id, patch: { footer: e.target.value }, prev: doc })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Logo URL</span>
              <input className={`${inp} mt-1`} defaultValue={doc.logo_url ?? ""} onBlur={(e) => repo.saveDocumentTemplate({ id: doc.id, patch: { logo_url: e.target.value }, prev: doc })} /></label>
            <label className="block"><span className="text-xs font-semibold text-ink/80">Signature URL</span>
              <input className={`${inp} mt-1`} defaultValue={doc.signature_url ?? ""} onBlur={(e) => repo.saveDocumentTemplate({ id: doc.id, patch: { signature_url: e.target.value }, prev: doc })} /></label>
            <label className="block sm:col-span-2"><span className="text-xs font-semibold text-ink/80">Terms</span>
              <textarea rows={2} className={`${inp} mt-1`} defaultValue={doc.terms ?? ""} onBlur={(e) => repo.saveDocumentTemplate({ id: doc.id, patch: { terms: e.target.value }, prev: doc })} /></label>
          </div>
        </PanelCard>
      ))}
    </div>
  );
}

/* ============ integrations ============ */
export function IntegrationsPanel({ only, search }: { only?: string[]; search: string }) {
  const [rows, setRows] = useState<repoTypes.IntegrationSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { enabled: boolean; config: Record<string, unknown> }>>({});
  useEffect(() => { repo.listIntegrations().then(setRows).catch((e) => toast.error(e.message)); }, []);

  const q = search.trim().toLowerCase();
  const defs = INTEGRATION_DEFS
    .filter((d) => !only || only.includes(d.provider))
    .filter((d) => !q || d.title.toLowerCase().includes(q) || d.keywords.some((k) => k.includes(q)));

  return (
    <div className="space-y-4">
      {defs.map((def) => {
        const existing = rows.find((r) => r.provider === def.provider);
        const draft = drafts[def.provider] ?? { enabled: existing?.is_enabled ?? false, config: (existing?.config as Record<string, unknown>) ?? {} };
        const set = (p: Partial<typeof draft>) => setDrafts({ ...drafts, [def.provider]: { ...draft, ...p } });
        return (
          <PanelCard key={def.provider} title={def.title}>
            <label className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink/80">
              <input type="checkbox" checked={draft.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Enabled
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {def.fields.map((f) => (
                <label key={f.key} className="block"><span className="text-xs font-semibold text-ink/80">{f.label}</span>
                  {f.type === "select" ? (
                    <select className={`${inp} mt-1`} value={String(draft.config[f.key] ?? "")} onChange={(e) => set({ config: { ...draft.config, [f.key]: e.target.value } })}>
                      <option value="">Select…</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type === "number" ? "number" : "text"} className={`${inp} mt-1`} value={String(draft.config[f.key] ?? "")}
                      onChange={(e) => set({ config: { ...draft.config, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value } })} />
                  )}
                </label>
              ))}
            </div>
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-800">
              Secret keys ({def.secrets.join(", ")}) are never stored or shown here. They live in encrypted backend secret storage and are only read by server code.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button className={btnGhost} onClick={() => toast.info("Test dispatch requires the provider secret to be configured in backend secret storage.")}>Send Test</button>
              <button className={btn} onClick={async () => {
                try { await repo.saveIntegration({ provider: def.provider, category: def.category, isEnabled: draft.enabled, config: draft.config, secretKeys: def.secrets }); setRows(await repo.listIntegrations()); toast.success(`${def.title} saved`); }
                catch (e) { toast.error((e as Error).message); }
              }}><Save className="h-4 w-4" /> Save</button>
            </div>
          </PanelCard>
        );
      })}
      {defs.length === 0 ? <EmptyState text="No integrations match your search." /> : null}
    </div>
  );
}

/* ============ numbering ============ */
export function NumberingPanel() {
  const [rows, setRows] = useState<repoTypes.NumberingSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<repoTypes.NumberingSetting>>>({});
  useEffect(() => { repo.listNumbering().then(setRows).catch((e) => toast.error(e.message)); }, []);

  return (
    <div className="space-y-3">
      {rows.map((n) => {
        const d = { ...n, ...(drafts[n.id] ?? {}) } as repoTypes.NumberingSetting;
        const set = (p: Partial<repoTypes.NumberingSetting>) => setDrafts({ ...drafts, [n.id]: { ...(drafts[n.id] ?? {}), ...p } });
        return (
          <PanelCard key={n.id} title={n.name} action={<span className="rounded-full bg-cyan-soft px-3 py-1 text-[11px] font-bold text-ink">{repo.previewNumber(d)}</span>}>
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="block"><span className="text-xs font-semibold text-ink/80">Prefix</span><input className={`${inp} mt-1`} value={d.prefix} onChange={(e) => set({ prefix: e.target.value })} /></label>
              <label className="block sm:col-span-2"><span className="text-xs font-semibold text-ink/80">Format</span><input className={`${inp} mt-1`} value={d.format} onChange={(e) => set({ format: e.target.value })} /></label>
              <label className="block"><span className="text-xs font-semibold text-ink/80">Padding</span><input type="number" className={`${inp} mt-1`} value={d.padding} onChange={(e) => set({ padding: Number(e.target.value) })} /></label>
            </div>
            <div className="mt-3 flex justify-end">
              <button className={btn} onClick={async () => {
                try { await repo.saveNumbering({ id: n.id, patch: { prefix: d.prefix, format: d.format, padding: d.padding }, prev: n }); setRows(await repo.listNumbering()); toast.success("Numbering saved"); }
                catch (e) { toast.error((e as Error).message); }
              }}><Save className="h-4 w-4" /> Save</button>
            </div>
          </PanelCard>
        );
      })}
    </div>
  );
}

/* ============ role permissions ============ */
export function RolesPanel() {
  const [rows, setRows] = useState<repoTypes.RolePermission[]>([]);
  useEffect(() => { repo.listRolePermissions().then(setRows).catch((e) => toast.error(e.message)); }, []);
  const modules = Array.from(new Set(rows.map((r) => r.module)));
  const roles = Array.from(new Set(rows.map((r) => r.role)));

  const toggle = async (row: repoTypes.RolePermission, perm: string) => {
    const next = row.permissions.includes(perm) ? row.permissions.filter((p: string) => p !== perm) : [...row.permissions, perm];
    try {
      await repo.saveRolePermission({ role: row.role, module: row.module, permissions: next });
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, permissions: next } : r)));
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-800">
        <ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> Super Admin always retains full access; the matrix below governs the other roles.
      </p>
      {roles.map((role) => (
        <PanelCard key={role} title={role.replace(/_/g, " ").toUpperCase()}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-ink"><th className="p-2">Module</th>{PERMISSION_KEYS.map((p) => <th key={p} className="p-2 capitalize">{p.replace(/_/g, " ")}</th>)}</tr></thead>
              <tbody>
                {modules.map((m) => {
                  const row = rows.find((r) => r.role === role && r.module === m);
                  if (!row) return null;
                  return (
                    <tr key={m} className="border-t">
                      <td className="p-2 font-semibold capitalize text-ink">{m}</td>
                      {PERMISSION_KEYS.map((p) => (
                        <td key={p} className="p-2">
                          <input type="checkbox" disabled={role === "super_admin"} checked={row.permissions.includes(p)} onChange={() => toggle(row, p)} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PanelCard>
      ))}
    </div>
  );
}

/* ============ backup ============ */
export function BackupPanel() {
  const [counts, setCounts] = useState<Array<{ table: string; count: number }>>([]);
  useEffect(() => { repo.dataSnapshot().then(setCounts).catch(() => setCounts([])); }, []);
  return (
    <div className="space-y-4">
      <PanelCard title="Record Counts">
        <div className="grid gap-3 sm:grid-cols-3">
          {counts.map((c) => (
            <div key={c.table} className="rounded-xl border p-4">
              <p className="text-xs font-semibold capitalize text-muted-foreground">{c.table.replace(/_/g, " ")}</p>
              <p className="text-2xl font-black text-ink">{c.count}</p>
            </div>
          ))}
        </div>
      </PanelCard>
      <PanelCard title="Backup & Export">
        <p className="text-sm text-muted-foreground">
          <Database className="mr-1 inline h-4 w-4" /> Database exports are performed from the secure backend console. Destructive operations are intentionally
          unavailable from the browser; no service credentials are exposed to this page.
        </p>
      </PanelCard>
    </div>
  );
}

/* ============ history / audit ============ */
export function HistoryPanel() {
  const [rows, setRows] = useState<repoTypes.ConfigHistoryRow[]>([]);
  useEffect(() => { repo.listHistory().then(setRows).catch((e) => toast.error(e.message)); }, []);
  return (
    <PanelCard title="Configuration Change History" action={<History className="h-4 w-4 text-brand" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cyan-soft/60 text-left text-xs font-bold text-ink">
            <tr><th className="p-3">When</th><th className="p-3">Who</th><th className="p-3">Change</th><th className="p-3">Old</th><th className="p-3">New</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 text-xs">{r.changed_by_email ?? "—"}</td>
                <td className="p-3 text-xs font-semibold text-ink">{r.label}</td>
                <td className="p-3 max-w-[220px] truncate text-[11px] text-muted-foreground">{JSON.stringify(r.old_value)}</td>
                <td className="p-3 max-w-[220px] truncate text-[11px] text-muted-foreground">{JSON.stringify(r.new_value)}</td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No configuration changes recorded yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </PanelCard>
  );
}

export { SETTINGS_GROUPS };
