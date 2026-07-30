import { useMemo, useState } from "react";
import { Loader2, Search, ChevronLeft, ChevronRight, ShieldCheck, Ban, RotateCcw, Trash2, CheckCircle2, XCircle, PowerOff } from "lucide-react";
import { ROLE_LABEL, type AppRole } from "@/lib/auth";
import { STATUS_CLASS, STATUS_LABEL, USER_STATUSES, type ManagedUser, type UserStatus } from "@/lib/users.repo";

export const ASSIGNABLE_ROLES: AppRole[] = ["super_admin", "admin", "branch_manager", "faculty", "student", "guest"];

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CLASS[status] ?? STATUS_CLASS.pending}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export type Filters = {
  q: string;
  status: UserStatus | "all";
  role: AppRole | "all";
  branchId: string | "all";
};

export function UserFilters({
  value, onChange, branches, hideStatus = false,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  branches: Array<{ id: string; name: string }>;
  hideStatus?: boolean;
}) {
  const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="Search name, email or mobile"
          className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>
      {!hideStatus && (
        <select className={sel} value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value as any })}>
          <option value="all">All statuses</option>
          {USER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      )}
      <select className={sel} value={value.role} onChange={(e) => onChange({ ...value, role: e.target.value as any })}>
        <option value="all">All roles</option>
        {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      <select className={sel} value={value.branchId} onChange={(e) => onChange({ ...value, branchId: e.target.value })}>
        <option value="all">All branches</option>
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-white shadow-soft" />
      ))}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {total === 0 ? "No records" : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 font-semibold text-ink">{page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white disabled:opacity-40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export type RowAction = "approve" | "reject" | "suspend" | "activate" | "deactivate" | "delete" | "role";

export function UserRowCard({
  user, branches, busy, canManage, onAction,
}: {
  user: ManagedUser;
  branches: Array<{ id: string; name: string }>;
  busy: boolean;
  canManage: boolean;
  onAction: (action: RowAction, payload: { role: AppRole; branchId: string | null; reason?: string }) => void;
}) {
  const [role, setRole] = useState<AppRole>((user.role as AppRole) ?? user.requested_role ?? "student");
  const [branchId, setBranchId] = useState<string>(user.branch_id ?? "");
  const branchName = useMemo(() => branches.find((b) => b.id === user.branch_id)?.name ?? "—", [branches, user.branch_id]);
  const payload = () => ({ role, branchId: branchId || null });

  const btn = "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-[220px] flex-1 items-center gap-3">
          {user.photo_url ? (
            <img src={user.photo_url} alt={user.full_name ?? "User"} className="h-11 w-11 rounded-xl object-cover ring-1 ring-border" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-soft text-sm font-bold text-brand">
              {(user.full_name || user.email || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-ink">{user.full_name || "Unnamed user"}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            <div className="text-xs text-muted-foreground">{user.mobile || "No mobile"}</div>
          </div>
        </div>

        <div className="min-w-[150px] text-xs text-muted-foreground">
          <div><span className="font-semibold text-ink">Registered:</span> {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "—"}</div>
          <div><span className="font-semibold text-ink">Branch:</span> {branchName}</div>
          <div><span className="font-semibold text-ink">Requested:</span> {ROLE_LABEL[(user.requested_role as AppRole) ?? "student"]}</div>
          <div><span className="font-semibold text-ink">Last login:</span> {user.last_login ? new Date(user.last_login).toLocaleString("en-IN") : "Never"}</div>
        </div>

        <div className="flex flex-col items-start gap-2">
          <StatusBadge status={user.status} />
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
            <ShieldCheck className="h-3.5 w-3.5" /> {ROLE_LABEL[(user.role as AppRole) ?? "guest"]}
          </span>
        </div>
      </div>

      {user.rejection_reason && (
        <p className="mt-3 rounded-xl bg-red-50 p-2 text-xs text-red-700"><b>Rejection reason:</b> {user.rejection_reason}</p>
      )}

      {canManage && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
          <select value={role} onChange={(e) => setRole(e.target.value as AppRole)} className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs">
            {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs">
            <option value="">No branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          {user.status !== "approved" && (
            <button disabled={busy} onClick={() => onAction("approve", payload())} className={`${btn} bg-emerald-600 text-white`}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
            </button>
          )}
          {user.status === "approved" && (
            <button disabled={busy} onClick={() => onAction("role", payload())} className={`${btn} bg-brand text-white`}>
              <ShieldCheck className="h-3.5 w-3.5" /> Update Role
            </button>
          )}
          {user.status !== "rejected" && (
            <button disabled={busy} onClick={() => {
              const reason = window.prompt("Rejection reason");
              if (reason && reason.trim()) onAction("reject", { ...payload(), reason: reason.trim() });
            }} className={`${btn} bg-red-600 text-white`}>
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
          )}
          {user.status !== "suspended" && (
            <button disabled={busy} onClick={() => onAction("suspend", payload())} className={`${btn} bg-orange-500 text-white`}>
              <Ban className="h-3.5 w-3.5" /> Suspend
            </button>
          )}
          {user.status !== "approved" && (
            <button disabled={busy} onClick={() => onAction("activate", payload())} className={`${btn} border border-border bg-white text-ink`}>
              <RotateCcw className="h-3.5 w-3.5" /> Activate
            </button>
          )}
          {user.status !== "inactive" && (
            <button disabled={busy} onClick={() => onAction("deactivate", payload())} className={`${btn} border border-border bg-white text-ink`}>
              <PowerOff className="h-3.5 w-3.5" /> Deactivate
            </button>
          )}
          <button disabled={busy} onClick={() => {
            if (window.confirm(`Delete ${user.full_name || user.email}? This cannot be undone.`)) onAction("delete", payload());
          }} className={`${btn} border border-red-200 bg-white text-red-600`}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
