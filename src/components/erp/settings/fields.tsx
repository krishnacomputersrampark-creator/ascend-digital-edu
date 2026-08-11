import { useState } from "react";
import { X } from "lucide-react";
import type { SettingField } from "@/lib/settings.schema";

export function TagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t || value.includes(t)) { setDraft(""); return; }
    onChange([...value, t]);
    setDraft("");
  };
  return (
    <div className="mt-1 rounded-xl border bg-white/80 p-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-cyan-soft px-2.5 py-1 text-xs font-semibold text-ink">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder="Type and press Enter"
        className="mt-1 w-full bg-transparent px-1 py-1 text-sm outline-none"
      />
    </div>
  );
}

export function SettingInput({
  field, value, onChange,
}: { field: SettingField; value: unknown; onChange: (v: unknown) => void }) {
  const base = "mt-1 w-full rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  if (field.type === "switch") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        onClick={() => onChange(!value)}
        className={`mt-1 inline-flex h-6 w-11 items-center rounded-full transition ${value ? "bg-brand" : "bg-slate-300"}`}
      >
        <span className={`h-5 w-5 rounded-full bg-background shadow transition ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    );
  }
  if (field.type === "textarea") {
    return <textarea rows={3} className={base} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
  }
  if (field.type === "select") {
    return (
      <select className={base} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (field.type === "tags") {
    return <TagsInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
  }
  if (field.type === "color") {
    return (
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={String(value ?? "#1d4ed8")} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded-lg border" />
        <input className={`${base} mt-0`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === "number") {
    return <input type="number" className={base} value={value === null || value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
  }
  return (
    <input
      type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
      className={base}
      value={String(value ?? "")}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function FieldRow({ field, children }: { field: SettingField; children: React.ReactNode }) {
  return (
    <label className={`block ${field.span === 2 ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-ink/80">{field.label}</span>
      {children}
      {field.help ? <span className="mt-1 block text-[11px] text-muted-foreground">{field.help}</span> : null}
    </label>
  );
}

export function PanelCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass-card rounded-2xl p-5 shadow-soft">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</p>;
}

export function Loading() {
  return <p className="animate-pulse rounded-2xl border p-8 text-center text-sm text-muted-foreground">Loading configuration…</p>;
}
