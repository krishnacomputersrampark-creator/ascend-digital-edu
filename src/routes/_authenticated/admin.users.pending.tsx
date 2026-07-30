import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Users } from "lucide-react";
import { DashboardShell } from "@/components/erp/DashboardShell";
import { UserFilters, UserRowCard, TableSkeleton, Pagination } from "@/components/erp/UserTable";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/users/pending")({
  head: () => ({ meta: [{ title: "Pending Approvals · KCC ERP" }, { name: "robots", content: "noindex" }] }),
  component: PendingUsers,
});

function PendingUsers() {
  const { role } = useAuth();
  const canManage = role === "super_admin" || role === "admin";
  const m = useUserManagement("pending");

  return (
    <DashboardShell
      title="Pending Approvals"
      subtitle="Review new registrations and grant ERP access"
      actions={
        <Link to="/admin/users" className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-brand">
          <Users className="h-4 w-4" /> All Users
        </Link>
      }
    >
      {!canManage ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
          You do not have permission to approve users.
        </div>
      ) : (
        <>
          <UserFilters value={m.filters} onChange={m.setFilters} branches={m.branches} hideStatus />
          {m.loading ? (
            <TableSkeleton />
          ) : m.rows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-10 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm text-muted-foreground">No pending registrations. Everyone is up to date.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {m.rows.map((u) => (
                <UserRowCard
                  key={u.id}
                  user={u}
                  branches={m.branches}
                  busy={m.busyId === u.id}
                  canManage={canManage}
                  onAction={(action, payload) => m.runAction(u, action, payload)}
                />
              ))}
            </div>
          )}
          <Pagination page={m.page} pageSize={m.pageSize} total={m.total} onPage={m.setPage} />
        </>
      )}
    </DashboardShell>
  );
}
