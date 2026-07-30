import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppRole } from "@/lib/auth";
import {
  approveUser, assignRole, deleteUser, listBranchOptions, listUsers, setUserStatus,
  type ManagedUser, type UserStatus,
} from "@/lib/users.repo";
import type { Filters, RowAction } from "@/components/erp/UserTable";

const PAGE_SIZE = 10;

export function useUserManagement(initialStatus: UserStatus | "all" = "all") {
  const [filters, setFilters] = useState<Filters>({ q: "", status: initialStatus, role: "all", branchId: "all" });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => { listBranchOptions().then(setBranches).catch(() => setBranches([])); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { rows: r, total: t } = await listUsers({ ...filters, page, pageSize: PAGE_SIZE });
      setRows(r);
      setTotal(t);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const t = setTimeout(load, filters.q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, filters.q]);

  useEffect(() => { setPage(1); }, [filters.q, filters.status, filters.role, filters.branchId]);

  const runAction = useCallback(
    async (user: ManagedUser, action: RowAction, payload: { role: AppRole; branchId: string | null; reason?: string }) => {
      setBusyId(user.id);
      try {
        switch (action) {
          case "approve":
            await approveUser(user.id, payload.role, payload.branchId);
            toast.success(`${user.full_name || user.email} approved`);
            break;
          case "role":
            await assignRole(user.id, payload.role, payload.branchId);
            toast.success("Role updated");
            break;
          case "reject":
            await setUserStatus(user.id, "rejected", payload.reason);
            toast.success("User rejected");
            break;
          case "suspend":
            await setUserStatus(user.id, "suspended");
            toast.success("User suspended");
            break;
          case "activate":
            await setUserStatus(user.id, "approved");
            toast.success("User activated");
            break;
          case "deactivate":
            await setUserStatus(user.id, "inactive");
            toast.success("User deactivated");
            break;
          case "delete":
            await deleteUser(user.id);
            toast.success("User deleted");
            break;
        }
        await load();
      } catch (e: any) {
        toast.error(e?.message ?? "Action failed");
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  return { filters, setFilters, page, setPage, pageSize: PAGE_SIZE, rows, total, loading, busyId, branches, reload: load, runAction };
}
