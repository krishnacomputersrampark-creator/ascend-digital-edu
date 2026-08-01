import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export type ModuleSection = {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
};

export function ModuleGrid({ sections }: { sections: ModuleSection[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((s) => {
        const inner = (
          <>
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-soft text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              <div className="text-base font-bold text-ink">{s.title}</div>
            </div>
            <p className="text-sm text-muted-foreground">{s.body}</p>
            {s.to && (
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                Open <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </>
        );
        const cls =
          "block rounded-2xl border border-border bg-white p-5 shadow-soft transition hover:border-brand";
        return s.to ? (
          <Link key={s.title} to={s.to} className={cls}>{inner}</Link>
        ) : (
          <div key={s.title} className={cls}>{inner}</div>
        );
      })}
    </div>
  );
}

export function ModuleStats({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-2xl border border-border bg-white p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{i.label}</div>
          <div className="mt-1 text-2xl font-extrabold text-ink">{i.value}</div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-white/60 p-10 text-center">
      <div className="text-sm font-bold text-ink">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}