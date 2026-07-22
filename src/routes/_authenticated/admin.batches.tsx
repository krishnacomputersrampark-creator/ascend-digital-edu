import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/batches")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/batches" }); },
});