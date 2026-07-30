import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, UserPlus, CheckCircle2, ArrowRight } from "lucide-react";
import { countRegisteredToday, countUsersByStatus, listRecentlyApproved, type ManagedUser } from "@/lib/users.repo";
import { ROLE_LABEL, type AppRole } from "@/lib/auth";

export function PendingApprovalWidget() {
  const [pending, setPending] = useState<number | null>(null);
  const [today, setToday] = useState(0);
  const [recent, setRecent] = useState<ManagedUser[]>([]);

  useEffect(() => {
    Promise.all([countUsersByStatus("pending"), countRegisteredToday(), listRecentlyApproved(5)])
      .then(([p, t, r]) => { setPending(p); setToday(t); setRecent(r); })
      .catch(() => setPending(0));
  }, []);

  if (pending === null) return <div className="h-40 animate-pulse rounded-2xl bg-white shadow-soft" />;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-ink">User Approvals</h3>
        <Link to="/admin/users/pending" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
          Review <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-amber-50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700"><Clock className="h-4 w-4" /> Pending Users</div>
          <div className="mt-1 text-2xl font-extrabold text-amber-800">{pending}</div>
        </div>
        <div className="rounded-xl bg-cyan-soft/60 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand"><UserPlus className="h-4 w-4" /> Today&apos;s Registrations</div>
          <div className="mt-1 text-2xl font-extrabold text-brand-dark">{today}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Recently Approved
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">No approvals yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {recent.map((u) => (
              <li key={u.id} className="flex items-center justify-between text-xs">
                <span className="truncate font-semibold text-ink">{u.full_name || u.email}</span>
                <span className="ml-2 shrink-0 text-muted-foreground">{ROLE_LABEL[(u.role as AppRole) ?? "guest"]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}